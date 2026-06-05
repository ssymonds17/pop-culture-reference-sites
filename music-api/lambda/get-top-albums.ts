import { createApiResponse } from "./utils/api"
import { logger } from "./utils"
import { connectToDatabase, getTopAlbums } from "./mongodb"

const handler = async () => {
  try {
    await connectToDatabase()
    const topAlbums = await getTopAlbums()

    if (!topAlbums?.albumIds || topAlbums.albumIds.length === 0) {
      return createApiResponse(200, {
        albums: [],
        message: "No top albums found",
      })
    }

    // Map albums with rank numbers (1-indexed)
    const rankedAlbums = topAlbums.albumIds.map(
      (album: any, index: number) => ({
        ...album.toObject(),
        rank: index + 1,
      }),
    )

    return createApiResponse(200, {
      albums: rankedAlbums,
      total: rankedAlbums.length,
      message: "Successfully retrieved top albums",
    })
  } catch (error) {
    logger.error("Error retrieving top albums:", { error })
    return createApiResponse(500, {
      message: "Could not retrieve top albums",
    })
  }
}

export { handler }
