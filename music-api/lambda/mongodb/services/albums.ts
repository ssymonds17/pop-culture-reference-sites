import Album, { AlbumData } from "../models/album"

export const createAlbum = async (albumData: AlbumData) => {
  return Album.create(albumData)
}

export const getAlbums = async () => {
  return Album.find({}, null)
    .sort({ artistDisplayName: 1, year: 1, rating: 1 })
    .limit(100)
    .exec()
}

export const getAlbumById = async (id: string) => {
  return Album.findById(id, null)
}

export const findAlbumsByTitle = async (title: string) => {
  return Album.find(
    { title: new RegExp(title, "i") }, // case-insensitive search
    null,
    { sort: { title: 1 } }
  ).exec()
}
