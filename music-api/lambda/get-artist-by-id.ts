import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getArtistById } from "./mongodb"

const handler = async (event: any) => {
  const artistId = event.pathParameters?.id

  try {
    if (!artistId) {
      return createApiResponse(400, {
        message: "Missing artist ID",
      })
    }

    await connectToDatabase()

    const artist = await getArtistById(artistId)

    if (!artist) {
      return createApiResponse(404, {
        message: "Could not find artist",
      })
    }

    return createApiResponse(200, {
      artist,
      message: "Successfully retrieved artist",
    })
  } catch (error) {
    logger.error("Error retrieving artist:", { error })
    return createApiResponse(404, {
      message: "Could not find artist",
    })
  }
}

export { handler }
