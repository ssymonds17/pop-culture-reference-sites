import { AlbumDocument } from "../mongodb/models/album"
import { ArtistDocument } from "../mongodb/models/artist"

export const updateAssociatedAlbum = async (
  album: AlbumDocument,
  songId: string,
) => {
  const newAlbumSongs = [...album.songs, songId]

  album.songs = newAlbumSongs

  await album.save()
}

export const updateAssociatedArtists = async (
  artists: ArtistDocument[],
  songId: string,
) => {
  for (const artist of artists) {
    const newArtistSongs = [...artist.songs, songId]
    artist.songs = newArtistSongs
    artist.totalSongs += 1
    artist.totalScore += 1

    await artist.save()
  }
}
