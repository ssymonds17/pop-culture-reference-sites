'use client'

import { useState } from 'react'
import { useFilmContext } from '@/lib/context/FilmContext'
import { DirectorSortOption } from '@/types'

export default function DirectorFilters() {
  const { selectedDirectorSort, setSelectedDirectorSort, setDirectorSearchString } = useFilmContext()
  const [searchInput, setSearchInput] = useState('')

  const handleSearchSubmit = () => {
    setDirectorSearchString(searchInput)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  const handleReset = () => {
    setSearchInput('')
    setDirectorSearchString('')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="space-y-4">
        {/* Search Row */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Search:</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search directors"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:border-film-500"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearchSubmit}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
              >
                Search
              </button>
              <button
                onClick={handleReset}
                className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sort Row */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Sort by:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'totalPoints', label: 'Total Points' },
              { value: 'seenFilms', label: 'Films Seen' },
              { value: 'averageRating', label: 'Average Rating' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDirectorSort(option.value as DirectorSortOption)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedDirectorSort === option.value
                    ? 'bg-film-700 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
