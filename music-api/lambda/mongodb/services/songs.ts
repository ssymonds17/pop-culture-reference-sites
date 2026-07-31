import Song, { SongData } from "../models/song"
import { escapeRegex, normalizeForSearch } from "../../utils"

export const createSong = async (songData: SongData) => {
  return Song.create(songData)
}

export const getSongById = async (id: string) => {
  return Song.findById(id, null)
}

export const findSongsByTitle = async (title: string) => {
  const needle = normalizeForSearch(title)
  if (!needle) {
    return []
  }

  // The stored `title` is normalised at write time (see findArtistsByName), so
  // we match the folded, escaped query directly against it in the database.
  return Song.find(
    { title: new RegExp(escapeRegex(needle), "i") },
    null,
    { sort: { title: 1 } }
  ).exec()
}
