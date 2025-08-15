import Song from "../models/song"
import Album, { Rating } from "../models/album"

export const getSongsByYear = async (year: number) => {
  return Song.find({ year }, null)
}

export const getAlbumsByRating = async (rating: Rating) => {
  return Album.find({ rating }, null)
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
      (_, i) => oldestYear + i
    ).map(async (year) => {
      const songs = await getSongsByYear(year)
      const goldAlbums = await getAlbumsByRating(Rating.GOLD)
      const silverAlbums = await getAlbumsByRating(Rating.SILVER)
      const totalScore =
        songs.length * 1 + goldAlbums.length * 10 + silverAlbums.length * 5
      return { year, songs, goldAlbums, silverAlbums, totalScore }
    })
  )
}
