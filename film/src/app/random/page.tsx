'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { Film } from '@/types'
import { formatDuration } from '@/lib/utils'
import RatingBadge from '@/components/Rating/RatingBadge'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function RandomFilmsPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watched, setWatched] = useState<string>("all")
  const [yearStart, setYearStart] = useState<string>("")
  const [yearEnd, setYearEnd] = useState<string>("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.genres)
        setAvailableGenres(response.data.data)
      } catch (error) {
        console.error("Error fetching genres:", error)
      }
    }
    fetchGenres()
  }, [])

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    )
  }

  const handleGetRandomFilms = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()

      if (watched === "watched") params.append('watched', 'true')
      if (watched === "unwatched") params.append('watched', 'false')
      if (yearStart) params.append('yearStart', yearStart)
      if (yearEnd) params.append('yearEnd', yearEnd)
      if (selectedGenres.length > 0) {
        params.append('genres', selectedGenres.join(','))
      }

      const url = `${API_ENDPOINTS.randomFilms}?${params.toString()}`
      const response = await axios.get(url)
      setFilms(response.data.data)
    } catch (err) {
      console.error('Error fetching random films:', err)
      setError('Failed to load random films')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setWatched("all")
    setYearStart("")
    setYearEnd("")
    setSelectedGenres([])
    setFilms([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Random Films</h1>
        <p className="text-gray-400">Get up to 5 random films from your owned collection</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleGetRandomFilms}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded text-sm font-medium transition-colors"
          >
            Get Random Films
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Status
            </label>
            <select
              value={watched}
              onChange={(e) => setWatched(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
            >
              <option value="all">All</option>
              <option value="watched">Watched</option>
              <option value="unwatched">Unwatched</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Year Start
            </label>
            <input
              type="number"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              placeholder="e.g. 1990"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Year End
            </label>
            <input
              type="number"
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              placeholder="e.g. 2010"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Genres (click to select multiple - AND logic)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedGenres.includes(genre)
                    ? "bg-blue-600 text-white border border-blue-600"
                    : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151" />
          ))}
        </div>
      ) : films.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Poster
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Director(s)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Genres
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {films.map((film) => (
                  <tr key={film._id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-2">
                      <div className="flex justify-center">
                        {film.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w92${film.posterPath}`}
                            alt={film.title}
                            className="max-h-32 object-contain rounded"
                          />
                        ) : (
                          <div className="w-20 h-32 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                            No poster
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-sm">{film.title}</div>
                      {film.originalTitle && film.originalTitle !== film.title && (
                        <div className="text-xs text-gray-500 mt-1">
                          Original: {film.originalTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-300 text-sm">{film.year}</td>
                    <td className="px-3 py-3 text-gray-300 text-sm text-left">
                      {film.directors && film.directors.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-start">
                          {film.directors.map((director, index) => {
                            const isLast = index === film.directors.length - 1
                            const isSecondToLast = index === film.directors.length - 2
                            const hasTwoDirectors = film.directors.length === 2
                            const hasThreeOrMore = film.directors.length >= 3

                            return (
                              <span key={director._id} className="text-gray-300">
                                {director.displayName}
                                {!isLast && (
                                  <span className="text-gray-500">
                                    {hasTwoDirectors ? ' & ' :
                                     hasThreeOrMore && isSecondToLast ? ' & ' : ', '}
                                  </span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        "Unknown"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {film.genres && film.genres.length > 0 ? (
                          film.genres.map((genre) => (
                            <span
                              key={genre}
                              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                            >
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No genres</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {film.rating ? (
                        <RatingBadge rating={film.rating} />
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-300 text-sm">
                      {film.duration ? formatDuration(film.duration) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          {films.length === 0 && !loading ? 'No films found matching your criteria. Try adjusting your filters.' : 'Click "Get Random Films" to start'}
        </div>
      )}
    </div>
  )
}
