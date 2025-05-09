import _ from "lodash"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { v7 as uuidV7 } from "uuid"
import { createApiResponse, logger } from "./utils"
import { Artist } from "./schemas/index"
import { documentClient, ARTISTS_TABLE_NAME } from "./dynamodb"

const handler = async (event: any) => {
  const artistName = JSON.parse(event.body).name
  try {
    if (!artistName) {
      throw new Error("Artist name is required")
    }

    const artistId = uuidV7()
    const defaultArtist: Artist = {
      id: artistId,
      name: _.toLower(artistName),
      displayName: artistName,
      albums: [],
      songs: [],
      silverAlbums: 0,
      goldAlbums: 0,
      totalSongs: 0,
      totalScore: 0,
    }
    await documentClient.send(
      new PutCommand({
        TableName: ARTISTS_TABLE_NAME,
        Item: defaultArtist,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    return createApiResponse(201, {
      id: artistId,
      artistName,
      message: "Successfully created artist",
    })
  } catch (error) {
    logger.error(`Error creating artist: ${error}`)
    return createApiResponse(502, {
      message: { message: "Could not create artist" },
    })
  }
}

export { handler }
