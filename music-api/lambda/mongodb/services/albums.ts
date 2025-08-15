import Album, { AlbumData, Rating } from "../models/album"

export const createAlbum = async (albumData: AlbumData) => {
  return Album.create(albumData)
}

export const getAlbums = async () => {
  const gold = await Album.find({ rating: Rating.GOLD })
    .sort({
      year: 1,
      displayTitle: 1,
      artistDisplayName: 1,
    })
    .limit(100)
    .exec()
  const silver = await Album.find({ rating: Rating.SILVER })
    .sort({
      year: 1,
      displayTitle: 1,
      artistDisplayName: 1,
    })
    .limit(100)
    .exec()
  const none = await Album.find({ rating: Rating.NONE })
    .sort({
      year: 1,
      displayTitle: 1,
      artistDisplayName: 1,
    })
    .limit(100)
    .exec()

  return [...gold, ...silver, ...none]
}

export const getAlbumById = async (id: string) => {
  return Album.findById(id, null)
}

export const getAlbumByIdFull = async (id: string) => {
  return Album.findById(id, null)
    .populate({
      path: "songs",
      options: { sort: { year: 1, albumDisplayTitle: 1, title: 1 } },
    })
    .exec()
}

export const findAlbumsByTitle = async (title: string) => {
  return Album.find(
    { title: new RegExp(title, "i") }, // case-insensitive search
    null,
    { sort: { title: 1 } }
  ).exec()
}
