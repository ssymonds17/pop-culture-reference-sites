import Film from "../models/film"
import Director from "../models/director"

export const getOverallStats = async () => {
  const totalFilms = await Film.countDocuments({})
  const watchedFilms = await Film.countDocuments({ watched: true })
  const unwatchedFilms = totalFilms - watchedFilms

  const totalDirectors = await Director.countDocuments({})

  // Get all watched films with ratings
  const ratedFilms = await Film.find({ watched: true, rating: { $exists: true } })
    .select("rating genres")
    .exec()

  const totalScore = ratedFilms.reduce((sum, f) => sum + (f.rating || 0), 0)
  const averageRating = ratedFilms.length > 0 ? totalScore / ratedFilms.length : 0

  // Rating distribution
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

  ratedFilms.forEach((f) => {
    const rating = f.rating
    if (rating && rating >= 1 && rating <= 10) {
      const key = `rating${rating}` as keyof typeof ratingDistribution
      ratingDistribution[key]++
    }
  })

  // Genre distribution
  const genreCounts: Record<string, number> = {}
  ratedFilms.forEach((f) => {
    f.genres.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })

  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    totalFilms,
    watchedFilms,
    unwatchedFilms,
    totalDirectors,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalScore,
    ratingDistribution,
    topGenres,
  }
}
