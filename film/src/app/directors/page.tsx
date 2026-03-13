'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { Director } from '@/types'
import { useFilmContext } from '@/lib/context/FilmContext'
import DirectorFilters from '@/components/Filters/DirectorFilters'
import DirectorsTable from '@/components/Table/DirectorsTable'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedDirectorSort, directorSearchString } = useFilmContext()

  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        setLoading(true)

        // If search string is provided, use the search endpoint
        if (directorSearchString) {
          const params = new URLSearchParams()
          params.append('searchString', directorSearchString)
          params.append('itemType', 'director')

          const url = `${API_ENDPOINTS.search}?${params.toString()}`
          const response = await axios.get(url)

          // Sort results client-side
          let sortedDirectors = response.data.data
          if (selectedDirectorSort === 'totalPoints') {
            sortedDirectors.sort((a: Director, b: Director) => b.totalPoints - a.totalPoints)
          } else if (selectedDirectorSort === 'seenFilms') {
            sortedDirectors.sort((a: Director, b: Director) => b.seenFilms - a.seenFilms)
          } else if (selectedDirectorSort === 'averageRating') {
            sortedDirectors.sort((a: Director, b: Director) => (b.averageRating || 0) - (a.averageRating || 0))
          }

          setDirectors(sortedDirectors)
          setError(null)
        } else {
          // Otherwise use the regular directors endpoint with sort
          const url = `${API_ENDPOINTS.directors}?sortBy=${selectedDirectorSort}`
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

    fetchDirectors()
  }, [selectedDirectorSort, directorSearchString])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Directors</h1>
        <p className="text-gray-400">Explore director rankings and statistics</p>
      </div>

      <DirectorFilters />

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
      ) : (
        <div>
          <div className="mb-4 text-gray-400">
            Showing {directors.length} director{directors.length !== 1 ? 's' : ''}
          </div>
          <DirectorsTable directors={directors} />
        </div>
      )}
    </div>
  )
}
