import Album, { AlbumData, Rating } from "../models/album"

export const createAlbum = async (albumData: AlbumData) => {
  return Album.create(albumData)
}

export interface GetAlbumsOptions {
  rating?: Rating | Rating[] | "ALL"
  year?: number
}

export const getAlbums = async (options?: GetAlbumsOptions) => {
  const query: any = {}

  // Build rating filter
  if (options?.rating === "ALL") {
    // No rating filter - return all albums including NONE
  } else if (options?.rating) {
    if (Array.isArray(options.rating)) {
      query.rating = { $in: options.rating }
    } else {
      query.rating = options.rating
    }
  } else {
    // Default: only GOLD and SILVER (exclude NONE)
    query.rating = { $in: [Rating.GOLD, Rating.SILVER] }
  }

  // Build year filter
  if (options?.year) {
    query.year = options.year
  }

  // Use aggregation to sort by rating order (GOLD, SILVER, NONE), then by other fields
  return Album.aggregate([
    { $match: query },
    {
      $addFields: {
        ratingOrder: {
          $switch: {
            branches: [
              { case: { $eq: ["$rating", Rating.GOLD] }, then: 1 },
              { case: { $eq: ["$rating", Rating.SILVER] }, then: 2 },
              { case: { $eq: ["$rating", Rating.NONE] }, then: 3 },
            ],
            default: 4,
          },
        },
      },
    },
    {
      $sort: {
        ratingOrder: 1,
        year: 1,
        displayTitle: 1,
        artistDisplayName: 1,
      },
    },
    {
      $project: {
        ratingOrder: 0, // Remove the temporary field from results
      },
    },
  ]).exec()
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

export const updateAlbumRatingById = async (id: string, newRating: Rating) => {
  return Album.findByIdAndUpdate(id, { rating: newRating }, { new: true })
}

export const updateAlbumTotalSongsById = async (id: string, totalSongs: number) => {
  return Album.findByIdAndUpdate(id, { totalSongs }, { new: true })
}
