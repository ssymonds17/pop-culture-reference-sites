import { createApiResponse, logger } from "./utils"
import { connectToDatabase, createFilm } from "./mongodb"
import { FilmData } from "./mongodb/models/film"

const handler = async (event: any) => {
  try {
    const filmData: FilmData = JSON.parse(event.body)

    if (!filmData.title || !filmData.year || !filmData.tmdbId) {
      throw new Error("Missing required fields: title, year, or tmdbId")
    }

    await connectToDatabase()

    const newFilm = await createFilm(filmData)

    return createApiResponse(201, {
      id: newFilm.id,
      title: newFilm.title,
      year: newFilm.year,
      message: "Successfully created film",
    })
  } catch (error) {
    logger.error(`Error creating film: ${error}`)
    return createApiResponse(502, {
      message: "Could not create film",
    })
  }
}

export { handler }
