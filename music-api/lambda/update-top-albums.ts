import { createApiResponse, logger } from "./utils"
import {
  connectToDatabase,
  updateTopAlbums,
  getGoldAlbumIds,
  getAlbumById,
} from "./mongodb"
import { requireAuth } from "./auth"
import { Rating } from "./mongodb/models/album"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const body = JSON.parse(event.body)
    const { albumIds } = body

    // Validate input
    if (!albumIds || !Array.isArray(albumIds)) {
      throw new Error("albumIds array is required")
    }

    if (albumIds.length === 0) {
      throw new Error("albumIds array cannot be empty")
    }

    await connectToDatabase()

    // Get all current gold-rated album IDs
    const goldAlbumIds = await getGoldAlbumIds()

    // Validate: submitted array must contain exactly all gold albums
    const submittedSet = new Set(albumIds.map((id) => id.toString()))
    const goldSet = new Set(goldAlbumIds.map((id) => id.toString()))

    // Check if arrays have the same length
    if (submittedSet.size !== goldSet.size) {
      throw new Error(
        `Album count mismatch: expected ${goldSet.size} gold albums, got ${submittedSet.size}`,
      )
    }

    // Check if all submitted albums are gold
    for (const albumId of albumIds) {
      if (!goldSet.has(albumId.toString())) {
        const album = await getAlbumById(albumId)
        if (!album) {
          throw new Error(`Album ${albumId} not found`)
        }
        if (album.rating !== Rating.GOLD) {
          throw new Error(
            `Album "${album.title}" is not gold-rated (current rating: ${album.rating})`,
          )
        }
      }
    }

    // Check if any gold albums are missing from submission
    for (const goldId of goldAlbumIds) {
      if (!submittedSet.has(goldId.toString())) {
        const album = await getAlbumById(goldId)
        throw new Error(
          `Missing gold album "${album?.title}" (${goldId}) in the submitted list`,
        )
      }
    }

    // Check for duplicates
    if (submittedSet.size !== albumIds.length) {
      throw new Error("Duplicate album IDs found in the submitted list")
    }

    // All validation passed, update the rankings
    const updatedTopAlbums = await updateTopAlbums(albumIds)

    if (!updatedTopAlbums) {
      throw new Error("Failed to update top albums")
    }

    return createApiResponse(200, {
      albumIds: updatedTopAlbums.albumIds,
      total: updatedTopAlbums.albumIds.length,
      message: "Successfully updated top albums rankings",
    })
  } catch (error) {
    logger.error(`Error updating top albums: ${error}`)

    // Return 400 for validation errors, 500 for server errors
    const statusCode = error instanceof Error && error.message ? 400 : 500
    return createApiResponse(statusCode, {
      message:
        error instanceof Error ? error.message : "Could not update top albums",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
