export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  films: `${API_URL}/films`,
  createFilm: `${API_URL}/film`,
  film: (id: string) => `${API_URL}/film/${id}`,
  genres: `${API_URL}/genres`,
  directors: `${API_URL}/directors`,
  director: (tmdbPersonId: string) => `${API_URL}/director/${tmdbPersonId}`,
  stats: `${API_URL}/stats`,
  years: `${API_URL}/years`,
  year: (year: number) => `${API_URL}/year/${year}`,
  search: `${API_URL}/search`,
  searchTmdb: `${API_URL}/search/tmdb`,
  tmdbFilmDetails: (tmdbId: string) => `${API_URL}/tmdb/${tmdbId}`,
}
