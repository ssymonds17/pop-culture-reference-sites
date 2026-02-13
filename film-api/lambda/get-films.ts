import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getFilms } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const filters: any = {}

    if (event.queryStringParameters) {
      const params = event.queryStringParameters

      if (params.watched !== undefined) {
        filters.watched = params.watched === "true"
      }
      if (params.minRating) {
        filters.minRating = parseInt(params.minRating)
      }
      if (params.maxRating) {
        filters.maxRating = parseInt(params.maxRating)
      }
      if (params.year) {
        filters.year = parseInt(params.year)
      }
      if (params.genre) {
        filters.genre = params.genre
      }
      if (params.directorId) {
        filters.directorId = params.directorId
      }
    }

    const films = await getFilms(filters)

    return createApiResponse(200, {
      data: films,
      count: films.length,
    })
  } catch (error) {
    logger.error(`Error getting films: ${error}`)
    return createApiResponse(502, {
      message: "Could not get films",
    })
  }
}

export { handler }
