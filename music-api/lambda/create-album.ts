import { createApiResponse, logger, normalizeForSearch } from "./utils"
import { validateAssociatedEntities } from "./utils/validate-upstream-entities"
import { AlbumData, Rating } from "./mongodb/models/album"
import {
  addAlbumToArtist,
  connectToDatabase,
  createAlbum,
  updateArtistStats,
  updateYearStats,
} from "./mongodb"
import { requireAuth } from "./auth"

const handlerImpl = async (event: any, _userId: string) => {
  const { title, artistDisplayName, year, artists, rating, totalSongs } =
    JSON.parse(event.body)

  try {
    if (!title || !artistDisplayName || !year || !artists) {
      throw new Error("Required fields are missing")
    }

    const defaultAlbum: AlbumData = {
      title: normalizeForSearch(title),
      displayTitle: title,
      artistDisplayName,
      songs: [],
      totalSongs: totalSongs ?? 0,
      rating: rating ?? Rating.NONE,
      artists,
      year,
    }

    await connectToDatabase()

    // Check that each artist associated with the album exists
    // If any artist does not exist return an error
    const fullArtists = await validateAssociatedEntities(artists, "artist")

    if (!fullArtists) {
      logger.error(`Artist not found`)
      return createApiResponse(404, {
        message: "Could not create album. Artist not found",
      })
    }

    const album = await createAlbum(defaultAlbum)
    for (const artistId of artists) {
      await addAlbumToArtist(artistId, album.id)
      await updateArtistStats(artistId)
    }

    // Cascade update to year statistics
    await updateYearStats(album.year)

    return createApiResponse(201, {
      id: album.id,
      year: album.year,
      title: album.title,
      artistDisplayName: album.artistDisplayName,
      message: "Successfully created album",
    })
  } catch (error) {
    logger.error(`Error creating album: ${error}`)
    return createApiResponse(502, {
      message: "Could not create album",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
