import _ from "lodash"
import { createApiResponse, logger } from "./utils"
import { updateAssociatedArtists } from "./utils/create-album"
import { validateAssociatedEntities } from "./utils/validate-upstream-entities"
import { AlbumData, Rating } from "./mongodb/models/album"
import { connectToDatabase, createAlbum } from "./mongodb"
import { ArtistDocument } from "./mongodb/models/artist"

const handler = async (event: any) => {
  const { title, artistDisplayName, year, artists, rating } = JSON.parse(
    event.body
  )

  const defaultAlbum: AlbumData = {
    title: _.toLower(title),
    displayTitle: title,
    artistDisplayName,
    songs: [],
    rating: rating ?? Rating.NONE,
    artists,
    year,
  }

  try {
    if (!title || !artistDisplayName || !year || !artists) {
      throw new Error("Required fields are missing")
    }

    await connectToDatabase()

    // Check that each artist associated with the album exists
    // If any artist does not exist return an error
    const fullArtists = (await validateAssociatedEntities(
      artists,
      "artist"
    )) as ArtistDocument[] | null

    if (!fullArtists) {
      logger.error(`Artist not found`)
      return createApiResponse(404, {
        message: "Could not create album. Artist not found",
      })
    }

    const album = await createAlbum(defaultAlbum)
    await updateAssociatedArtists(fullArtists, album.id, rating)

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

export { handler }
