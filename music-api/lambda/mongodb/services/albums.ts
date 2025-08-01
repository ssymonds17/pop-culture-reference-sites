import Album from "../models/album"

export const getAlbums = async () => {
  return Album.find({}, null)
    .sort({ artistDisplayName: 1, year: 1, rating: 1 })
    .limit(100)
    .exec()
}

export const getAlbumById = async (id: string) => {
  return Album.findById(id, null)
}
