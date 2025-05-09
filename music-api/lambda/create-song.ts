import _ from "lodash"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { v7 as uuidV7 } from "uuid"
import { createApiResponse, logger } from "./utils"
import { Album, Artist, Song } from "./schemas/index"
import {
  ALBUMS_TABLE_NAME,
  ARTISTS_TABLE_NAME,
  documentClient,
  SONGS_TABLE_NAME,
} from "./dynamodb"
import { validateAssociatedEntities } from "./utils/validate-upstream-entities"
import {
  updateAssociatedAlbum,
  updateAssociatedArtists,
} from "./utils/create-song"

const handler = async (event: any) => {
  const { title, album, year, artists } = JSON.parse(event.body)
  const songId = uuidV7()
  const defaultSong: Song = {
    id: songId,
    title: _.toLower(title),
    displayTitle: title,
    artists: [artists],
    year,
    album: album ?? undefined,
  }

  try {
    if (!title) {
      throw new Error("Song title is required")
    }

    // Check that each artist associated with the song exists
    const validatedArtists = (await validateAssociatedEntities(
      artists,
      ARTISTS_TABLE_NAME
    )) as Artist[] | null

    // If an album is provided, check that it exists
    let validatedAlbum = undefined
    if (album) {
      validatedAlbum = (await validateAssociatedEntities(
        [album],
        ALBUMS_TABLE_NAME
      )) as Album[] | null
    }

    if (!validatedArtists || !validatedAlbum) {
      logger.error(`Artist or album not found`)
      return createApiResponse(404, {
        message: "Could not create song. Artist or album not found",
      })
    }

    await updateAssociatedArtists(validatedArtists, songId)
    if (album) {
      await updateAssociatedAlbum(validatedAlbum[0], songId)
    }

    // Artist and albums have been updated. Now create the song
    await documentClient.send(
      new PutCommand({
        TableName: SONGS_TABLE_NAME,
        Item: defaultSong,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    return createApiResponse(201, {
      id: songId,
      year: defaultSong.year,
      title,
      displayTitle: defaultSong.displayTitle,
      album: defaultSong.album,
      artists: defaultSong.artists,
      message: "Successfully created song",
    })
  } catch (error) {
    logger.error(`Error creating song: ${error}`)
    return createApiResponse(502, {
      message: { message: "Could not create song" },
    })
  }
}

export { handler }
