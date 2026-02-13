import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getOverallStats } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const stats = await getOverallStats()

    return createApiResponse(200, { data: stats })
  } catch (error) {
    logger.error(`Error getting overall stats: ${error}`)
    return createApiResponse(502, {
      message: "Could not get overall stats",
    })
  }
}

export { handler }
