"use client"

import { ReactNode, useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { API_ENDPOINTS } from "@/lib/api"
import { createAuthenticatedClient } from "@/lib/auth-api"
import { Film } from "@/types"
import ProtectedRoute from "@/components/Auth/ProtectedRoute"
import RatingBadge from "@/components/Rating/RatingBadge"
import {
  formatDirectorNames,
  formatDuration,
  getTmdbPosterUrl,
} from "@/lib/utils"

type RankedFilm = Film & { rank: number; rating: number }

const SkeletonList = () => (
  <div className="space-y-2">
    {[...Array(10)].map((_, i) => (
      <Skeleton
        key={i}
        height={300}
        baseColor="#1f2937"
        highlightColor="#374151"
      />
    ))}
  </div>
)

const EmptyState = () => (
  <div className="text-center py-12 text-gray-400">
    No films rated 8, 9, or 10 yet.
  </div>
)

const TierHeader = ({ rating }: { rating: number }) => (
  <li
    aria-hidden
    className="pt-12 first:pt-4 pb-8 flex items-center gap-4"
  >
    <span className="flex-1 border-t-2 border-gray-600" />
    <RatingBadge rating={rating} size="lg" />
    <span className="flex-1 border-t-2 border-gray-600" />
  </li>
)

interface FilmRowProps {
  film: RankedFilm
  index: number
  tierRanks: number[]
  onPlace: (index: number, newRank: number) => void
}

const FilmRow = ({ film, index, tierRanks, onPlace }: FilmRowProps) => {
  const [isRankModalOpen, setIsRankModalOpen] = useState(false)
  const canReorder = tierRanks.length > 1

  return (
    <li>
      <div className="flex items-stretch">
        {/* Left half: poster pushed to the centre line (under the tier badge) */}
        <div className="w-1/2 flex justify-end pr-4">
          <div className="relative w-40 sm:w-56 shrink-0 overflow-hidden rounded-lg border border-gray-800">
            {film.posterPath ? (
              <img
                src={getTmdbPosterUrl(film.posterPath, "w342")}
                alt={film.title}
                className="w-full h-auto object-cover aspect-[2/3]"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                No poster
              </div>
            )}
            <button
              onClick={() => canReorder && setIsRankModalOpen(true)}
              disabled={!canReorder}
              aria-label={`Change rank for ${film.title}, currently rank ${film.rank}`}
              className="absolute top-2 right-2 inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-full bg-gray-900/90 text-film-400 font-bold text-lg ring-2 ring-black/40 shadow-md transition-colors enabled:hover:bg-gray-800 enabled:hover:text-film-300 disabled:cursor-default"
            >
              {film.rank}
            </button>
          </div>
        </div>

        {/* Right half: details start at the centre line */}
        <div className="w-1/2 flex flex-col justify-center pl-4 min-w-0 space-y-1">
          <h3 className="font-semibold text-xl leading-tight break-words">
            {film.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span>{film.year}</span>
            {film.duration && (
              <>
                <span className="text-gray-600">•</span>
                <span>{formatDuration(film.duration)}</span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-400 break-words">
            {formatDirectorNames(film.directors)}
          </div>
        </div>
      </div>

      {isRankModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsRankModalOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-1">Move to rank</h2>
            <p className="text-gray-400 text-sm mb-4 truncate">{film.title}</p>
            <div className="grid grid-cols-5 gap-2">
              {tierRanks.map((rank) => (
                <button
                  key={rank}
                  onClick={() => {
                    onPlace(index, rank)
                    setIsRankModalOpen(false)
                  }}
                  className={`py-2 rounded font-medium transition-colors ${
                    rank === film.rank
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {rank}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsRankModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

interface FilmListProps {
  films: RankedFilm[]
  onPlace: (index: number, newRank: number) => void
}

const FilmList = ({ films, onPlace }: FilmListProps) => {
  // Each tier occupies a contiguous block of ranks; collect the rank slots per tier
  const tierRanksByRating = new Map<number, number[]>()
  films.forEach((film) => {
    const ranks = tierRanksByRating.get(film.rating) ?? []
    ranks.push(film.rank)
    tierRanksByRating.set(film.rating, ranks)
  })

  const items: ReactNode[] = films.flatMap((film, index) => {
    const showHeader = index === 0 || films[index - 1].rating !== film.rating
    const row = (
      <FilmRow
        key={film._id}
        film={film}
        index={index}
        tierRanks={tierRanksByRating.get(film.rating) ?? [film.rank]}
        onPlace={onPlace}
      />
    )
    if (showHeader) {
      return [
        <TierHeader key={`header-${film.rating}`} rating={film.rating} />,
        row,
      ]
    }
    return [row]
  })

  return (
    <ol className="list-none space-y-2 pl-0 w-full max-w-2xl mx-auto">{items}</ol>
  )
}

export default function TopFilmsPage() {
  const { getToken } = useAuth()
  const [films, setFilms] = useState<RankedFilm[]>([])
  const [initialOrder, setInitialOrder] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopFilms = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(API_ENDPOINTS.topFilms)
        const fetched: RankedFilm[] = response.data.films ?? []
        setFilms(fetched)
        setInitialOrder(fetched.map((f) => f._id))
      } catch (err) {
        console.error("Error fetching top films:", err)
        setError("Failed to load top films")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTopFilms()
  }, [])

  const isDirty =
    films.length === initialOrder.length &&
    films.some((film, index) => film._id !== initialOrder[index])

  const handlePlace = (index: number, newRank: number) => {
    setSuccessMessage(null)
    setError(null)
    setFilms((prev) => {
      const targetIndex = newRank - 1
      if (
        index < 0 ||
        index >= prev.length ||
        targetIndex < 0 ||
        targetIndex >= prev.length ||
        targetIndex === index
      ) {
        return prev
      }
      // The dropdown only offers ranks within the film's own tier, so a move
      // always stays inside that tier and preserves the tier grouping.
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next.map((film, i) => ({ ...film, rank: i + 1 }))
    })
  }

  const handleSave = async () => {
    if (!isDirty) return
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)
      const client = await createAuthenticatedClient(getToken)
      const filmIds = films.map((f) => f._id)
      await client.put(API_ENDPOINTS.topFilms, { filmIds })
      setInitialOrder(filmIds)
      setSuccessMessage("Top films order saved")
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to save top films order"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFilms((prev) => {
      const byId = new Map(prev.map((f) => [f._id, f]))
      return initialOrder
        .map((id) => byId.get(id))
        .filter((f): f is RankedFilm => Boolean(f))
        .map((film, i) => ({ ...film, rank: i + 1 }))
    })
    setError(null)
    setSuccessMessage(null)
  }

  const renderBody = () => {
    if (isLoading) return <SkeletonList />
    if (films.length === 0) return <EmptyState />
    return <FilmList films={films} onPlace={handlePlace} />
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Top Films</h1>
            <p className="text-gray-400">
              Rank your 8, 9, and 10-rated films by choosing a position within
              each tier. Films can only be moved within their own tier.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && !isSaving && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save order"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-900/20 border border-green-900 text-green-400 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {renderBody()}
      </div>
    </ProtectedRoute>
  )
}
