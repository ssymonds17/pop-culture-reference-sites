import Song from "../models/song"
import Album, { Rating } from "../models/album"
import YearStats, { YearStatsData } from "../models/yearStats"

export const countSongsByYear = async (year: number) => {
  return Song.countDocuments({ year })
}

export const countAlbumsByRating = async (rating: Rating, year: number) => {
  return Album.countDocuments({ rating, year })
}

export const getYears = async () => {
  return YearStats.find({}).sort({ totalScore: -1 }).exec()
}

export const updateYearStats = async (year: number) => {
  const songsCount = await countSongsByYear(year)
  const goldAlbumsCount = await countAlbumsByRating(Rating.GOLD, year)
  const silverAlbumsCount = await countAlbumsByRating(Rating.SILVER, year)
  const totalScore =
    songsCount * 1 + goldAlbumsCount * 15 + silverAlbumsCount * 5

  const yearStatsData: YearStatsData = {
    year,
    songs: songsCount,
    goldAlbums: goldAlbumsCount,
    silverAlbums: silverAlbumsCount,
    totalScore,
  }

  return YearStats.findOneAndUpdate({ year }, yearStatsData, {
    upsert: true,
    new: true,
  }).exec()
}
