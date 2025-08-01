import Song, { SongData } from "../models/song"

export const createSong = async (songData: SongData) => {
  return Song.create(songData)
}

export const getSongById = async (id: string) => {
  return Song.findById(id, null)
}
