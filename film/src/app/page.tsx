'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { OverallStats } from '@/types'
import OverviewCard from '@/components/Stats/OverviewCard'
import RatingDistribution from '@/components/Stats/RatingDistribution'
import GenreDistribution from '@/components/Stats/GenreDistribution'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function Home() {
  const [stats, setStats] = useState<OverallStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await axios.get(API_ENDPOINTS.stats)
        setStats(response.data.data)
        setError(null)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Film Ratings Dashboard</h1>
        <p className="text-gray-400">Track and rate your film collection</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={120} baseColor="#1f2937" highlightColor="#374151" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard
              title="Total Films"
              value={stats.totalFilms}
              icon="🎬"
            />
            <OverviewCard
              title="Watched"
              value={stats.watchedFilms}
              subtitle={`${((stats.watchedFilms / stats.totalFilms) * 100).toFixed(1)}% of total`}
              icon="✅"
            />
            <OverviewCard
              title="Average Rating"
              value={stats.averageRating.toFixed(2)}
              subtitle="Out of 10"
              icon="⭐"
            />
            <OverviewCard
              title="Directors"
              value={stats.totalDirectors}
              icon="🎥"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RatingDistribution distribution={stats.ratingDistribution} />
            <GenreDistribution genres={stats.topGenres} />
          </div>
        </>
      ) : null}
    </div>
  )
}
