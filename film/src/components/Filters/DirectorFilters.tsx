'use client'

import { useFilmContext } from '@/lib/context/FilmContext'
import { DirectorSortOption } from '@/types'

export default function DirectorFilters() {
  const { selectedDirectorSort, setSelectedDirectorSort } = useFilmContext()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-400">Sort by:</label>
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
  )
}
