"use client"

import { useState, useEffect } from "react"
import { Film } from "@/types"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"

interface YearFilmsModalProps {
  year: number | null
  isOpen: boolean
  onClose: () => void
}

export default function YearFilmsModal({
  year,
  isOpen,
  onClose,
}: YearFilmsModalProps) {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchYearFilms = async () => {
      if (!isOpen || !year) return

      try {
        setLoading(true)
        setError(null)
        setFilms([]) // Reset films when fetching new year

        const response = await axios.get(API_ENDPOINTS.films, {
          params: { year },
        })
        setFilms(response.data.data || [])
      } catch (err) {
        console.error("Error fetching year films:", err)
        setError("Failed to load films")
      } finally {
        setLoading(false)
      }
    }

    fetchYearFilms()
  }, [isOpen, year])

  if (!isOpen || !year) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2">{year}</h2>
        {!loading && (
          <p className="text-gray-400 text-sm mb-6">
            {films.length} film{films.length !== 1 ? "s" : ""} from {year}
          </p>
        )}

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading films...
          </div>
        ) : films.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No films found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                    Owned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {films.map((film) => (
                  <tr
                    key={film._id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{film.title}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {film.rating ? (
                        <span className="font-semibold text-film-400">
                          {film.rating}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {film.owned ? (
                        <span className="text-blue-400 text-sm">✓</span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
