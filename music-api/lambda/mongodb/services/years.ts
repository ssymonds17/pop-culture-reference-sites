import Song from "../models/song"
import Album, { Rating } from "../models/album"

export const countSongsByYear = async (year: number) => {
  return Song.countDocuments({ year })
}

export const countAlbumsByRating = async (rating: Rating, year: number) => {
  return Album.countDocuments({ rating, year })
}

export const getYearRanges = async () => {
  const oldestYear = await Song.find({}, null).sort({ year: 1 }).limit(1)
  const newestYear = await Song.find({}, null).sort({ year: -1 }).limit(1)
  return {
    oldestYear: oldestYear.length > 0 ? oldestYear[0].year : null,
    newestYear: newestYear.length > 0 ? newestYear[0].year : null,
  }
}

export const getYears = async () => {
  const { oldestYear, newestYear } = await getYearRanges()

  if (!oldestYear || !newestYear) {
    throw new Error("Unable to determine year range")
  }

  return await Promise.all(
    Array.from(
      { length: newestYear - oldestYear + 1 },
      (_, i) => oldestYear + i,
    ).map(async (year) => {
      const songsCount = await countSongsByYear(year)
      const goldAlbumsCount = await countAlbumsByRating(Rating.GOLD, year)
      const silverAlbumsCount = await countAlbumsByRating(Rating.SILVER, year)
      const totalScore =
        songsCount * 1 + goldAlbumsCount * 15 + silverAlbumsCount * 5
      return {
        year,
        songs: songsCount,
        goldAlbums: goldAlbumsCount,
        silverAlbums: silverAlbumsCount,
        totalScore,
      }
    }),
  )
}
