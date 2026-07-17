"use client"

import { useState, useEffect } from "react"
import { Film, YearStats } from "@/types"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"
import OverviewCard from "@/components/Stats/OverviewCard"
import RatingDistribution from "@/components/Stats/RatingDistribution"
import GenreDistribution from "@/components/Stats/GenreDistribution"

interface YearFilmsModalProps {
  yearStats: YearStats | null
  isOpen: boolean
  onClose: () => void
}

export default function YearFilmsModal({
  yearStats,
  isOpen,
  onClose,
}: YearFilmsModalProps) {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchYearFilms = async () => {
      if (!isOpen || !yearStats) return

      try {
        setLoading(true)
        setError(null)
        setFilms([]) // Reset films when fetching a new year

        const response = await axios.get(API_ENDPOINTS.films, {
          params: { year: yearStats.year },
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
  }, [isOpen, yearStats])

  if (!isOpen || !yearStats) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-3xl font-bold">{yearStats.year}</h2>
          <div className="text-right">
            <span className="text-sm text-gray-400">Year Score </span>
            <span className="text-xl font-bold text-film-500">
              {yearStats.yearScore.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <OverviewCard title="Total Films" value={yearStats.totalFilms} />
          <OverviewCard title="Watched" value={yearStats.watchedFilms} />
          <OverviewCard
            title="Avg Rating"
            value={
              yearStats.averageRating != null
                ? yearStats.averageRating.toFixed(2)
                : "N/A"
            }
          />
          <OverviewCard
            title="6+ Rated"
            value={`${yearStats.percentRated6Plus.toFixed(1)}%`}
            subtitle={`${yearStats.filmsRated6Plus} films`}
          />
        </div>

        {/* Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <RatingDistribution distribution={yearStats.ratingDistribution} />
          <GenreDistribution genres={yearStats.topGenres} />
        </div>

        {/* Films from this year */}
        <h3 className="text-xl font-bold mb-3">
          Films{!loading && ` (${films.length})`}
        </h3>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading films...</div>
        ) : films.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No films found</div>
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
