import { createApiResponse } from "./utils"
import { ALBUMS_TABLE_NAME } from "./dynamodb"
import { getRecord } from "./dynamodb/get"
import { Artist } from "./schemas"

const handler = async (event: any) => {
  const albumId = event.pathParameters?.id

  try {
    if (!albumId) {
      return createApiResponse(400, {
        message: "Missing album ID",
      })
    }

    const album = (await getRecord(ALBUMS_TABLE_NAME, albumId)) as Artist

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
    return createApiResponse(404, {
      message: { message: "Could not find album" },
    })
  }
}

export { handler }
