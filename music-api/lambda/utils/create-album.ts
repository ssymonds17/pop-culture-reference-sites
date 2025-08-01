import { ArtistDocument } from "../mongodb/models/artist"
import { Rating } from "../mongodb/models/album"
import { updateScoreBasedOnAlbumRatings } from "./score"

export const updateAssociatedArtists = async (
  artists: ArtistDocument[],
  albumId: string,
  rating: Rating
) => {
  for (const artist of artists) {
    const newArtistAlbums = [...artist.albums, albumId]

    // Update the artist document
    artist.albums = newArtistAlbums
    artist.silverAlbums =
      rating === Rating.SILVER ? artist.silverAlbums + 1 : artist.silverAlbums
    artist.goldAlbums =
      rating === Rating.GOLD ? artist.goldAlbums + 1 : artist.goldAlbums
    artist.totalScore = updateScoreBasedOnAlbumRatings(
      artist.totalScore,
      rating ?? Rating.NONE
    )

    // Save the updated artist
    await artist.save()
  }
}
