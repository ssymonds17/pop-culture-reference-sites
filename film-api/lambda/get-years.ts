import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getYears } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const years = await getYears()

    return createApiResponse(200, {
      data: years,
      count: years.length,
    })
  } catch (error) {
    logger.error(`Error getting years: ${error}`)
    return createApiResponse(502, {
      message: "Could not get years",
    })
  }
}

export { handler }
