import { ArtistDocument } from "../mongodb/models/artist"
import { Rating } from "../mongodb/models/album"
import { updateScoreBasedOnAlbumRatingUpdate } from "./score"

export const updateAlbumTotal = (
  ratingCategory: Rating,
  albumTotal: number,
  oldRating: Rating,
  newRating: Rating
) => {
  if (oldRating === ratingCategory) {
    return albumTotal - 1
  }
  if (newRating === ratingCategory) {
    return albumTotal + 1
  }
  return albumTotal
}

export const updateAssociatedArtists = async (
  artists: ArtistDocument[],
  albumId: string,
  oldRating: Rating,
  newRating: Rating
) => {
  for (const artist of artists) {
    // Update the artist document
    artist.goldAlbums = updateAlbumTotal(
      Rating.GOLD,
      artist.goldAlbums,
      oldRating,
      newRating
    )
    artist.silverAlbums = updateAlbumTotal(
      Rating.SILVER,
      artist.silverAlbums,
      oldRating,
      newRating
    )
    artist.totalScore = updateScoreBasedOnAlbumRatingUpdate(
      artist.totalScore,
      oldRating,
      newRating
    )

    // Save the updated artist
    await artist.save()
  }
}
