import { createApiResponse, logger } from "./utils"
import axios from "axios"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

interface TmdbSearchResult {
  id: number
  title: string
  release_date?: string
  poster_path?: string
  overview?: string
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[]
}

const handler = async (event: any) => {
  try {
    const query = event.queryStringParameters?.query
    const year = event.queryStringParameters?.year

    if (!query) {
      throw new Error("Query parameter is required")
    }

    if (!TMDB_API_KEY) {
      throw new Error("TMDB_API_KEY environment variable not set")
    }

    const params: any = {
      api_key: TMDB_API_KEY,
      query: query,
    }

    if (year) {
      params.year = year
    }

    const response = await axios.get<TmdbSearchResponse>(`${TMDB_BASE_URL}/search/movie`, { params })

    const results = response.data.results.map((film) => ({
      tmdbId: film.id.toString(),
      title: film.title,
      year: film.release_date ? new Date(film.release_date).getFullYear() : null,
      posterPath: film.poster_path,
      overview: film.overview,
    }))

    return createApiResponse(200, {
      data: results,
      count: results.length,
    })
  } catch (error) {
    logger.error(`Error searching TMDB: ${error}`)
    return createApiResponse(502, {
      message: "Could not search TMDB",
    })
  }
}

export { handler }
