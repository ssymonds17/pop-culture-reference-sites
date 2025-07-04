import { createApiResponse } from "./utils/api"
import { logger } from "./utils"
import { connectToDatabase } from "./mongodb"
import { getAlbums } from "./mongodb/services/albums"

const handler = async () => {
  try {
    await connectToDatabase()
    const albums = await getAlbums()

    if (!albums) {
      return createApiResponse(404, {
        message: "Could not find albums",
      })
    }

    return createApiResponse(200, {
      albums: albums,
      message: "Successfully retrieved albums",
    })
  } catch (error) {
    logger.error("Error retrieving albums:", { error })
    return createApiResponse(404, {
      message: { message: "Could not find albums" },
    })
  }
}

export { handler }
