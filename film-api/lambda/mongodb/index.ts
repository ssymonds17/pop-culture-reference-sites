export { connectToDatabase } from "./client"

// Film services
export {
  createFilm,
  getFilms,
  getFilmById,
  getFilmDetailsById,
  getFilmByTmdbId,
  updateFilm,
  deleteFilm,
  findFilmsByTitle,
  getUniqueGenres,
  getRandomFilms,
} from "./services/films"

// Director services
export {
  findOrCreateDirector,
  getDirectors,
  getDirectorById,
  getDirectorByTmdbPersonId,
  findDirectorsByName,
  updateDirectorStats,
} from "./services/directors"

// Actor services
export {
  findOrCreateActor,
  getActors,
  getActorByTmdbPersonId,
  findActorsByName,
  updateActorStats,
  updateCastActorStats,
} from "./services/actors"

// Director model (for direct updates)
export { default as Director } from "./models/director"

// Year services
export {
  getYears,
  getYearStats,
  updateYearStats,
} from "./services/years"

// Stats services
export { getOverallStats } from "./services/stats"

// Top Films services
export {
  getTopFilms,
  updateTopFilms,
  addFilmToTopAtTierBottom,
  removeFilmFromTop,
  getEligibleFilmIdsByTier,
  syncTopFilmsWithRatings,
  isEligibleRating,
} from "./services/topFilms"
