import _ from "lodash"
import { createApiResponse, logger } from "./utils"
import { validateAssociatedEntities } from "./utils/validate-upstream-entities"
import {
  updateAssociatedAlbum,
  updateAssociatedArtists,
} from "./utils/create-song"
import { SongData } from "./mongodb/models/song"
import { ArtistDocument } from "./mongodb/models/artist"
import { AlbumDocument } from "./mongodb/models/album"
import { connectToDatabase, createSong } from "./mongodb"

const handler = async (event: any) => {
  const { title, album, albumDisplayTitle, year, artists, artistDisplayName } =
    JSON.parse(event.body)

  const defaultSong: SongData = {
    title: _.toLower(title),
    displayTitle: title,
    artists: artists,
    artistDisplayName: artistDisplayName,
    year,
    album: album ?? undefined,
    albumDisplayTitle: albumDisplayTitle ?? undefined,
  }

  try {
    if (!title || !artistDisplayName || !year || !artists) {
      throw new Error("Song title is required")
    }

    await connectToDatabase()
    // Check that each artist associated with the song exists
    const validatedArtists = (await validateAssociatedEntities(artists)) as
      | ArtistDocument[]
      | null

    // If an album is provided, check that it exists
    let validatedAlbum = undefined
    if (album) {
      validatedAlbum = (await validateAssociatedEntities([album])) as
        | AlbumDocument[]
        | null
    }

    if (!validatedArtists || (album && !validatedAlbum)) {
      logger.error(`Artist or album not found`)
      return createApiResponse(404, {
        message: "Could not create song. Artist or album not found",
      })
    }

    const song = await createSong(defaultSong)

    let upgradingAlbumToSilver = false
    if (album && validatedAlbum) {
      upgradingAlbumToSilver = await updateAssociatedAlbum(
        validatedAlbum[0],
        song.id
      )
    }
    await updateAssociatedArtists(
      validatedArtists,
      song.id,
      upgradingAlbumToSilver
    )

    return createApiResponse(201, {
      id: song.id,
      year: song.year,
      title: song.title,
      displayTitle: song.displayTitle,
      album: song.album,
      albumDisplayTitle: song.albumDisplayTitle,
      artists: song.artists,
      artistDisplayName: song.artistDisplayName,
      message: "Successfully created song",
    })
  } catch (error) {
    logger.error(`Error creating song: ${error}`)
    return createApiResponse(502, {
      message: "Could not create song",
    })
  }
}

export { handler }
