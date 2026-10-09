export interface RatingCounts {
  rating1: number
  rating2: number
  rating3: number
  rating4: number
  rating5: number
  rating6: number
  rating7: number
  rating8: number
  rating9: number
  rating10: number
}

export interface PersonStats {
  totalFilms: number // Total films in DB
  seenFilms: number // Watched count
  averageRating?: number // Average of watched films
  totalScore: number // Sum of ratings
  ratingCounts: RatingCounts
  totalPoints: number // Weighted score (6=1pt, 7=3pt, 8=6pt, 9=10pt, 10=15pt)
}

export const personStatsSchemaFields = {
  totalFilms: { type: Number, default: 0 },
  seenFilms: { type: Number, default: 0 },
  averageRating: { type: Number },
  totalScore: { type: Number, default: 0 },
  ratingCounts: {
    rating1: { type: Number, default: 0 },
    rating2: { type: Number, default: 0 },
    rating3: { type: Number, default: 0 },
    rating4: { type: Number, default: 0 },
    rating5: { type: Number, default: 0 },
    rating6: { type: Number, default: 0 },
    rating7: { type: Number, default: 0 },
    rating8: { type: Number, default: 0 },
    rating9: { type: Number, default: 0 },
    rating10: { type: Number, default: 0 },
  },
  totalPoints: { type: Number, default: 0 },
}

export const calculatePersonStats = (
  films: Array<{ watched?: boolean; rating?: number }>,
): PersonStats => {
  const totalFilms = films.length
  const watchedFilms = films.filter((f) => f.watched && f.rating)
  const seenFilms = watchedFilms.length

  const totalScore = watchedFilms.reduce((sum, f) => sum + (f.rating || 0), 0)

  const averageRating = seenFilms > 0 ? totalScore / seenFilms : undefined

  const ratingCounts: RatingCounts = {
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
    const rating = f.rating as number
    if (rating >= 1 && rating <= 10) {
      const key = `rating${rating}` as keyof RatingCounts
      ratingCounts[key]++
    }
  })

  const totalPoints =
    ratingCounts.rating6 * 1 +
    ratingCounts.rating7 * 3 +
    ratingCounts.rating8 * 6 +
    ratingCounts.rating9 * 10 +
    ratingCounts.rating10 * 15

  return {
    totalFilms,
    seenFilms,
    averageRating,
    totalScore,
    ratingCounts,
    totalPoints,
  }
}

export const personStatsSort = (sortBy?: string): Record<string, 1 | -1> => {
  switch (sortBy) {
    case "seenFilms":
      return { seenFilms: -1, totalPoints: -1 }
    case "totalFilms":
      return { totalFilms: -1, totalPoints: -1 }
    case "averageRating":
      return { averageRating: -1, seenFilms: -1 }
    case "totalPoints":
    default:
      return { totalPoints: -1, averageRating: -1, seenFilms: -1 }
  }
}
