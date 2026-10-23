import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import axios from "axios"
import { connectToDatabase, findStoredImdbIds } from "./mongodb"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_BASE_URL = "https://www.omdbapi.com/"
// A hard limit per request; axios's own `timeout` only limits idle time, not a slow trickle
const REQUEST_TIMEOUT_MS = 5000
export const MAX_FILMS_PER_REQUEST = 100
// Each lookup waits for one request at a time, so this caps requests in flight to TMDb and OMDb
export const CONCURRENT_LOOKUPS = 10
// No new request starts after this, keeping the worst case near 25 seconds, under API Gateway's 29
export const LOOKUP_BUDGET_MS = 20000

interface ImdbRating {
  imdbId: string | null
  imdbRating: number | null
  imdbVotes: number | null
}

interface OmdbTitle {
  Response: "True" | "False"
  imdbRating?: string
  imdbVotes?: string
  Error?: string
}

// OMDb refused the key (bad, missing or over its daily limit), so every other lookup would fail too
class OmdbRejectedError extends Error {
  name = "OmdbRejectedError"
}

// OMDb's wording for an unknown title isn't documented, so only these are read as "no rating"
const OMDB_UNKNOWN_TITLE = /incorrect imdb id|not found/i

const noRating = (imdbId: string | null): ImdbRating => ({
  imdbId,
  imdbRating: null,
  imdbVotes: null,
})

// OMDb sends "N/A" when it has no figure, and vote counts with thousands separators.
const parseOmdbNumber = (value?: string): number | null => {
  if (!value || value === "N/A") {
    return null
  }
  const parsed = Number(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

// Stops handing out items once one rejects, so no requests carry on after the response
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapItem: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length)
  let next = 0
  let stopped = false
  const worker = async () => {
    while (!stopped && next < items.length) {
      const index = next++
      try {
        results[index] = await mapItem(items[index])
      } catch (error) {
        stopped = true
        throw error
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

const fetchImdbId = async (tmdbId: string): Promise<string | null> => {
  try {
    const response = await axios.get<{ imdb_id?: string | null }>(
      `${TMDB_BASE_URL}/movie/${tmdbId}/external_ids`,
      { params: { api_key: TMDB_API_KEY }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    )
    return response.data.imdb_id || null
  } catch (error) {
    // TMDb doesn't know the film, so there is no IMDb ID to find rather than a failed lookup
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

const fetchOmdbRating = async (imdbId: string): Promise<ImdbRating> => {
  let title: OmdbTitle
  try {
    const response = await axios.get<OmdbTitle>(OMDB_BASE_URL, {
      params: { i: imdbId, apikey: OMDB_API_KEY },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    title = response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new OmdbRejectedError(error.response.data?.Error ?? "OMDb rejected the request")
    }
    throw error
  }

  if (title.Response === "False") {
    if (!OMDB_UNKNOWN_TITLE.test(title.Error ?? "")) {
      throw new Error(`OMDb could not look up ${imdbId}: ${title.Error}`)
    }
    logger.info(`OMDb has no title for ${imdbId}: ${title.Error}`)
    return noRating(imdbId)
  }

  return {
    imdbId,
    imdbRating: parseOmdbNumber(title.imdbRating),
    imdbVotes: parseOmdbNumber(title.imdbVotes),
  }
}

// Null when one film's lookup fails or runs out of time, so the rest of the filmography still loads
const lookUpRating = async (
  tmdbId: string,
  storedImdbIds: Map<string, string>,
  deadline: number
): Promise<ImdbRating | null> => {
  if (Date.now() > deadline) {
    return null
  }
  try {
    const imdbId = storedImdbIds.get(tmdbId) ?? (await fetchImdbId(tmdbId))
    if (!imdbId) {
      return noRating(null)
    }
    if (Date.now() > deadline) {
      return null
    }
    return await fetchOmdbRating(imdbId)
  } catch (error) {
    if (error instanceof OmdbRejectedError) {
      throw error
    }
    logger.warn(`Could not fetch the IMDb rating for TMDb film ${tmdbId}: ${error}`)
    return null
  }
}

// No leading zeros, so "7" and "07" can't be looked up as two films, and at most ten digits
const TMDB_ID = /^[1-9]\d{0,9}$/

const parseTmdbIds = (value: unknown): string[] | null => {
  if (typeof value !== "string" || value === "") {
    return null
  }
  const tmdbIds = [...new Set(value.split(","))]
  const allValid = tmdbIds.every((tmdbId) => TMDB_ID.test(tmdbId))
  return allValid && tmdbIds.length <= MAX_FILMS_PER_REQUEST ? tmdbIds : null
}

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const tmdbIds = parseTmdbIds(event.queryStringParameters?.tmdbIds)

    if (!tmdbIds) {
      return createApiResponse(400, {
        message: `tmdbIds must be up to ${MAX_FILMS_PER_REQUEST} comma-separated TMDb film IDs`,
      })
    }

    if (!TMDB_API_KEY || !OMDB_API_KEY) {
      throw new Error("TMDB_API_KEY and OMDB_API_KEY environment variables must be set")
    }

    const deadline = Date.now() + LOOKUP_BUDGET_MS
    await connectToDatabase()
    const storedImdbIds = await findStoredImdbIds(tmdbIds)

    const ratings = await mapWithConcurrency(tmdbIds, CONCURRENT_LOOKUPS, (tmdbId) =>
      lookUpRating(tmdbId, storedImdbIds, deadline)
    )

    return createApiResponse(200, {
      data: Object.fromEntries(tmdbIds.map((tmdbId, index) => [tmdbId, ratings[index]])),
    })
  } catch (error) {
    logger.error(`Error fetching IMDb ratings: ${error}`)
    return createApiResponse(502, {
      message: "Could not fetch IMDb ratings",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
