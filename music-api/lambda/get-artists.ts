import { createApiResponse } from "./utils/api"
import { logger } from "./utils"
import { connectToDatabase, getArtists } from "./mongodb"

const handler = async () => {
  try {
    await connectToDatabase()
    const artists = await getArtists()

    if (!artists) {
      return createApiResponse(404, {
        message: "Could not find artists",
      })
    }

    return createApiResponse(200, {
      artists,
      message: "Successfully retrieved artists",
    })
  } catch (error) {
    logger.error("Error retrieving artists:", { error })
    return createApiResponse(404, {
      message: { message: "Could not find artists" },
    })
  }
}

export { handler }
