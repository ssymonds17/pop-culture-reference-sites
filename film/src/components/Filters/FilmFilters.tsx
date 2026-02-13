'use client'

import { useState, useEffect } from 'react'
import { useFilmContext } from '@/lib/context/FilmContext'

export default function FilmFilters() {
  const { selectedFilters, setSelectedFilters, resetFilters } = useFilmContext()
  const [watched, setWatched] = useState<string>('all')
  const [minRating, setMinRating] = useState<string>('')
  const [maxRating, setMaxRating] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [genre, setGenre] = useState<string>('')

  useEffect(() => {
    const filters: any = {}

    if (watched === 'watched') filters.watched = true
    if (watched === 'unwatched') filters.watched = false
    if (minRating) filters.minRating = parseInt(minRating)
    if (maxRating) filters.maxRating = parseInt(maxRating)
    if (year) filters.year = parseInt(year)
    if (genre) filters.genre = genre

    setSelectedFilters(filters)
  }, [watched, minRating, maxRating, year, genre])

  const handleReset = () => {
    setWatched('all')
    setMinRating('')
    setMaxRating('')
    setYear('')
    setGenre('')
    resetFilters()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            Min Rating
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="1-10"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Max Rating
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            placeholder="1-10"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2020"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Genre
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g. Drama"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded px-3 py-2 text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
