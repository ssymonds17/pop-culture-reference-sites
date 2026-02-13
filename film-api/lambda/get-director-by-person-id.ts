import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getDirectorByTmdbPersonId } from "./mongodb"

const handler = async (event: any) => {
  const tmdbPersonId = event.pathParameters?.tmdbPersonId

  try {
    if (!tmdbPersonId) {
      throw new Error("TMDb Person ID is missing")
    }

    await connectToDatabase()

    const director = await getDirectorByTmdbPersonId(tmdbPersonId)

    if (!director) {
      return createApiResponse(404, {
        message: "Director not found",
      })
    }

    return createApiResponse(200, { data: director })
  } catch (error) {
    logger.error(`Error getting director: ${error}`)
    return createApiResponse(502, {
      message: "Could not get director",
    })
  }
}

export { handler }
