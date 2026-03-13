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
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-400 whitespace-nowrap">Search:</label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search directors"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
          <button
            onClick={handleSearchSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            Search
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm font-medium transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Sort Row */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-400 whitespace-nowrap">Sort by:</label>
          <div className="flex space-x-2">
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
