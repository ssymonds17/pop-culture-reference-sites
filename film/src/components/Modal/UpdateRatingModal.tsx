'use client'

import { useState, useEffect } from 'react'
import { Film } from '@/types'
import { useAuth } from '@clerk/nextjs'
import { API_ENDPOINTS } from '@/lib/api'
import { createAuthenticatedClient } from '@/lib/auth-api'

interface UpdateRatingModalProps {
  film: Film
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function UpdateRatingModal({ film, isOpen, onClose, onUpdate }: UpdateRatingModalProps) {
  const { getToken } = useAuth()
  const [rating, setRating] = useState<number | null>(film.rating || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setRating(film.rating || null)
      setError(null)
    }
  }, [isOpen, film])

  const handleSubmit = async (newRating: number | null) => {
    try {
      setLoading(true)
      setError(null)

      const client = await createAuthenticatedClient(getToken)
      await client.patch(API_ENDPOINTS.film(film._id), {
        rating: newRating
      })

      onUpdate()
      onClose()
    } catch (err) {
      console.error('Error updating rating:', err)
      setError('Failed to update rating. Please try again.')
      setLoading(false)
    }
  }

  const handleRatingClick = (num: number) => {
    setRating(num)
    handleSubmit(num)
  }

  const handleClearRating = () => {
    setRating(null)
    handleSubmit(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Update Rating</h2>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">{film.title}</h3>
          <p className="text-gray-400 text-sm">{film.year}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Select Rating</label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => handleRatingClick(num)}
                disabled={loading}
                className={`py-3 px-3 rounded font-medium transition-colors disabled:opacity-50 ${
                  rating === num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            onClick={handleClearRating}
            disabled={loading}
            className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Clearing...' : 'Clear rating (set to unwatched)'}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
