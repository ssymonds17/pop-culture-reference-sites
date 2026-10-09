"use client"

import { useState, useEffect, useId, useRef } from "react"
import axios from "axios"
import { Actor, CastMember, Film } from "@/types"
import { useAuth } from "@clerk/nextjs"
import { API_ENDPOINTS } from "@/lib/api"
import { createAuthenticatedClient } from "@/lib/auth-api"
import { formatDirectorNames, formatDuration, getTmdbPosterUrl } from "@/lib/utils"
import RatingBadge from "../Rating/RatingBadge"

const CAST_PREVIEW_SIZE = 5

type FilmDetails = Pick<Film, "cast" | "productionCompanies">

type DetailsState =
  | { filmId: string; status: "loaded"; data: FilmDetails }
  | { filmId: string; status: "error" }

const hasActor = (member: CastMember): member is CastMember & { actor: Actor } =>
  member.actor !== null

const Spinner = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
)

interface FilmDetailModalProps {
  film: Film | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  /** Hides all update controls (rating, owned, review) - used on public pages */
  readOnly?: boolean
}

export default function FilmDetailModal({
  film,
  isOpen,
  onClose,
  onUpdate,
  readOnly = false,
}: FilmDetailModalProps) {
  const { getToken } = useAuth()
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [isDeletingReview, setIsDeletingReview] = useState(false)
  const [isUpdatingOwned, setIsUpdatingOwned] = useState(false)
  const [isUpdatingRating, setIsUpdatingRating] = useState(false)
  // The rating the user just clicked, shown optimistically until the refetched
  // film catches up. `undefined` means nothing is pending.
  const [pendingRating, setPendingRating] = useState<number | null | undefined>(
    undefined
  )
  const [ratingSaved, setRatingSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keyed by film so switching film never shows the previous film's cast while the new one loads
  const [detailsState, setDetailsState] = useState<DetailsState | null>(null)
  const [expandedCastFilmId, setExpandedCastFilmId] = useState<string | null>(null)
  const castHeadingId = useId()

  useEffect(() => {
    if (isOpen && film) {
      setIsEditingReview(false)
      setReviewText(film.review || "")
      setError(null)
    }
  }, [isOpen, film])

  // Reset the rating feedback whenever the modal opens or switches film
  useEffect(() => {
    setPendingRating(undefined)
    setRatingSaved(false)
  }, [isOpen, film?._id])

  // Drop the optimistic value once the refetched film reports the new rating
  useEffect(() => {
    if (pendingRating !== undefined && (film?.rating ?? null) === pendingRating) {
      setPendingRating(undefined)
    }
  }, [film?.rating, pendingRating])

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  // Cast and companies only come from the single-film endpoint, not the lists that open this modal
  const filmId = film?._id
  useEffect(() => {
    if (!isOpen || !filmId) return

    let cancelled = false
    setDetailsState((previous) => (previous?.status === "error" ? null : previous))

    const fetchDetails = async () => {
      try {
        const response = await axios.get<{ data: FilmDetails }>(API_ENDPOINTS.film(filmId))
        if (!cancelled) {
          setDetailsState({ filmId, status: "loaded", data: response.data.data })
        }
      } catch (err) {
        if (cancelled) return
        console.error("Error fetching film details:", err)
        setDetailsState({ filmId, status: "error" })
      }
    }

    fetchDetails()

    return () => {
      cancelled = true
    }
  }, [isOpen, filmId])

  const patchFilm = async (updates: Record<string, unknown>) => {
    if (!film) return
    const client = await createAuthenticatedClient(getToken)
    await client.patch(API_ENDPOINTS.film(film._id), updates)
    onUpdate()
  }

  const handleToggleOwned = async () => {
    if (!film || isUpdatingOwned) return
    try {
      setIsUpdatingOwned(true)
      setError(null)
      await patchFilm({ owned: !film.owned })
    } catch (err) {
      console.error("Error updating owned status:", err)
      setError("Failed to update owned status. Please try again.")
    } finally {
      setIsUpdatingOwned(false)
    }
  }

  const handleSetRating = async (newRating: number | null) => {
    if (!film || isUpdatingRating) return
    if ((film.rating ?? null) === newRating) return
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    try {
      setIsUpdatingRating(true)
      setRatingSaved(false)
      setPendingRating(newRating)
      setError(null)
      await patchFilm({ rating: newRating })
      setRatingSaved(true)
      savedTimerRef.current = setTimeout(() => setRatingSaved(false), 2500)
    } catch (err) {
      console.error("Error updating rating:", err)
      setPendingRating(undefined)
      setError("Failed to update rating. Please try again.")
    } finally {
      setIsUpdatingRating(false)
    }
  }

  const handleSaveReview = async () => {
    if (!film) return
    try {
      setIsSavingReview(true)
      setError(null)
      await patchFilm({ review: reviewText.trim() || null })
      setIsEditingReview(false)
    } catch (err) {
      console.error("Error saving review:", err)
      setError("Failed to save review. Please try again.")
    } finally {
      setIsSavingReview(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!film) return
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    )
    if (!confirmed) return
    try {
      setIsDeletingReview(true)
      setError(null)
      await patchFilm({ review: null })
      setReviewText("")
      setIsEditingReview(false)
    } catch (err) {
      console.error("Error deleting review:", err)
      setError("Failed to delete review. Please try again.")
    } finally {
      setIsDeletingReview(false)
    }
  }

  const handleCancelReview = () => {
    setReviewText(film?.review || "")
    setIsEditingReview(false)
    setError(null)
  }

  if (!isOpen || !film) return null

  // Show the pending value straight away so the click registers visually before
  // the PATCH and the refetch complete
  const displayRating =
    pendingRating !== undefined ? pendingRating : film.rating

  const currentDetails = detailsState?.filmId === film._id ? detailsState : null
  const isLoadingDetails = currentDetails === null
  const detailsError = currentDetails?.status === "error"
  const loadedDetails = currentDetails?.status === "loaded" ? currentDetails.data : null
  const cast = (loadedDetails?.cast ?? []).filter(hasActor)
  const showFullCast = expandedCastFilmId === film._id
  const visibleCast = showFullCast ? cast : cast.slice(0, CAST_PREVIEW_SIZE)
  const productionCompanies = loadedDetails?.productionCompanies ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex gap-4 mb-6">
          <div className="flex-shrink-0">
            {film.posterPath ? (
              <img
                src={getTmdbPosterUrl(film.posterPath, "w185")}
                alt={film.title}
                className="w-24 h-auto object-contain rounded"
              />
            ) : (
              <div className="w-24 h-36 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs text-center p-2">
                No poster
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold">{film.title}</h2>
            {film.originalTitle && film.originalTitle !== film.title && (
              <p className="text-sm text-gray-500 mt-1">
                Original: {film.originalTitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mt-2">
              <span>{film.year}</span>
              {film.duration && (
                <>
                  <span className="text-gray-600">•</span>
                  <span>{formatDuration(film.duration)}</span>
                </>
              )}
            </div>
            {film.directors && film.directors.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-gray-500">Directed by </span>
                {formatDirectorNames(film.directors)}
              </p>
            )}
            {productionCompanies.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                <span className="text-gray-500">Produced by </span>
                {productionCompanies.map((company) => company.name).join(", ")}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Rating */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-gray-400">Rating</label>
            {displayRating ? (
              <RatingBadge rating={displayRating} />
            ) : readOnly ? (
              <span className="text-sm text-gray-500">Not rated</span>
            ) : null}
            <span role="status" aria-live="polite" className="text-sm">
              {isUpdatingRating ? (
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Spinner />
                  {pendingRating === null ? "Clearing rating..." : "Saving rating..."}
                </span>
              ) : ratingSaved ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Saved
                </span>
              ) : null}
            </span>
          </div>
          {!readOnly && (
            <>
              <div
                className="grid grid-cols-5 gap-2 mb-3"
                aria-busy={isUpdatingRating}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = displayRating === num
                  const isPending = isUpdatingRating && pendingRating === num
                  return (
                    <button
                      key={num}
                      onClick={() => handleSetRating(num)}
                      disabled={isUpdatingRating}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-center py-2 h-10 rounded font-medium transition-all disabled:cursor-not-allowed ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      } ${
                        isPending
                          ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900 scale-105"
                          : isUpdatingRating
                            ? "opacity-40"
                            : ""
                      }`}
                    >
                      {isPending ? <Spinner /> : num}
                    </button>
                  )
                })}
              </div>
              {(displayRating || (isUpdatingRating && pendingRating === null)) && (
                <button
                  onClick={() => handleSetRating(null)}
                  disabled={isUpdatingRating}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingRating && pendingRating === null
                    ? "Clearing..."
                    : "Clear rating (set to unwatched)"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Owned */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Owned
          </label>
          {readOnly ? (
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                film.owned
                  ? "bg-blue-900/30 text-blue-400"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {film.owned ? "Owned" : "Not Owned"}
            </span>
          ) : (
            <button
              onClick={handleToggleOwned}
              disabled={isUpdatingOwned}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                film.owned
                  ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                  : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
              }`}
            >
              {isUpdatingOwned ? "..." : film.owned ? "Owned" : "Not Owned"}
            </button>
          )}
        </div>

        {/* Genres */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Genres
          </label>
          {film.genres && film.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {film.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No genres</p>
          )}
        </div>

        {/* Cast */}
        {(isLoadingDetails || detailsError || cast.length > 0) && (
          <div className="mb-6">
            <h3 id={castHeadingId} className="block text-sm font-medium text-gray-400 mb-2">
              Cast
            </h3>
            {isLoadingDetails ? (
              <p role="status" className="flex items-center gap-1.5 text-sm text-gray-500">
                <Spinner />
                Loading cast...
              </p>
            ) : detailsError ? (
              <p className="text-sm text-gray-500">Could not load cast</p>
            ) : (
              <>
                <ul aria-labelledby={castHeadingId} className="space-y-1 text-sm">
                  {visibleCast.map((member) => (
                    <li key={`${member.actor._id}-${member.order}`} className="text-gray-300">
                      {member.actor.displayName}
                      {member.character && (
                        <span className="text-gray-500"> as {member.character}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {cast.length > CAST_PREVIEW_SIZE && (
                  <button
                    type="button"
                    aria-expanded={showFullCast}
                    onClick={() => setExpandedCastFilmId(showFullCast ? null : film._id)}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showFullCast ? "Show less" : `Show full cast (${cast.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Overview */}
        {film.overview && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Overview
            </label>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {film.overview}
            </p>
          </div>
        )}

        {/* Review */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-400">Review</label>
            {!readOnly && !isEditingReview && (
              <div className="flex gap-3">
                {film.review && (
                  <button
                    onClick={handleDeleteReview}
                    disabled={isDeletingReview}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {isDeletingReview ? "Deleting..." : "Delete"}
                  </button>
                )}
                <button
                  onClick={() => setIsEditingReview(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {film.review ? "Edit" : "Add review"}
                </button>
              </div>
            )}
          </div>

          {!readOnly && isEditingReview ? (
            <div className="space-y-3">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[160px] resize-y"
                disabled={isSavingReview}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelReview}
                  disabled={isSavingReview}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReview}
                  disabled={isSavingReview}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingReview ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : film.review ? (
            <div className="bg-gray-800 border border-gray-700 rounded px-4 py-3 whitespace-pre-wrap text-gray-200 text-sm">
              {film.review}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No review yet</p>
          )}
        </div>

        {/* Links */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Links
          </label>
          <div className="flex items-center gap-3 text-sm">
            <a
              href={`https://www.themoviedb.org/movie/${film.tmdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              TMDB
            </a>
            {film.imdbId && (
              <>
                <span className="text-gray-600">|</span>
                <a
                  href={`https://www.imdb.com/title/${film.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  IMDB
                </a>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">
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
