"use client"

import { useState, useEffect } from "react"
import { Film } from "@/types"
import { useAuth } from "@clerk/nextjs"
import { API_ENDPOINTS } from "@/lib/api"
import { createAuthenticatedClient } from "@/lib/auth-api"

interface ReviewModalProps {
  film: Film | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function ReviewModal({
  film,
  isOpen,
  onClose,
  onUpdate,
}: ReviewModalProps) {
  const { getToken } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && film) {
      // If no review exists, start in edit mode immediately
      if (!film.review) {
        setIsEditing(true)
        setReviewText("")
      } else {
        setIsEditing(false)
        setReviewText(film.review)
      }
      setError(null)
    }
  }, [isOpen, film])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setReviewText(film?.review || "")
    setError(null)
  }

  const handleSave = async () => {
    if (!film) return

    try {
      setIsSaving(true)
      setError(null)

      const client = await createAuthenticatedClient(getToken)
      await client.patch(API_ENDPOINTS.film(film._id), {
        review: reviewText.trim() || null,
      })

      onUpdate()
      onClose()
    } catch (err) {
      console.error("Error saving review:", err)
      setError("Failed to save review. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!film) return

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      setError(null)

      const client = await createAuthenticatedClient(getToken)
      await client.patch(API_ENDPOINTS.film(film._id), {
        review: null,
      })

      onUpdate()
      onClose()
    } catch (err) {
      console.error("Error deleting review:", err)
      setError("Failed to delete review. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !film) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2">{film.title}</h2>
        <p className="text-gray-400 text-sm mb-6">Review</p>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review here..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-y"
              disabled={isSaving}
            />

            <div className="flex justify-end gap-3">
              {film.review && (
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded px-4 py-3 min-h-[200px] whitespace-pre-wrap text-gray-200">
              {film.review}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Review"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
