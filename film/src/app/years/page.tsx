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
  const [filterYear, setFilterYear] = useState<string>("all")

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

  const filteredYears =
    filterYear === "all"
      ? years
      : years.filter(
          (yearStats) => yearStats.year === Number.parseInt(filterYear),
        )

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

      <div className="flex gap-4 items-center">
        <label htmlFor="year-filter" className="text-sm font-medium">
          Filter by year:
        </label>
        <select
          id="year-filter"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:border-film-700 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2020%2020%22%20fill%3d%22none%22%3e%3cpath%20d%3d%22M7%207l3-3%203%203m0%206l-3%203-3-3%22%20stroke%3d%22%239ca3af%22%20stroke-width%3d%221.5%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%2f%3e%3c%2fsvg%3e')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option value="all">All years</option>
          {[...years]
            .sort((a, b) => b.year - a.year)
            .map((yearStats) => (
              <option key={yearStats.year} value={yearStats.year.toString()}>
                {yearStats.year}
              </option>
            ))}
        </select>
        {filterYear !== "all" && (
          <button
            onClick={() => setFilterYear("all")}
            className="text-sm text-film-500 hover:text-film-400 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {new Array(10).fill(null).map((_, i) => (
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
          {filteredYears.map((yearStats) => (
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
