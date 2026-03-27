import Film, { FilmData } from "../models/film"

export const createFilm = async (filmData: FilmData) => {
  return Film.create(filmData)
}

export const getFilms = async (filters?: {
  watched?: boolean
  minRating?: number
  maxRating?: number
  year?: number
  genres?: string[]
  directorId?: string
  owned?: boolean
  hasReview?: boolean
}) => {
  const query: any = {}

  if (filters) {
    if (filters.watched !== undefined) {
      query.watched = filters.watched
    }
    if (filters.minRating !== undefined) {
      query.rating = { ...query.rating, $gte: filters.minRating }
    }
    if (filters.maxRating !== undefined) {
      query.rating = { ...query.rating, $lte: filters.maxRating }
    }
    if (filters.year !== undefined) {
      query.year = filters.year
    }
    if (filters.genres && filters.genres.length > 0) {
      // AND logic: film must have ALL selected genres
      query.genres = { $all: filters.genres }
    }
    if (filters.directorId) {
      query.directors = filters.directorId
    }
    if (filters.owned !== undefined) {
      query.owned = filters.owned
    }
    if (filters.hasReview !== undefined) {
      if (filters.hasReview) {
        // Has review: not null and not empty string
        query.review = { $nin: [null, ""] }
      } else {
        // No review: null or empty string or doesn't exist
        query.$or = [
          { review: { $exists: false } },
          { review: null },
          { review: "" }
        ]
      }
    }
  }

  return Film.find(query)
    .populate("directors")
    .sort({ rating: -1, year: -1, title: 1 })
    .limit(500)
    .exec()
}

export const getFilmById = async (id: string) => {
  return Film.findById(id).populate("directors").exec()
}

export const getFilmByTmdbId = async (tmdbId: string) => {
  return Film.findOne({ tmdbId }).exec()
}

export const updateFilm = async (
  id: string,
  rating?: number | null,
  owned?: boolean,
  review?: string | null,
) => {
  const updates: any = {}
  const unsets: any = {}

  // Handle rating and auto-update watched status
  if (rating !== undefined) {
    if (rating === null) {
      // Clear rating and set watched to false
      unsets.rating = ""
      updates.watched = false
    } else {
      // Set rating and set watched to true
      updates.rating = rating
      updates.watched = true
    }
  }

  if (owned !== undefined) {
    updates.owned = owned
  }

  // Handle review
  if (review !== undefined) {
    if (review === null || review === "") {
      // Clear review if null or empty string
      unsets.review = ""
    } else {
      updates.review = review
    }
  }

  const updateQuery: any = {}
  if (Object.keys(updates).length > 0) {
    updateQuery.$set = updates
  }
  if (Object.keys(unsets).length > 0) {
    updateQuery.$unset = unsets
  }

  return Film.findByIdAndUpdate(id, updateQuery, { new: true }).exec()
}

export const deleteFilm = async (id: string) => {
  return Film.findByIdAndDelete(id).exec()
}

export const findFilmsByTitle = async (title: string) => {
  return Film.find({ title: new RegExp(title, "i") }, null, {
    sort: { year: -1, title: 1 },
  })
    .populate("directors")
    .exec()
}

export const getUniqueGenres = async () => {
  const result = await Film.aggregate([
    { $unwind: "$genres" },
    { $group: { _id: "$genres" } },
    { $sort: { _id: 1 } }
  ]).exec()

  return result.map(item => item._id)
}
