import _ from "lodash"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { v7 as uuidV7 } from "uuid"
import { createApiResponse, logger } from "./utils"
import { Album, Artist, Rating } from "./schemas/index"
import {
  documentClient,
  ALBUMS_TABLE_NAME,
  ARTISTS_TABLE_NAME,
} from "./dynamodb"
import { updateAssociatedArtists } from "./utils/create-album"
import { validateAssociatedEntities } from "./utils/validate-upstream-entities"

const handler = async (event: any) => {
  const { title, artistDisplayName, year, artists, rating } = JSON.parse(
    event.body
  )
  const albumId = uuidV7()
  const defaultAlbum: Album = {
    id: albumId,
    title: _.toLower(title),
    displayTitle: title,
    artistDisplayName,
    songs: [],
    rating: rating ?? Rating.NONE,
    artists: [artists],
    year,
  }

  try {
    if (!title) {
      throw new Error("Album title is required")
    }

    // Check that each artist associated with the album exists
    // If any artist does not exist return an error
    const fullArtists = (await validateAssociatedEntities(
      artists,
      ARTISTS_TABLE_NAME
    )) as Artist[] | null

    if (!fullArtists) {
      logger.error(`Artist not found`)
      return createApiResponse(404, {
        message: "Could not create album. Artist not found",
      })
    }

    await updateAssociatedArtists(fullArtists, albumId, rating)

    // Artist updated successfully. Now create the album
    await documentClient.send(
      new PutCommand({
        TableName: ALBUMS_TABLE_NAME,
        Item: defaultAlbum,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    return createApiResponse(201, {
      id: albumId,
      year: defaultAlbum.year,
      title,
      artistDisplayName: defaultAlbum.artistDisplayName,
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
