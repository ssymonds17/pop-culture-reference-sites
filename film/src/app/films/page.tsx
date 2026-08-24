'use client'

import { useRef, useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { Film, FilmFilters as FilmFilterValues } from '@/types'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import FilmFilters from '@/components/Filters/FilmFilters'
import FilmGrid from '@/components/Films/FilmGrid'
import { AddFilmModal } from '@/components/Modal/AddFilmModal'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddFilmModalOpen, setIsAddFilmModalOpen] = useState(false)
  // The filters behind the results currently on screen, so refreshes after an
  // edit or an add re-run the same query.
  const [activeFilters, setActiveFilters] = useState<FilmFilterValues>({})
  const resultsRef = useRef<HTMLDivElement>(null)

  const fetchFilms = async (filters: FilmFilterValues) => {
    try {
      setLoading(true)
      setActiveFilters(filters)
      const params = new URLSearchParams()

      // If search string is provided, use the search endpoint
      if (filters.searchString) {
        params.append('searchString', filters.searchString)
        params.append('itemType', 'film')

        const url = `${API_ENDPOINTS.search}?${params.toString()}`
        const response = await axios.get(url)

        // Apply other filters client-side to search results
        let filteredFilms = response.data.data

        if (filters.watched !== undefined) {
          filteredFilms = filteredFilms.filter((f: Film) => f.watched === filters.watched)
        }
        if (filters.minRating) {
          filteredFilms = filteredFilms.filter((f: Film) => f.rating && f.rating >= filters.minRating!)
        }
        if (filters.maxRating) {
          filteredFilms = filteredFilms.filter((f: Film) => f.rating && f.rating <= filters.maxRating!)
        }
        if (filters.yearStart) {
          filteredFilms = filteredFilms.filter((f: Film) => f.year >= filters.yearStart!)
        }
        if (filters.yearEnd) {
          filteredFilms = filteredFilms.filter((f: Film) => f.year <= filters.yearEnd!)
        }
        if (filters.genres && filters.genres.length > 0) {
          // OR logic: film must have ANY of the selected genres
          filteredFilms = filteredFilms.filter((f: Film) =>
            filters.genres!.some((genre: string) => f.genres?.includes(genre))
          )
        }
        if (filters.directorId) {
          filteredFilms = filteredFilms.filter((f: Film) =>
            f.directors.some((d: any) => d._id === filters.directorId)
          )
        }
        if (filters.owned !== undefined) {
          filteredFilms = filteredFilms.filter((f: Film) => f.owned === filters.owned)
        }
        if (filters.hasReview !== undefined) {
          if (filters.hasReview) {
            filteredFilms = filteredFilms.filter((f: Film) => f.review && f.review.trim() !== "")
          } else {
            filteredFilms = filteredFilms.filter((f: Film) => !f.review || f.review.trim() === "")
          }
        }

        setFilms(filteredFilms)
        setError(null)
      } else {
        // Otherwise use the regular films endpoint with filters
        if (filters.watched !== undefined) {
          params.append('watched', filters.watched.toString())
        }
        if (filters.minRating) {
          params.append('minRating', filters.minRating.toString())
        }
        if (filters.maxRating) {
          params.append('maxRating', filters.maxRating.toString())
        }
        if (filters.yearStart) {
          params.append('yearStart', filters.yearStart.toString())
        }
        if (filters.yearEnd) {
          params.append('yearEnd', filters.yearEnd.toString())
        }
        if (filters.genres && filters.genres.length > 0) {
          params.append('genres', filters.genres.join(','))
        }
        if (filters.directorId) {
          params.append('directorId', filters.directorId)
        }
        if (filters.owned !== undefined) {
          params.append('owned', filters.owned.toString())
        }
        if (filters.hasReview !== undefined) {
          params.append('hasReview', filters.hasReview.toString())
        }

        const url = `${API_ENDPOINTS.films}?${params.toString()}`
        const response = await axios.get(url)
        setFilms(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching films:', err)
      setError('Failed to load films')
    } finally {
      setLoading(false)
    }
  }

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSearch = (filters: FilmFilterValues) => {
    fetchFilms(filters)
    scrollToResults()
  }

  const handleReset = () => {
    setActiveFilters({})
    setFilms([])
    setError(null)
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Films</h1>
            <p className="text-gray-400">Browse and manage your film collection</p>
          </div>
          <button
            onClick={() => setIsAddFilmModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Film
          </button>
        </div>

      <FilmFilters onSearch={handleSearch} onReset={handleReset} />

      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div ref={resultsRef}>
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151" />
            ))}
          </div>
        ) : films.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              No films to show. Search or filter above, or load them all.
            </p>
            <button
              onClick={() => fetchFilms({})}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Load All Films
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-gray-400">
              Showing {films.length} film{films.length !== 1 ? 's' : ''}
            </div>
            <FilmGrid films={films} onUpdate={() => fetchFilms(activeFilters)} />
          </div>
        )}
      </div>

      <AddFilmModal
        isOpen={isAddFilmModalOpen}
        onClose={() => setIsAddFilmModalOpen(false)}
        onFilmAdded={() => fetchFilms(activeFilters)}
      />
    </div>
    </ProtectedRoute>
  )
}
