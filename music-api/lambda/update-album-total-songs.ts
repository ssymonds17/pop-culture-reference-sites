import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getAlbumById, updateAlbumTotalSongsById } from "./mongodb"

const handler = async (event: any) => {
  const albumId = event.pathParameters?.id
  const { totalSongs } = JSON.parse(event.body)

  try {
    if (!albumId) {
      throw new Error("Album ID is missing")
    }

    if (totalSongs === undefined) {
      throw new Error("totalSongs is missing")
    }

    await connectToDatabase()

    const currentAlbum = await getAlbumById(albumId)

    if (!currentAlbum) {
      throw new Error("Album not found")
    }

    const updatedAlbum = await updateAlbumTotalSongsById(albumId, totalSongs)

    if (!updatedAlbum) {
      throw new Error("Failed to update album")
    }

    return createApiResponse(200, {
      id: updatedAlbum.id,
      year: updatedAlbum.year,
      title: updatedAlbum.title,
      displayTitle: updatedAlbum.displayTitle,
      artistDisplayName: updatedAlbum.artistDisplayName,
      rating: updatedAlbum.rating,
      totalSongs: updatedAlbum.totalSongs,
      message: "Successfully updated album",
    })
  } catch (error) {
    logger.error(`Error updating album: ${error}`)
    return createApiResponse(502, {
      message: "Could not update album",
    })
  }
}

export { handler }
