import {
  ALBUMS_TABLE_NAME,
  ARTISTS_TABLE_NAME,
  updateRecord,
} from "../dynamodb"
import { Album, Artist } from "../schemas"

export const updateAssociatedArtists = async (
  artists: Artist[],
  songId: string
) => {
  for (const artist of artists) {
    const newArtistSongs = [...artist.songs, songId]
    const newTotalScore = artist.totalScore + 1
    const updateArtistData = {
      songs: newArtistSongs,
      totalScore: newTotalScore,
    }

    await updateRecord(updateArtistData, ARTISTS_TABLE_NAME, artist.id)
  }
}

export const updateAssociatedAlbum = async (album: Album, songId: string) => {
  const newAlbumSongs = [...album.songs, songId]
  const updateAlbumData = {
    songs: newAlbumSongs,
  }

  await updateRecord(updateAlbumData, ALBUMS_TABLE_NAME, album.id)
}
