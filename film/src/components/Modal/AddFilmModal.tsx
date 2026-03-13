"use client"

import { useState } from "react"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"

interface TmdbSearchResult {
  tmdbId: string
  title: string
  year: number | null
  posterPath: string | null
  overview: string | null
}

interface AddFilmModalProps {
  isOpen: boolean
  onClose: () => void
  onFilmAdded: () => void
}

export const AddFilmModal = ({
  isOpen,
  onClose,
  onFilmAdded,
}: AddFilmModalProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [year, setYear] = useState("")
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setError("Please enter a search query")
      return
    }

    try {
      setSearching(true)
      setError(null)
      setSearchResults([])

      const params: any = { query: searchQuery }
      if (year.trim()) {
        params.year = year.trim()
      }

      const response = await axios.get(API_ENDPOINTS.searchTmdb, {
        params,
      })

      setSearchResults(response.data.data)

      if (response.data.data.length === 0) {
        setError("No films found. Try a different search term.")
      }
    } catch (err) {
      console.error("Error searching TMDB:", err)
      setError("Failed to search films. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  const handleCreateFilm = async (tmdbId: string, title: string) => {
    try {
      setCreating(true)
      setError(null)
      setSuccessMessage(null)

      await axios.post(API_ENDPOINTS.films, { tmdbId })

      setSuccessMessage(`"${title}" added successfully!`)
      setSearchQuery("")
      setYear("")
      setSearchResults([])

      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        onFilmAdded()
        onClose()
        setSuccessMessage(null)
      }, 1500)
    } catch (err: any) {
      console.error("Error creating film:", err)

      if (err.response?.status === 409) {
        setError("This film already exists in your collection.")
      } else {
        setError("Failed to add film. Please try again.")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setSearchQuery("")
    setYear("")
    setSearchResults([])
    setError(null)
    setSuccessMessage(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add Film</h2>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a film..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searching || creating}
            />
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={searching || creating}
            />
          </div>
        </form>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-900/20 border border-green-900 text-green-400 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              {searchResults.length} results found
            </p>
            {searchResults.map((result) => (
              <div
                key={result.tmdbId}
                className="flex gap-4 p-3 bg-gray-800 rounded hover:bg-gray-750 transition-colors"
              >
                {result.posterPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                    alt={result.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                    No poster
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{result.title}</h3>
                  <p className="text-gray-400 text-sm">
                    {result.year || "Unknown year"}
                  </p>
                  {result.overview && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {result.overview}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleCreateFilm(result.tmdbId, result.title)}
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-center"
                >
                  {creating ? "Adding..." : "Add"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={(e) => handleSearch(e)}
            disabled={searching || creating}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Searching..." : "Search"}
          </button>
          <button
            onClick={handleClose}
            disabled={creating}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
