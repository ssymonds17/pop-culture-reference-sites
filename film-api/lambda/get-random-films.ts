import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getRandomFilms } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const filters: any = {}

    if (event.queryStringParameters) {
      const params = event.queryStringParameters

      if (params.watched !== undefined) {
        filters.watched = params.watched === "true"
      }
      if (params.yearStart) {
        filters.yearStart = parseInt(params.yearStart)
      }
      if (params.yearEnd) {
        filters.yearEnd = parseInt(params.yearEnd)
      }
      if (params.genres) {
        filters.genres = params.genres.split(',').map((g: string) => g.trim())
      }
    }

    const films = await getRandomFilms(filters)

    return createApiResponse(200, {
      data: films,
      count: films.length,
    })
  } catch (error) {
    logger.error(`Error getting random films: ${error}`)
    return createApiResponse(502, {
      message: "Could not get random films",
    })
  }
}

export { handler }
