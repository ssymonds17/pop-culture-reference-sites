export { connectToDatabase } from "./client"

// Film services
export {
  createFilm,
  getFilms,
  getFilmById,
  getFilmByTmdbId,
  updateFilmRating,
  deleteFilm,
  findFilmsByTitle,
} from "./services/films"

// Director services
export {
  createDirector,
  getDirectors,
  getDirectorById,
  getDirectorByTmdbPersonId,
  findDirectorsByName,
  updateDirectorStats,
} from "./services/directors"

// Year services
export {
  getYears,
  getYearStats,
  updateYearStats,
} from "./services/years"

// Stats services
export { getOverallStats } from "./services/stats"
