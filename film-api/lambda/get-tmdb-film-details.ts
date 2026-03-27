import { createApiResponse, logger } from "./utils"
import axios from "axios"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

interface TmdbFilmDetails {
  id: number
  title: string
  release_date?: string
  runtime?: number
  credits?: {
    crew?: Array<{ id: number; name: string; job: string }>
  }
}

const handler = async (event: any) => {
  try {
    const tmdbId = event.pathParameters?.tmdbId

    if (!tmdbId) {
      return createApiResponse(400, {
        message: "tmdbId path parameter is required",
      })
    }

    if (!TMDB_API_KEY) {
      throw new Error("TMDB_API_KEY environment variable not set")
    }

    const response = await axios.get<TmdbFilmDetails>(
      `${TMDB_BASE_URL}/movie/${tmdbId}`,
      {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: "credits",
        },
      }
    )

    const tmdbDetails = response.data

    // Extract directors from crew
    const directors = tmdbDetails.credits?.crew
      ?.filter((c) => c.job === "Director")
      .map((d) => ({
        tmdbPersonId: d.id.toString(),
        name: d.name,
      })) || []

    return createApiResponse(200, {
      tmdbId: tmdbDetails.id.toString(),
      title: tmdbDetails.title,
      year: tmdbDetails.release_date
        ? new Date(tmdbDetails.release_date).getFullYear()
        : null,
      duration: tmdbDetails.runtime,
      directors,
    })
  } catch (error) {
    logger.error(`Error fetching TMDB film details: ${error}`)

    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return createApiResponse(404, {
        message: "Film not found on TMDB",
      })
    }

    return createApiResponse(502, {
      message: "Could not fetch TMDB film details",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export { handler }
