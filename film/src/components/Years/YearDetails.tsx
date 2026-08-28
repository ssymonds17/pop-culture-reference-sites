"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { Film, YearStats } from "@/types"
import { API_ENDPOINTS } from "@/lib/api"
import OverviewCard from "@/components/Stats/OverviewCard"
import RatingDistribution from "@/components/Stats/RatingDistribution"
import GenreDistribution from "@/components/Stats/GenreDistribution"
import FilmGrid from "@/components/Films/FilmGrid"

interface YearDetailsProps {
  yearStats: YearStats
  onClose: () => void
}

export default function YearDetails({ yearStats, onClose }: YearDetailsProps) {
  const [films, setFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchYearFilms = async () => {
      try {
        setLoading(true)
        setError(null)
        setFilms([])
        const response = await axios.get(API_ENDPOINTS.films, {
          params: { year: yearStats.year },
        })
        if (!cancelled) setFilms(response.data.data || [])
      } catch (err) {
        console.error("Error fetching year films:", err)
        if (!cancelled) setError("Failed to load films")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchYearFilms()
    return () => {
      cancelled = true
    }
  }, [yearStats.year])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-3xl font-bold">{yearStats.year}</h2>
        <div className="flex items-baseline gap-4">
          <div className="text-right">
            <span className="text-sm text-gray-400">Year Score </span>
            <span className="text-xl font-bold text-film-500">
              {yearStats.yearScore.toFixed(1)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingDistribution distribution={yearStats.ratingDistribution} />
        <GenreDistribution genres={yearStats.topGenres} />
      </div>

      {/* Films from this year */}
      <div>
        <h3 className="text-xl font-bold mb-3">
          Films{!loading && ` (${films.length})`}
        </h3>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton
                key={i}
                height={280}
                baseColor="#1f2937"
                highlightColor="#374151"
              />
            ))}
          </div>
        ) : films.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No films found</div>
        ) : (
          <FilmGrid films={films} readOnly />
        )}
      </div>
    </div>
  )
}
