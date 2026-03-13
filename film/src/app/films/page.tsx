'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { Film } from '@/types'
import { useFilmContext } from '@/lib/context/FilmContext'
import FilmFilters from '@/components/Filters/FilmFilters'
import FilmsTable from '@/components/Table/FilmsTable'
import { AddFilmModal } from '@/components/Modal/AddFilmModal'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddFilmModalOpen, setIsAddFilmModalOpen] = useState(false)
  const { selectedFilters, dataRefreshRequired, setDataRefreshRequired } = useFilmContext()

  const fetchFilms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (selectedFilters.watched !== undefined) {
        params.append('watched', selectedFilters.watched.toString())
      }
      if (selectedFilters.minRating) {
        params.append('minRating', selectedFilters.minRating.toString())
      }
      if (selectedFilters.maxRating) {
        params.append('maxRating', selectedFilters.maxRating.toString())
      }
      if (selectedFilters.year) {
        params.append('year', selectedFilters.year.toString())
      }
      if (selectedFilters.genre) {
        params.append('genre', selectedFilters.genre)
      }
      if (selectedFilters.directorId) {
        params.append('directorId', selectedFilters.directorId)
      }

      const url = `${API_ENDPOINTS.films}?${params.toString()}`
      const response = await axios.get(url)
      setFilms(response.data.data)
      setError(null)
      setDataRefreshRequired(false)
    } catch (err) {
      console.error('Error fetching films:', err)
      setError('Failed to load films')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFilms()
  }, [selectedFilters, dataRefreshRequired])

  return (
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

      <FilmFilters />

      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151" />
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-4 text-gray-400">
            Showing {films.length} film{films.length !== 1 ? 's' : ''}
          </div>
          <FilmsTable films={films} onUpdate={fetchFilms} />
        </div>
      )}

      <AddFilmModal
        isOpen={isAddFilmModalOpen}
        onClose={() => setIsAddFilmModalOpen(false)}
        onFilmAdded={fetchFilms}
      />
    </div>
  )
}
