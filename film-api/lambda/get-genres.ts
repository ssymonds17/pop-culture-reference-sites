import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getUniqueGenres } from "./mongodb"

const handler = async () => {
  try {
    await connectToDatabase()

    const genres = await getUniqueGenres()

    return createApiResponse(200, {
      data: genres,
      count: genres.length,
    })
  } catch (error) {
    logger.error(`Error getting genres: ${error}`)
    return createApiResponse(502, {
      message: "Could not get genres",
    })
  }
}

export { handler }
