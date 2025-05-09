import { ARTISTS_TABLE_NAME, getRecord, updateRecord } from "../dynamodb"
import { logger } from "./logger"
import { Artist, Rating } from "../schemas"
import { updateScoreBasedOnAlbumRatings } from "./score"

export const validateAssociatedArtists = async (artists: string[]) => {
  try {
    let artistExists = true
    const fullArtists = await Promise.all(
      artists.map(async (artistId: string) => {
        const artist = (await getRecord(ARTISTS_TABLE_NAME, artistId)) as Artist

        if (!artist) {
          artistExists = false
        }

        return artist
      })
    )

    if (!artistExists) {
      logger.error(`Artist not found.`)
      throw new Error(`Could not create album. Artist not found`)
    }

    return fullArtists
  } catch (error) {
    logger.error(`Error validating associated artists: ${error}`)
    throw new Error(`Error validating associated artists: ${error}`)
  }
}

export const updateAssociatedArtists = async (
  artists: Artist[],
  albumId: string,
  rating: Rating
) => {
  for (const artist of artists) {
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
        rating ?? Rating.NONE
      ),
    }

    await updateRecord(updateArtistData, ARTISTS_TABLE_NAME, artist.id)
  }
}
