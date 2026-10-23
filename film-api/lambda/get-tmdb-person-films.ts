import { createApiResponse, logger } from "./utils"
import axios from "axios"
import { connectToDatabase, findCollectedTmdbIds } from "./mongodb"
import { isCredited } from "./tmdb-cast"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

const PERSON_KINDS = ["actor", "director"] as const
type PersonKind = (typeof PERSON_KINDS)[number]

interface TmdbMovieCredit {
  id: number
  title: string
  release_date?: string
  vote_average?: number
  vote_count?: number
  character?: string
  job?: string
}

interface TmdbPersonWithCredits {
  movie_credits?: {
    cast?: TmdbMovieCredit[]
    crew?: TmdbMovieCredit[]
  }
}

const creditsForKind = (person: TmdbPersonWithCredits, kind: PersonKind) =>
  kind === "actor"
    ? (person.movie_credits?.cast ?? []).filter(isCredited)
    : (person.movie_credits?.crew ?? []).filter((credit) => credit.job === "Director")

// One film per TMDb ID; an actor with several roles in it keeps every character.
const mergeByFilm = (credits: TmdbMovieCredit[]) => {
  const films = new Map<number, TmdbMovieCredit & { characters: string[] }>()
  for (const credit of credits) {
    const film = films.get(credit.id) ?? { ...credit, characters: [] }
    if (credit.character && !film.characters.includes(credit.character)) {
      film.characters.push(credit.character)
    }
    films.set(credit.id, film)
  }
  return [...films.values()]
}

// Newest first, with undated films last; ISO dates sort correctly as strings.
const byReleaseDateDescending = (first: TmdbMovieCredit, second: TmdbMovieCredit) => {
  if (first.release_date && second.release_date) {
    return (
      second.release_date.localeCompare(first.release_date) ||
      first.title.localeCompare(second.title)
    )
  }
  if (first.release_date) {
    return -1
  }
  if (second.release_date) {
    return 1
  }
  return first.title.localeCompare(second.title)
}

const handler = async (event: any) => {
  try {
    const tmdbPersonId = event.pathParameters?.tmdbPersonId
    const kind = event.queryStringParameters?.kind

    // The route needs no sign-in and the ID goes into the TMDb URL, so only digits are accepted.
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

    if (!TMDB_API_KEY) {
      throw new Error("TMDB_API_KEY environment variable not set")
    }

    const response = await axios.get<TmdbPersonWithCredits>(
      `${TMDB_BASE_URL}/person/${tmdbPersonId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "movie_credits",
        },
      }
    )

    const films = mergeByFilm(creditsForKind(response.data, kind)).sort(byReleaseDateDescending)

    await connectToDatabase()
    const collected = await findCollectedTmdbIds(films.map((film) => film.id.toString()))

    return createApiResponse(200, {
      data: films.map((film) => ({
        tmdbId: film.id.toString(),
        title: film.title,
        year: film.release_date ? Number(film.release_date.slice(0, 4)) : null,
        ...(kind === "actor" && { character: film.characters.join(" / ") || null }),
        tmdbRating: film.vote_average ?? null,
        tmdbVoteCount: film.vote_count ?? 0,
        inCollection: collected.has(film.id.toString()),
      })),
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

export { handler }
