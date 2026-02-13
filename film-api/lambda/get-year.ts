import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getYearStats } from "./mongodb"

const handler = async (event: any) => {
  const year = event.pathParameters?.year

  try {
    if (!year) {
      throw new Error("Year is missing")
    }

    await connectToDatabase()

    const yearStats = await getYearStats(parseInt(year))

    if (!yearStats) {
      return createApiResponse(404, {
        message: "Year stats not found",
      })
    }

    return createApiResponse(200, { data: yearStats })
  } catch (error) {
    logger.error(`Error getting year stats: ${error}`)
    return createApiResponse(502, {
      message: "Could not get year stats",
    })
  }
}

export { handler }
