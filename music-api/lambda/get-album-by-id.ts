import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getAlbumById } from "./mongodb"

const handler = async (event: any) => {
  const albumId = event.pathParameters?.id

  try {
    if (!albumId) {
      return createApiResponse(400, {
        message: "Missing album ID",
      })
    }

    await connectToDatabase()
    const album = await getAlbumById(albumId)

    if (!album) {
      return createApiResponse(404, {
        message: "Could not find album",
      })
    }

    return createApiResponse(200, {
      album,
      message: "Successfully retrieved album",
    })
  } catch (error) {
    logger.error("Error retrieving album:", { error })
    return createApiResponse(404, {
      message: "Could not find album",
    })
  }
}

export { handler }
