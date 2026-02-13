import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getFilmById } from "./mongodb"

const handler = async (event: any) => {
  const filmId = event.pathParameters?.id

  try {
    if (!filmId) {
      throw new Error("Film ID is missing")
    }

    await connectToDatabase()

    const film = await getFilmById(filmId)

    if (!film) {
      return createApiResponse(404, {
        message: "Film not found",
      })
    }

    return createApiResponse(200, { data: film })
  } catch (error) {
    logger.error(`Error getting film: ${error}`)
    return createApiResponse(502, {
      message: "Could not get film",
    })
  }
}

export { handler }
