"use client"

import { useState, useEffect } from "react"
import { Film } from "@/types"
import { useAuth } from "@clerk/nextjs"
import { API_ENDPOINTS } from "@/lib/api"
import { createAuthenticatedClient } from "@/lib/auth-api"
import { formatDirectorNames, formatDuration, getTmdbPosterUrl } from "@/lib/utils"
import RatingBadge from "../Rating/RatingBadge"

interface FilmDetailModalProps {
  film: Film | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function FilmDetailModal({
  film,
  isOpen,
  onClose,
  onUpdate,
}: FilmDetailModalProps) {
  const { getToken } = useAuth()
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [isDeletingReview, setIsDeletingReview] = useState(false)
  const [isUpdatingOwned, setIsUpdatingOwned] = useState(false)
  const [isUpdatingRating, setIsUpdatingRating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && film) {
      setIsEditingReview(false)
      setReviewText(film.review || "")
      setError(null)
    }
  }, [isOpen, film])

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
    try {
      setIsUpdatingRating(true)
      setError(null)
      await patchFilm({ rating: newRating })
    } catch (err) {
      console.error("Error updating rating:", err)
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
            {film.rating ? <RatingBadge rating={film.rating} /> : null}
          </div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => handleSetRating(num)}
                disabled={isUpdatingRating}
                className={`py-2 rounded font-medium transition-colors disabled:opacity-50 ${
                  film.rating === num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          {film.rating && (
            <button
              onClick={() => handleSetRating(null)}
              disabled={isUpdatingRating}
              className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              {isUpdatingRating ? "Clearing..." : "Clear rating (set to unwatched)"}
            </button>
          )}
        </div>

        {/* Owned */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Owned
          </label>
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
            {!isEditingReview && (
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

          {isEditingReview ? (
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
