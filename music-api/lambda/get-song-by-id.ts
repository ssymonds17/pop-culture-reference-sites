import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getSongById } from "./mongodb"

const handler = async (event: any) => {
  const songId = event.pathParameters?.id

  try {
    if (!songId) {
      return createApiResponse(400, {
        message: "Missing song ID",
      })
    }

    await connectToDatabase()
    const song = await getSongById(songId)

    if (!song) {
      return createApiResponse(404, {
        message: "Could not find song",
      })
    }

    return createApiResponse(200, {
      song,
      message: "Successfully retrieved song",
    })
  } catch (error) {
    logger.error("Error retrieving song:", { error })
    return createApiResponse(404, {
      message: "Could not find song",
    })
  }
}

export { handler }
