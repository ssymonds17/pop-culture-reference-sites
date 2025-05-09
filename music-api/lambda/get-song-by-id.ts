import { createApiResponse, logger } from "./utils"
import { SONGS_TABLE_NAME } from "./dynamodb"
import { getRecord } from "./dynamodb/get"
import { Song } from "./schemas"

const handler = async (event: any) => {
  const songId = event.pathParameters?.id

  try {
    if (!songId) {
      return createApiResponse(400, {
        message: "Missing song ID",
      })
    }

    const song = (await getRecord(SONGS_TABLE_NAME, songId)) as Song

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
