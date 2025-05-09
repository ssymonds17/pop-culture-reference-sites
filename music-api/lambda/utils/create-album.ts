import { ARTISTS_TABLE_NAME, updateRecord } from "../dynamodb"
import { Artist, Rating } from "../schemas"
import { updateScoreBasedOnAlbumRatings } from "./score"

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
