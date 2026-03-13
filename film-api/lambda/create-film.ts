import { createApiResponse, logger } from "./utils"
import { connectToDatabase, createFilm, getFilmByTmdbId, createDirector, getDirectorByTmdbPersonId, updateDirectorStats } from "./mongodb"
import { FilmData } from "./mongodb/models/film"
import axios from "axios"
import Director from "./mongodb/models/director"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

interface TmdbFilmDetails {
  id: number
  title: string
  release_date?: string
  genres?: Array<{ id: number; name: string }>
  original_language?: string
  runtime?: number
  poster_path?: string
  overview?: string
  vote_average?: number
  credits?: {
    crew?: Array<{ id: number; name: string; job: string }>
  }
  external_ids?: {
    imdb_id?: string
  }
}

const getTmdbFilmDetails = async (tmdbId: string): Promise<TmdbFilmDetails> => {
  const response = await axios.get<TmdbFilmDetails>(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
    params: {
      api_key: TMDB_API_KEY,
      append_to_response: "credits,external_ids",
    },
  })
  return response.data
}

const findOrCreateDirector = async (tmdbPersonId: string, name: string) => {
  let director = await getDirectorByTmdbPersonId(tmdbPersonId)

  if (!director) {
    director = await createDirector({
      tmdbPersonId,
      name: name.toLowerCase(),
      displayName: name,
    })
    logger.info(`Created director: ${name} (${tmdbPersonId})`)
  }

  return director
}

const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body)

    await connectToDatabase()

    // Check if this is a TMDB-based creation (just tmdbId provided)
    if (body.tmdbId && !body.title) {
      if (!TMDB_API_KEY) {
        throw new Error("TMDB_API_KEY environment variable not set")
      }

      const tmdbId = body.tmdbId

      // Check if film already exists
      const existingFilm = await getFilmByTmdbId(tmdbId)
      if (existingFilm) {
        return createApiResponse(409, {
          message: "Film already exists in database",
          filmId: existingFilm._id,
          title: existingFilm.title,
        })
      }

      // Fetch film details from TMDB
      const tmdbDetails = await getTmdbFilmDetails(tmdbId)

      // Extract directors from crew
      const directorIds = []
      if (tmdbDetails.credits?.crew) {
        const directorCrew = tmdbDetails.credits.crew.filter((c) => c.job === "Director")

        for (const directorData of directorCrew) {
          const director = await findOrCreateDirector(
            directorData.id.toString(),
            directorData.name
          )
          directorIds.push(director._id)
        }
      }

      // Extract year from release_date
      const year = tmdbDetails.release_date
        ? new Date(tmdbDetails.release_date).getFullYear()
        : new Date().getFullYear()

      // Create film data
      const filmData: FilmData = {
        title: tmdbDetails.title,
        year: year,
        directors: directorIds,
        watched: false,
        owned: false,
        genres: tmdbDetails.genres ? tmdbDetails.genres.map((g) => g.name) : [],
        language: tmdbDetails.original_language,
        duration: tmdbDetails.runtime,
        tmdbId: tmdbId,
        imdbId: tmdbDetails.external_ids?.imdb_id,
        posterPath: tmdbDetails.poster_path,
        overview: tmdbDetails.overview,
        voteAverage: tmdbDetails.vote_average,
      }

      const newFilm = await createFilm(filmData)

      // Add film to directors' film lists
      for (const directorId of directorIds) {
        await Director.findByIdAndUpdate(directorId, {
          $push: { films: newFilm._id },
        })
      }

      // Update director statistics
      for (const directorId of directorIds) {
        await updateDirectorStats(directorId.toString())
      }

      return createApiResponse(201, {
        id: newFilm._id,
        title: newFilm.title,
        year: newFilm.year,
        directors: directorIds.length,
        message: "Successfully created film from TMDB",
      })
    } else {
      // Original behavior: full film data provided
      const filmData: FilmData = body

      if (!filmData.title || !filmData.year || !filmData.tmdbId) {
        throw new Error("Missing required fields: title, year, or tmdbId")
      }

      const newFilm = await createFilm(filmData)

      return createApiResponse(201, {
        id: newFilm._id,
        title: newFilm.title,
        year: newFilm.year,
        message: "Successfully created film",
      })
    }
  } catch (error) {
    logger.error(`Error creating film: ${error}`)
    return createApiResponse(502, {
      message: "Could not create film",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export { handler }
