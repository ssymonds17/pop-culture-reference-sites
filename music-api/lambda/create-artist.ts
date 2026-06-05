import _ from "lodash"
import { createApiResponse, logger } from "./utils"
import { ArtistData } from "./mongodb/models/artist"
import { connectToDatabase, createArtist } from "./mongodb"
import { requireAuth } from "./auth"

const handlerImpl = async (event: any, _userId: string) => {
  const artistName = JSON.parse(event.body).name
  try {
    if (!artistName) {
      throw new Error("Artist name is required")
    }

    const defaultArtist: ArtistData = {
      name: _.toLower(artistName),
      displayName: artistName,
      albums: [],
      songs: [],
      silverAlbums: 0,
      goldAlbums: 0,
      totalSongs: 0,
      totalScore: 0,
    }

    await connectToDatabase()
    const artist = await createArtist(defaultArtist)

    return createApiResponse(201, {
      id: artist._id,
      artistName: artist.displayName,
      message: "Successfully created artist",
    })
  } catch (error) {
    logger.error(`Error creating artist: ${error}`)
    return createApiResponse(502, {
      message: "Could not create artist",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
