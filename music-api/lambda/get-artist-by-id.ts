import { createApiResponse, logger } from "./utils"
import { ARTISTS_TABLE_NAME, getRecord } from "./dynamodb"
import { Artist } from "./schemas"

const handler = async (event: any) => {
  const artistId = event.pathParameters?.id

  try {
    if (!artistId) {
      return createApiResponse(400, {
        message: "Missing artist ID",
      })
    }

    const artist = (await getRecord(ARTISTS_TABLE_NAME, artistId)) as Artist

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
