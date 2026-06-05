import TopAlbums from "../models/topAlbums"
import Album, { AlbumDocument, Rating } from "../models/album"

/**
 * Get the top albums list with populated album details
 */
export const getTopAlbums = async () => {
  return TopAlbums.findOne().populate("albumIds").exec()
}

/**
 * Update the entire top albums list
 * @param albumIds - Array of album IDs in desired rank order
 */
export const updateTopAlbums = async (albumIds: string[]) => {
  return TopAlbums.findOneAndUpdate(
    {}, // Empty filter finds the single document
    { albumIds },
    { upsert: true, new: true }
  ).exec()
}

/**
 * Add an album to the end of the top albums list
 * @param albumId - Album ID to add
 */
export const addAlbumToTop = async (albumId: string) => {
  const topAlbums = await TopAlbums.findOne().exec()

  if (!topAlbums) {
    // Create new document with this album
    return TopAlbums.create({ albumIds: [albumId] })
  }

  // Check if album is already in the list
  if (topAlbums.albumIds.includes(albumId)) {
    return topAlbums // Already exists, no-op
  }

  // Add to end of list
  topAlbums.albumIds.push(albumId)
  return topAlbums.save()
}

/**
 * Remove an album from the top albums list
 * @param albumId - Album ID to remove
 */
export const removeAlbumFromTop = async (albumId: string) => {
  const topAlbums = await TopAlbums.findOne().exec()

  if (!topAlbums) {
    return null // No document exists, nothing to remove
  }

  // Filter out the album
  const initialLength = topAlbums.albumIds.length
  topAlbums.albumIds = topAlbums.albumIds.filter(
    (id) => id.toString() !== albumId.toString()
  )

  // Only save if something was actually removed
  if (topAlbums.albumIds.length < initialLength) {
    return topAlbums.save()
  }

  return topAlbums
}

/**
 * Sync top albums list with all gold-rated albums
 * Ensures the list contains exactly all gold albums, preserving existing order where possible
 */
export const syncTopAlbumsWithGoldRatings = async () => {
  // Get all current gold-rated album IDs
  const goldAlbums = (await Album.find({ rating: Rating.GOLD })
    .select("_id")
    .exec()) as AlbumDocument[]
  const goldAlbumIds = goldAlbums.map((album: AlbumDocument) => String(album._id))

  // Get current top albums list
  const topAlbums = await TopAlbums.findOne().exec()

  if (!topAlbums) {
    // No existing list, create one with all gold albums
    return TopAlbums.create({ albumIds: goldAlbumIds })
  }

  // Preserve existing order for albums that are still gold
  // Then append any new gold albums
  const existingGoldIds = topAlbums.albumIds
    .map((id) => id.toString())
    .filter((id) => goldAlbumIds.includes(id))

  const newGoldIds = goldAlbumIds.filter((id) => !existingGoldIds.includes(id))

  topAlbums.albumIds = [...existingGoldIds, ...newGoldIds]
  return topAlbums.save()
}

/**
 * Get all gold-rated album IDs
 */
export const getGoldAlbumIds = async (): Promise<string[]> => {
  const goldAlbums = (await Album.find({ rating: Rating.GOLD })
    .select("_id")
    .exec()) as AlbumDocument[]
  return goldAlbums.map((album: AlbumDocument) => String(album._id))
}
