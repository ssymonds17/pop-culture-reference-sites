import { AlbumDocument, Rating } from "../mongodb/models/album"
import { ArtistDocument } from "../mongodb/models/artist"

export const updateAssociatedArtists = async (
  artists: ArtistDocument[],
  songId: string,
  upgradingAlbumToSilver: boolean = false
) => {
  for (const artist of artists) {
    const newArtistSongs = [...artist.songs, songId]
    let newScoreToAdd = 1

    artist.songs = newArtistSongs
    artist.totalSongs += 1
    artist.totalScore += 1

    if (upgradingAlbumToSilver) {
      artist.silverAlbums += 1
      newScoreToAdd += 5
    }

    artist.totalScore += newScoreToAdd
    await artist.save()
  }
}

export const updateAssociatedAlbum = async (
  album: AlbumDocument,
  songId: string
): Promise<boolean> => {
  const newAlbumSongs = [...album.songs, songId]
  // Currently album is not yet SILVER rating and has 5 songs.
  // Adding a new song will surpass the minimum threshold of 6 songs for SILVER rating.
  const upgradingToSilver =
    album.rating === Rating.NONE && album.songs.length === 5

  album.songs = newAlbumSongs
  album.rating = upgradingToSilver ? Rating.SILVER : album.rating

  await album.save()

  return upgradingToSilver
}
