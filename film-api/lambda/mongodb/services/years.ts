import YearStats, { YearStatsData } from "../models/yearStats"
import Film from "../models/film"

export const getYears = async () => {
  return YearStats.find({}).sort({ yearScore: -1 }).exec()
}

export const getYearStats = async (year: number) => {
  return YearStats.findOne({ year }).exec()
}

export const updateYearStats = async (year: number) => {
  const films = await Film.find({ year }).exec()

  const totalFilms = films.length
  const watchedFilms = films.filter((f) => f.watched && f.rating)
  const watchedCount = watchedFilms.length

  // Calculate weighted score: 6=1pt, 7=3pts, 8=6pts, 9=10pts, 10=15pts
  const getPointsForRating = (rating: number): number => {
    switch (rating) {
      case 6: return 1
      case 7: return 3
      case 8: return 6
      case 9: return 10
      case 10: return 15
      default: return 0
    }
  }

  const totalScore = watchedFilms.reduce(
    (sum, f) => sum + getPointsForRating(f.rating || 0),
    0
  )

  const sumOfRatings = watchedFilms.reduce(
    (sum, f) => sum + (f.rating || 0),
    0
  )

  const averageRating =
    watchedCount > 0 ? sumOfRatings / watchedCount : undefined

  // Calculate rating distribution
  const ratingDistribution = {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 0,
    rating8: 0,
    rating9: 0,
    rating10: 0,
  }

  watchedFilms.forEach((f) => {
    const rating = f.rating
    if (rating && rating >= 1 && rating <= 10) {
      const key = `rating${rating}` as keyof typeof ratingDistribution
      ratingDistribution[key]++
    }
  })

  // Calculate films rated 6+
  const filmsRated6Plus =
    ratingDistribution.rating6 +
    ratingDistribution.rating7 +
    ratingDistribution.rating8 +
    ratingDistribution.rating9 +
    ratingDistribution.rating10

  const percentRated6Plus =
    watchedCount > 0 ? (filmsRated6Plus / watchedCount) * 100 : 0

  const yearScore = totalScore * (percentRated6Plus / 100)

  // Calculate top genres
  const genreCounts: Record<string, number> = {}
  films.forEach((f) => {
    f.genres.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })

  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Update or create year stats
  const yearStatsData: YearStatsData = {
    year,
    totalFilms,
    watchedFilms: watchedCount,
    averageRating,
    totalScore,
    filmsRated6Plus,
    percentRated6Plus,
    yearScore,
    ratingDistribution,
    topGenres,
  }

  return YearStats.findOneAndUpdate({ year }, yearStatsData, {
    upsert: true,
    new: true,
  }).exec()
}
