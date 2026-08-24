'use client'

import { useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { Director, DirectorSortOption } from '@/types'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import DirectorFilters from '@/components/Filters/DirectorFilters'
import DirectorsTable from '@/components/Table/DirectorsTable'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const DEFAULT_SORT: DirectorSortOption = 'totalPoints'

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<DirectorSortOption>(DEFAULT_SORT)

  const fetchDirectors = async (
    searchString: string,
    sort: DirectorSortOption
  ) => {
    try {
      setLoading(true)

      // If search string is provided, use the search endpoint
      if (searchString) {
        const params = new URLSearchParams()
        params.append('searchString', searchString)
        params.append('itemType', 'director')

        const url = `${API_ENDPOINTS.search}?${params.toString()}`
        const response = await axios.get(url)

        // Sort results client-side
        const sortedDirectors: Director[] = [...response.data.data]
        if (sort === 'totalPoints') {
          sortedDirectors.sort((a, b) => b.totalPoints - a.totalPoints)
        } else if (sort === 'seenFilms') {
          sortedDirectors.sort((a, b) => b.seenFilms - a.seenFilms)
        } else if (sort === 'totalFilms') {
          sortedDirectors.sort((a, b) => b.totalFilms - a.totalFilms)
        } else if (sort === 'averageRating') {
          sortedDirectors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        }

        setDirectors(sortedDirectors)
        setError(null)
      } else {
        // Otherwise use the regular directors endpoint with sort
        const url = `${API_ENDPOINTS.directors}?sortBy=${sort}`
        const response = await axios.get(url)
        setDirectors(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching directors:', err)
      setError('Failed to load directors')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchString: string, sort: DirectorSortOption) => {
    setSortBy(sort)
    fetchDirectors(searchString, sort)
  }

  const handleReset = () => {
    setSortBy(DEFAULT_SORT)
    setDirectors([])
    setError(null)
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Directors</h1>
          <p className="text-gray-400">Explore director rankings and statistics</p>
        </div>

        <DirectorFilters
          sortBy={sortBy}
          onSearch={handleSearch}
          onReset={handleReset}
        />

      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(20)].map((_, i) => (
            <Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151" />
          ))}
        </div>
      ) : directors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            No directors to show. Search or sort above, or load them all.
          </p>
          <button
            onClick={() => fetchDirectors('', sortBy)}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Load All Directors
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-gray-400">
            Showing {directors.length} director{directors.length !== 1 ? 's' : ''}
          </div>
          <DirectorsTable directors={directors} />
        </div>
      )}
    </div>
    </ProtectedRoute>
  )
}
