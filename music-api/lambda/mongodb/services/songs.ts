import Song from "../models/song"

export const getSongById = async (id: string) => {
  return Song.findById(id, null)
}
