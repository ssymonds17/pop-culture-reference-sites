import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getActors } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const sortBy = event.queryStringParameters?.sortBy || "totalPoints"

    const actors = await getActors(sortBy)

    return createApiResponse(200, {
      data: actors,
      count: actors.length,
    })
  } catch (error) {
    logger.error(`Error getting actors: ${error}`)
    return createApiResponse(502, {
      message: "Could not get actors",
    })
  }
}

export { handler }
