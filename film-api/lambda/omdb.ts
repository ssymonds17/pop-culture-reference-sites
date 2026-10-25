import axios from "axios"
import { logger } from "./utils"

const OMDB_BASE_URL = "https://www.omdbapi.com/"

export interface ImdbFigures {
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
export class OmdbRejectedError extends Error {
  name = "OmdbRejectedError"
}

// OMDb's wording for an unknown title isn't documented, so only these are read as "no rating"
const OMDB_UNKNOWN_TITLE = /incorrect imdb id|not found/i

const NO_FIGURES: ImdbFigures = { imdbRating: null, imdbVotes: null }

// OMDb sends "N/A" when it has no figure, and vote counts with thousands separators.
const parseOmdbNumber = (value?: string): number | null => {
  if (!value || value === "N/A") {
    return null
  }
  const parsed = Number(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

// Throws OmdbRejectedError on a refused key, and an Error for any other failed lookup
export const fetchOmdbFigures = async (
  imdbId: string,
  apiKey: string,
  timeoutMs: number
): Promise<ImdbFigures> => {
  let title: OmdbTitle
  try {
    const response = await axios.get<OmdbTitle>(OMDB_BASE_URL, {
      params: { i: imdbId, apikey: apiKey },
      signal: AbortSignal.timeout(timeoutMs),
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
    return NO_FIGURES
  }

  return {
    imdbRating: parseOmdbNumber(title.imdbRating),
    imdbVotes: parseOmdbNumber(title.imdbVotes),
  }
}
