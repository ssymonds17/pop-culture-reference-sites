import Film, { FilmData } from "../models/film"

export const createFilm = async (filmData: FilmData) => {
  return Film.create(filmData)
}

export const getFilms = async (filters?: {
  watched?: boolean
  minRating?: number
  maxRating?: number
  year?: number
  genre?: string
  directorId?: string
  owned?: boolean
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
    if (filters.genre) {
      query.genres = filters.genre
    }
    if (filters.directorId) {
      query.directors = filters.directorId
    }
    if (filters.owned !== undefined) {
      query.owned = filters.owned
    }
  }

  return Film.find(query)
    .populate("directors")
    .sort({ year: -1, title: 1 })
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
