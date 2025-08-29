import { createApiResponse, logger } from "./utils"
import { updateAssociatedArtists } from "./utils/update-album"
import { validateAssociatedEntities } from "./utils/validate-upstream-entities"
import {
  connectToDatabase,
  getAlbumById,
  updateAlbumRatingById,
} from "./mongodb"
import { ArtistDocument } from "./mongodb/models/artist"

const handler = async (event: any) => {
  const albumId = event.pathParameters?.id
  const { rating } = JSON.parse(event.body)

  try {
    if (!albumId) {
      throw new Error("Album ID is missing")
    }

    if (!rating) {
      throw new Error("Rating is missing")
    }

    await connectToDatabase()

    const currentAlbum = await getAlbumById(albumId)

    if (!currentAlbum) {
      throw new Error("Album not found")
    }

    const fullArtists = (await validateAssociatedEntities(
      currentAlbum.artists,
      "artist"
    )) as ArtistDocument[] | null

    if (!fullArtists) {
      throw new Error("Failed to validate artists")
    }

    const updatedAlbum = await updateAlbumRatingById(albumId, rating)

    if (!updatedAlbum) {
      throw new Error("Failed to update album")
    }

    await updateAssociatedArtists(
      fullArtists,
      updatedAlbum.id,
      currentAlbum.rating,
      updatedAlbum.rating
    )

    return createApiResponse(201, {
      id: updatedAlbum.id,
      year: updatedAlbum.year,
      title: updatedAlbum.title,
      artistDisplayName: updatedAlbum.artistDisplayName,
      rating: updatedAlbum.rating,
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
