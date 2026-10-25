import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import axios from "axios"
import { connectToDatabase, findCollectedTmdbIds } from "./mongodb"
import { isCredited } from "./tmdb-cast"
import { mapWithConcurrency } from "./concurrency"
import { fetchOmdbFigures, OmdbRejectedError } from "./omdb"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const OMDB_API_KEY = process.env.OMDB_API_KEY
// A hard limit per request; axios's own `timeout` only limits idle time, not a slow trickle
const REQUEST_TIMEOUT_MS = 5000
// Each lookup waits for one request at a time, so this caps requests in flight to TMDb and OMDb
export const CONCURRENT_LOOKUPS = 10
// No new request starts after this, keeping the worst case near 25 seconds, under API Gateway's 29
export const LOOKUP_BUDGET_MS = 20000
// Films with fewer IMDb votes than this are left out
export const MIN_IMDB_VOTES = 1000

const PERSON_KINDS = ["actor", "director"] as const
type PersonKind = (typeof PERSON_KINDS)[number]

interface TmdbMovieCredit {
  id: number
  title: string
  release_date?: string
  character?: string
  job?: string
}

interface TmdbPersonWithCredits {
  movie_credits?: {
    cast?: TmdbMovieCredit[]
    crew?: TmdbMovieCredit[]
  }
}

type MergedCredit = TmdbMovieCredit & { characters: string[] }
type ReleasedCredit = MergedCredit & { release_date: string }

interface TmdbFilmDetails {
  status?: string
  external_ids?: { imdb_id?: string | null }
}

interface PersonFilm {
  tmdbId: string
  title: string
  year: number
  character?: string | null
  imdbId: string
  imdbRating: number
  imdbVotes: number
}

interface LookupContext {
  kind: PersonKind
  omdbApiKey: string
  deadline: number
}

// Failures and time-outs are told apart from other hidden films, for the outage check and the log
type LookupOutcome = PersonFilm | "hidden" | "failed" | "timedOut"

const creditsForKind = (person: TmdbPersonWithCredits, kind: PersonKind) =>
  kind === "actor"
    ? (person.movie_credits?.cast ?? []).filter(isCredited)
    : (person.movie_credits?.crew ?? []).filter((credit) => credit.job === "Director")

// One film per TMDb ID; an actor with several roles in it keeps every character.
const mergeByFilm = (credits: TmdbMovieCredit[]): MergedCredit[] => {
  const films = new Map<number, MergedCredit>()
  for (const credit of credits) {
    const film = films.get(credit.id) ?? { ...credit, characters: [] }
    if (credit.character && !film.characters.includes(credit.character)) {
      film.characters.push(credit.character)
    }
    films.set(credit.id, film)
  }
  return [...films.values()]
}

// ISO dates compare correctly as strings, so a film released today counts as released
const hasBeenReleased = (credit: MergedCredit, today: string): credit is ReleasedCredit =>
  !!credit.release_date && credit.release_date <= today

// Newest first, so the oldest films are the ones the time budget cuts off
const byReleaseDateDescending = (first: ReleasedCredit, second: ReleasedCredit) =>
  second.release_date.localeCompare(first.release_date) || first.title.localeCompare(second.title)

// One call gives both the release status and the IMDb ID; null when TMDb doesn't know the film
const fetchTmdbDetails = async (tmdbId: string): Promise<TmdbFilmDetails | null> => {
  try {
    const response = await axios.get<TmdbFilmDetails>(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY, append_to_response: "external_ids" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

const lookUpFilm = async (credit: ReleasedCredit, context: LookupContext): Promise<LookupOutcome> => {
  const tmdbId = credit.id.toString()
  try {
    if (Date.now() > context.deadline) {
      return "timedOut"
    }
    const details = await fetchTmdbDetails(tmdbId)
    const imdbId = details?.external_ids?.imdb_id
    if (details?.status !== "Released" || !imdbId) {
      return "hidden"
    }
    if (Date.now() > context.deadline) {
      return "timedOut"
    }
    const { imdbRating, imdbVotes } = await fetchOmdbFigures(imdbId, context.omdbApiKey, REQUEST_TIMEOUT_MS)
    if (imdbRating === null || imdbVotes === null || imdbVotes < MIN_IMDB_VOTES) {
      return "hidden"
    }
    return {
      tmdbId,
      title: credit.title,
      year: Number(credit.release_date.slice(0, 4)),
      ...(context.kind === "actor" && { character: credit.characters.join(" / ") || null }),
      imdbId,
      imdbRating,
      imdbVotes,
    }
  } catch (error) {
    if (error instanceof OmdbRejectedError) {
      throw error
    }
    logger.warn(`Could not look up TMDb film ${tmdbId}: ${error}`)
    return "failed"
  }
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const tmdbPersonId = event.pathParameters?.tmdbPersonId
    const kind = event.queryStringParameters?.kind

    // The ID goes into the TMDb URL, so only digits are accepted.
    if (!/^\d+$/.test(tmdbPersonId ?? "")) {
      return createApiResponse(400, {
        message: "tmdbPersonId path parameter must be a TMDb person ID",
      })
    }

    if (!PERSON_KINDS.includes(kind)) {
      return createApiResponse(400, {
        message: "kind query parameter must be actor or director",
      })
    }

    if (!TMDB_API_KEY || !OMDB_API_KEY) {
      throw new Error("TMDB_API_KEY and OMDB_API_KEY environment variables must be set")
    }

    const deadline = Date.now() + LOOKUP_BUDGET_MS
    const response = await axios.get<TmdbPersonWithCredits>(
      `${TMDB_BASE_URL}/person/${tmdbPersonId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "movie_credits",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    )

    const credits = mergeByFilm(creditsForKind(response.data, kind))

    await connectToDatabase()
    const collected = await findCollectedTmdbIds(credits.map((credit) => credit.id.toString()))
    // The modal lists collection films from the database, so they're neither looked up nor counted
    const otherCredits = credits.filter((credit) => !collected.has(credit.id.toString()))

    // Undated and future films are dropped before any lookup, which costs nothing
    const today = new Date().toISOString().slice(0, 10)
    const candidates = otherCredits
      .filter((credit) => hasBeenReleased(credit, today))
      .sort(byReleaseDateDescending)

    const context: LookupContext = { kind, omdbApiKey: OMDB_API_KEY, deadline }
    const outcomes = await mapWithConcurrency(candidates, CONCURRENT_LOOKUPS, (credit) =>
      lookUpFilm(credit, context)
    )

    // An empty 200 would pass an outage off as a filmography with nothing worth showing
    const attempted = outcomes.filter((outcome) => outcome !== "timedOut")
    if (attempted.length > 0 && attempted.every((outcome) => outcome === "failed")) {
      throw new Error(`Every film lookup failed for TMDb person ${tmdbPersonId}`)
    }

    const films = outcomes.filter((outcome): outcome is PersonFilm => typeof outcome !== "string")
    const timedOutCount = outcomes.filter((outcome) => outcome === "timedOut").length

    if (timedOutCount > 0) {
      logger.warn(
        `Time budget ran out for TMDb person ${tmdbPersonId}; ${timedOutCount} films were not looked up`
      )
    }

    return createApiResponse(200, {
      data: { films, hiddenCount: otherCredits.length - films.length },
    })
  } catch (error) {
    logger.error(`Error fetching TMDB person films: ${error}`)

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return createApiResponse(404, {
        message: "Person not found on TMDB",
      })
    }

    return createApiResponse(502, {
      message: "Could not fetch TMDB person films",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
