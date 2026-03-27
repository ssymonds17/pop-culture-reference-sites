export interface Film {
  _id: string
  title: string
  year: number
  directors: Director[]
  watched: boolean
  rating?: number
  owned?: boolean
  genres: string[]
  language?: string
  duration?: number
  tmdbId: string
  imdbId?: string
  posterPath?: string
  overview?: string
  voteAverage?: number
  originalTitle?: string
  review?: string
}

export interface Director {
  _id: string
  tmdbPersonId: string
  name: string
  displayName: string
  films: Film[]
  totalFilms: number
  seenFilms: number
  averageRating?: number
  totalScore: number
  ratingCounts: {
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
  totalPoints: number
}

export interface YearStats {
  _id: string
  year: number
  totalFilms: number
  watchedFilms: number
  averageRating?: number
  totalScore: number
  filmsRated6Plus: number
  percentRated6Plus: number
  yearScore: number
  ratingDistribution: {
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
  topGenres: Array<{
    genre: string
    count: number
  }>
}

export interface OverallStats {
  totalFilms: number
  watchedFilms: number
  unwatchedFilms: number
  totalDirectors: number
  averageRating: number
  totalScore: number
  ratingDistribution: {
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
  topGenres: Array<{
    genre: string
    count: number
  }>
}

export interface FilmFilters {
  watched?: boolean
  minRating?: number
  maxRating?: number
  year?: number
  genres?: string[]
  directorId?: string
  searchString?: string
  hasReview?: boolean
}

export type DirectorSortOption = 'totalPoints' | 'seenFilms' | 'averageRating'
