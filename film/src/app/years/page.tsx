"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"
import { YearStats } from "@/types"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import YearFilmsModal from "@/components/Modal/YearFilmsModal"

export default function YearsPage() {
  const [years, setYears] = useState<YearStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleYearClick = (year: number) => {
    setSelectedYear(year)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedYear(null)
  }

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true)
        const response = await axios.get(API_ENDPOINTS.years)
        setYears(response.data.data)
        setError(null)
      } catch (err) {
        console.error("Error fetching years:", err)
        setError("Failed to load year statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchYears()
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Year Analysis</h1>
        <p className="text-gray-400">Film statistics by year</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton
              key={i}
              height={80}
              baseColor="#1f2937"
              highlightColor="#374151"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {years.map((yearStats) => (
            <div
              key={yearStats._id}
              onClick={() => handleYearClick(yearStats.year)}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-film-700 transition-colors cursor-pointer"
            >
              <div className="mb-4">
                <h3 className="text-2xl font-bold">{yearStats.year}</h3>
                <div className="mt-1">
                  <span className="text-sm text-gray-400">Year Score: </span>
                  <span className="text-xl font-bold text-film-500">
                    {yearStats.yearScore.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Total Films</div>
                  <div className="text-lg font-semibold">
                    {yearStats.totalFilms}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Watched</div>
                  <div className="text-lg font-semibold">
                    {yearStats.watchedFilms}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Avg Rating</div>
                  <div className="text-lg font-semibold">
                    {yearStats.averageRating?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">6+ Rated</div>
                  <div className="text-lg font-semibold">
                    {yearStats.percentRated6Plus.toFixed(1)}%
                  </div>
                </div>
              </div>
              {yearStats.topGenres.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-400 mb-2">Top Genres</div>
                  <div className="flex flex-wrap gap-2">
                    {yearStats.topGenres.slice(0, 5).map((genre) => (
                      <span
                        key={genre.genre}
                        className="px-2 py-1 bg-gray-800 rounded text-xs"
                      >
                        {genre.genre} ({genre.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <YearFilmsModal
        year={selectedYear}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}
