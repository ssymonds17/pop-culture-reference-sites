import { createApiResponse } from "./utils/api"
import { logger } from "./utils"
import { connectToDatabase, getYears } from "./mongodb"

const handler = async () => {
  try {
    await connectToDatabase()
    const years = await getYears()

    if (!years) {
      return createApiResponse(404, {
        message: "Could not find years",
      })
    }

    return createApiResponse(200, {
      years,
      message: "Successfully retrieved years",
    })
  } catch (error) {
    logger.error("Error retrieving years:", { error })
    return createApiResponse(404, {
      message: { message: "Could not find years" },
    })
  }
}

export { handler }
