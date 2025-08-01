import Album, { AlbumData, Rating } from "../models/album"

export const createAlbum = async (albumData: AlbumData) => {
  return Album.create(albumData)
}

export const getAlbums = async () => {
  const gold = await Album.find({ rating: Rating.GOLD })
    .sort({
      artistDisplayName: 1,
      year: 1,
    })
    .limit(100)
    .exec()
  const silver = await Album.find({ rating: Rating.SILVER })
    .sort({
      artistDisplayName: 1,
      year: 1,
    })
    .limit(100)
    .exec()
  const none = await Album.find({ rating: Rating.NONE })
    .sort({
      artistDisplayName: 1,
      year: 1,
    })
    .limit(100)
    .exec()

  return [...gold, ...silver, ...none]
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
