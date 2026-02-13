import Director, { DirectorData } from "../models/director"
import Film from "../models/film"

export const createDirector = async (directorData: DirectorData) => {
  return Director.create(directorData)
}

export const getDirectors = async (sortBy?: string) => {
  const sortOptions: any = {}

  switch (sortBy) {
    case "seenFilms":
      sortOptions.seenFilms = -1
      sortOptions.totalPoints = -1
      break
    case "averageRating":
      sortOptions.averageRating = -1
      sortOptions.seenFilms = -1
      break
    case "totalPoints":
    default:
      sortOptions.totalPoints = -1
      sortOptions.seenFilms = -1
      break
  }

  return Director.find({})
    .sort(sortOptions)
    .limit(200)
    .exec()
}

export const getDirectorById = async (id: string) => {
  return Director.findById(id)
    .populate({ path: "films", options: { sort: { year: -1, title: 1 } } })
    .exec()
}

export const getDirectorByTmdbPersonId = async (tmdbPersonId: string) => {
  return Director.findOne({ tmdbPersonId })
    .populate({ path: "films", options: { sort: { year: -1, title: 1 } } })
    .exec()
}

export const findDirectorsByName = async (name: string) => {
  return Director.find(
    { name: new RegExp(name, "i") },
    null,
    { sort: { totalPoints: -1 } }
  ).exec()
}

export const updateDirectorStats = async (directorId: string) => {
  const director = await Director.findById(directorId)
    .populate("films")
    .exec()

  if (!director) {
    throw new Error("Director not found")
  }

  const films = director.films as any[]

  // Calculate statistics
  const totalFilms = films.length
  const watchedFilms = films.filter((f: any) => f.watched && f.rating)
  const seenFilms = watchedFilms.length

  const totalScore = watchedFilms.reduce(
    (sum: number, f: any) => sum + (f.rating || 0),
    0
  )

  const averageRating = seenFilms > 0 ? totalScore / seenFilms : undefined

  // Calculate rating counts
  const ratingCounts = {
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

  watchedFilms.forEach((f: any) => {
    const rating = f.rating
    if (rating >= 1 && rating <= 10) {
      const key = `rating${rating}` as keyof typeof ratingCounts
      ratingCounts[key]++
    }
  })

  // Calculate total points (6=1pt, 7=3pt, 8=6pt, 9=10pt, 10=15pt)
  const totalPoints =
    ratingCounts.rating6 * 1 +
    ratingCounts.rating7 * 3 +
    ratingCounts.rating8 * 6 +
    ratingCounts.rating9 * 10 +
    ratingCounts.rating10 * 15

  // Update director
  director.totalFilms = totalFilms
  director.seenFilms = seenFilms
  director.averageRating = averageRating
  director.totalScore = totalScore
  director.ratingCounts = ratingCounts
  director.totalPoints = totalPoints

  return director.save()
}
