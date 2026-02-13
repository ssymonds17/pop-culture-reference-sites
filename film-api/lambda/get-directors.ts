import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getDirectors } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const sortBy = event.queryStringParameters?.sortBy || "totalPoints"

    const directors = await getDirectors(sortBy)

    return createApiResponse(200, {
      data: directors,
      count: directors.length,
    })
  } catch (error) {
    logger.error(`Error getting directors: ${error}`)
    return createApiResponse(502, {
      message: "Could not get directors",
    })
  }
}

export { handler }
