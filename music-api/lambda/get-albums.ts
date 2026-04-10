import { createApiResponse } from "./utils/api"
import { logger } from "./utils"
import { connectToDatabase, getAlbums } from "./mongodb"
import { Rating } from "./mongodb/models/album"

const handler = async (event: any) => {
  try {
    // Parse and validate query parameters BEFORE connecting to database
    const queryParams = event.queryStringParameters || {}
    const options: any = {}

    // Handle rating filter
    if (queryParams.rating) {
      const ratingParam = queryParams.rating.toUpperCase()
      if (ratingParam === "ALL") {
        options.rating = "ALL"
      } else if (ratingParam === "RATED") {
        // RATED means GOLD + SILVER (default behavior)
        options.rating = [Rating.GOLD, Rating.SILVER]
      } else if (ratingParam === Rating.GOLD || ratingParam === Rating.SILVER) {
        options.rating = ratingParam as Rating
      } else {
        return createApiResponse(400, {
          message: `Invalid rating. Must be "GOLD", "SILVER", "RATED", or "ALL"`,
        })
      }
    }

    // Handle year filter
    if (queryParams.year) {
      const year = Number.parseInt(queryParams.year, 10)
      if (Number.isNaN(year)) {
        return createApiResponse(400, {
          message: "Invalid year parameter",
        })
      }
      options.year = year
    }

    await connectToDatabase()

    const albums = await getAlbums(
      Object.keys(options).length > 0 ? options : undefined,
    )

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
