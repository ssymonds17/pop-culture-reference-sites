import Song, { SongData } from "../models/song"

export const createSong = async (songData: SongData) => {
  return Song.create(songData)
}

export const getSongById = async (id: string) => {
  return Song.findById(id, null)
}

export const findSongsByTitle = async (title: string) => {
  return Song.find(
    { title: new RegExp(title, "i") }, // case-insensitive search
    null,
    { sort: { title: 1 } }
  ).exec()
}
