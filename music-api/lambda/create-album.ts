import _ from "lodash"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { v7 as uuidV7 } from "uuid"
import { createApiResponse, updateScoreBasedOnAlbumRatings } from "./utils"
import { Album, Artist, Rating } from "./schemas/index"
import {
  documentClient,
  ALBUMS_TABLE_NAME,
  ARTISTS_TABLE_NAME,
  getRecord,
  updateRecord,
} from "./dynamodb"

const handler = async (event: any) => {
  const { title, artistDisplayName, year, artists, rating } = JSON.parse(
    event.body
  )

  try {
    if (!title) {
      throw new Error("Album title is required")
    }

    const albumId = uuidV7()
    const defaultRating = rating ?? Rating.NONE
    const defaultAlbum: Album = {
      id: albumId,
      title: _.toLower(title),
      displayTitle: title,
      artistDisplayName,
      songs: [],
      rating: defaultRating,
      artists: [artists],
      year,
    }
    await documentClient.send(
      new PutCommand({
        TableName: ALBUMS_TABLE_NAME,
        Item: defaultAlbum,
        ConditionExpression: "attribute_not_exists(id)",
      })
    )

    // Album created. Now add the album id to the associated artist(s)
    for (const artistId of artists) {
      const artist = (await getRecord(ARTISTS_TABLE_NAME, artistId)) as Artist
      const newArtistAlbums = [...artist.albums, albumId]
      const updateArtistData = {
        albums: newArtistAlbums,
        silverAlbums:
          rating === Rating.SILVER
            ? artist.silverAlbums + 1
            : artist.silverAlbums,
        goldAlbums:
          rating === Rating.GOLD ? artist.goldAlbums + 1 : artist.goldAlbums,
        totalScore: updateScoreBasedOnAlbumRatings(
          artist.totalScore,
          defaultRating
        ),
      }

      await updateRecord(updateArtistData, ARTISTS_TABLE_NAME, artistId)
    }

    return createApiResponse(201, {
      id: albumId,
      year: defaultAlbum.year,
      title,
      artistDisplayName: defaultAlbum.artistDisplayName,
      message: "Successfully created album",
    })
  } catch (error) {
    return createApiResponse(502, {
      message: { message: "Could not create album" },
    })
  }
}

export { handler }
