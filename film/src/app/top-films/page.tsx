'use client'

import { ReactNode, useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { API_ENDPOINTS } from '@/lib/api'
import { createAuthenticatedClient } from '@/lib/auth-api'
import { Film } from '@/types'
import ProtectedRoute from '@/components/Auth/ProtectedRoute'
import RatingBadge from '@/components/Rating/RatingBadge'
import { formatDirectorNames } from '@/lib/utils'

type RankedFilm = Film & { rank: number; rating: number }

interface DragHandlers {
  onDragStart: (index: number) => React.DragEventHandler<HTMLLIElement>
  onDragOver: (index: number) => React.DragEventHandler<HTMLLIElement>
  onDragLeave: () => void
  onDrop: (index: number) => React.DragEventHandler<HTMLLIElement>
  onDragEnd: () => void
}

const SkeletonList = () => (
  <div className="space-y-2">
    {[...Array(10)].map((_, i) => (
      <Skeleton
        key={i}
        height={72}
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
    className="mt-6 first:mt-0 mb-2 flex items-center gap-3 text-sm font-semibold text-gray-300 uppercase tracking-wider"
  >
    <RatingBadge rating={rating} />
    <span>{rating} / 10</span>
  </li>
)

interface FilmRowProps {
  film: RankedFilm
  index: number
  isDragOver: boolean
  isOtherTier: boolean
  handlers: DragHandlers
}

const FilmRow = ({
  film,
  index,
  isDragOver,
  isOtherTier,
  handlers,
}: FilmRowProps) => {
  const borderClass = isDragOver
    ? 'border-film-500 bg-gray-800'
    : 'border-gray-800'
  const cursorClass = isOtherTier
    ? 'cursor-not-allowed opacity-60'
    : 'cursor-grab active:cursor-grabbing'

  return (
    <li
      draggable
      onDragStart={handlers.onDragStart(index)}
      onDragOver={handlers.onDragOver(index)}
      onDragLeave={handlers.onDragLeave}
      onDrop={handlers.onDrop(index)}
      onDragEnd={handlers.onDragEnd}
      className={`flex items-center gap-4 px-4 py-3 rounded border bg-gray-900 transition-colors ${borderClass} ${cursorClass}`}
    >
      <span className="w-10 text-center font-bold text-film-400">
        {film.rank}
      </span>
      <span aria-hidden className="text-gray-500 select-none">
        ⋮⋮
      </span>
      {film.posterPath ? (
        <img
          src={`https://image.tmdb.org/t/p/w92${film.posterPath}`}
          alt={film.title}
          className="w-12 h-auto object-contain rounded shrink-0"
        />
      ) : (
        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-[10px] text-center p-1 shrink-0">
          No poster
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{film.title}</div>
        <div className="text-sm text-gray-400 truncate">
          {formatDirectorNames(film.directors)} · {film.year}
        </div>
      </div>
    </li>
  )
}

interface FilmListProps {
  films: RankedFilm[]
  dragIndex: number | null
  dragOverIndex: number | null
  handlers: DragHandlers
}

const FilmList = ({
  films,
  dragIndex,
  dragOverIndex,
  handlers,
}: FilmListProps) => {
  const items: ReactNode[] = films.flatMap((film, index) => {
    const showHeader =
      index === 0 || films[index - 1].rating !== film.rating
    const isOtherTier =
      dragIndex !== null && films[dragIndex].rating !== film.rating
    const row = (
      <FilmRow
        key={film._id}
        film={film}
        index={index}
        isDragOver={dragOverIndex === index}
        isOtherTier={isOtherTier}
        handlers={handlers}
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

  return <ol className="list-none space-y-2 pl-0">{items}</ol>
}

export default function TopFilmsPage() {
  const { getToken } = useAuth()
  const [films, setFilms] = useState<RankedFilm[]>([])
  const [initialOrder, setInitialOrder] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchTopFilms = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(API_ENDPOINTS.topFilms)
        const fetched: RankedFilm[] = response.data.films ?? []
        setFilms(fetched)
        setInitialOrder(fetched.map((f) => f._id))
      } catch (err) {
        console.error('Error fetching top films:', err)
        setError('Failed to load top films')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTopFilms()
  }, [])

  const isDirty =
    films.length === initialOrder.length &&
    films.some((film, index) => film._id !== initialOrder[index])

  const handlers: DragHandlers = {
    onDragStart: (index) => () => {
      setDragIndex(index)
      setSuccessMessage(null)
      setError(null)
    },
    onDragOver: (index) => (event) => {
      if (dragIndex === null) return
      if (films[dragIndex].rating !== films[index].rating) {
        event.dataTransfer.dropEffect = 'none'
        return
      }
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (dragOverIndex !== index) setDragOverIndex(index)
    },
    onDragLeave: () => setDragOverIndex(null),
    onDrop: (index) => (event) => {
      event.preventDefault()
      const from = dragIndex
      setDragIndex(null)
      setDragOverIndex(null)
      if (from === null || from === index) return
      if (films[from].rating !== films[index].rating) return

      setFilms((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(index, 0, moved)
        return next.map((film, i) => ({ ...film, rank: i + 1 }))
      })
    },
    onDragEnd: () => {
      setDragIndex(null)
      setDragOverIndex(null)
    },
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
      setSuccessMessage('Top films order saved')
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Failed to save top films order'
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
    return (
      <FilmList
        films={films}
        dragIndex={dragIndex}
        dragOverIndex={dragOverIndex}
        handlers={handlers}
      />
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Top Films</h1>
            <p className="text-gray-400">
              Reorder your 8, 9, and 10-rated films within each tier. Drops
              between tiers are not permitted.
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
              {isSaving ? 'Saving...' : 'Save order'}
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
