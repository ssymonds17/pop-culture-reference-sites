import { useState } from "react"
import { Film, Director } from "@/types"
import { formatDuration } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"
import RatingBadge from "../Rating/RatingBadge"
import UpdateRatingModal from "../Modal/UpdateRatingModal"
import DirectorFilmsModal from "../Modal/DirectorFilmsModal"
import ReviewModal from "../Modal/ReviewModal"
import { API_ENDPOINTS } from "@/lib/api"
import { createAuthenticatedClient } from "@/lib/auth-api"

interface FilmRowProps {
  film: Film
  onUpdate?: () => void
}

export default function FilmRow({ film, onUpdate }: FilmRowProps) {
  const { getToken } = useAuth()
  const [isUpdatingOwned, setIsUpdatingOwned] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const handleDirectorClick = (director: Director, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDirector(director)
    setIsDirectorModalOpen(true)
  }

  const handleCloseDirectorModal = () => {
    setIsDirectorModalOpen(false)
    setSelectedDirector(null)
  }

  const handleToggleOwned = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isUpdatingOwned) return

    try {
      setIsUpdatingOwned(true)
      const client = await createAuthenticatedClient(getToken)
      await client.patch(API_ENDPOINTS.film(film._id), {
        owned: !film.owned,
      })
      onUpdate?.()
    } catch (err) {
      console.error("Error updating owned status:", err)
    } finally {
      setIsUpdatingOwned(false)
    }
  }
  return (
    <>
      <tr className="hover:bg-gray-800/50 transition-colors">
        <td className="p-2">
          <div className="flex justify-center">
            {film.posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${film.posterPath}`}
                alt={film.title}
                className="max-h-32 object-contain rounded"
              />
            ) : (
              <div className="w-20 h-32 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                No poster
              </div>
            )}
          </div>
        </td>
        <td className="px-3 py-3">
          <div className="font-medium text-sm">{film.title}</div>
          {film.originalTitle && film.originalTitle !== film.title && (
            <div className="text-xs text-gray-500 mt-1">
              Original: {film.originalTitle}
            </div>
          )}
        </td>
        <td className="px-3 py-3 text-gray-300 text-sm">{film.year}</td>
        <td className="px-3 py-3 text-gray-300 text-sm text-left">
          {film.directors && film.directors.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-start">
              {film.directors.map((director, index) => {
                const isLast = index === film.directors.length - 1
                const isSecondToLast = index === film.directors.length - 2
                const hasTwoDirectors = film.directors.length === 2
                const hasThreeOrMore = film.directors.length >= 3

                return (
                  <span key={director._id}>
                    <button
                      onClick={(e) => handleDirectorClick(director, e)}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors text-left"
                    >
                      {director.displayName}
                    </button>
                    {!isLast && (
                      <span className="text-gray-500">
                        {hasTwoDirectors ? ' & ' :
                         hasThreeOrMore && isSecondToLast ? ' & ' : ', '}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          ) : (
            "Unknown"
          )}
        </td>
        <td className="px-3 py-3 text-gray-300 text-sm">
          {film.duration ? formatDuration(film.duration) : "—"}
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1">
            {film.genres && film.genres.length > 0 ? (
              film.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                >
                  {genre}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No genres</span>
            )}
            {film.genres && film.genres.length > 3 && (
              <span className="relative group px-2 py-1 text-gray-500 text-xs cursor-help">
                +{film.genres.length - 3}
                <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded shadow-lg whitespace-nowrap z-10">
                  <span className="flex flex-wrap gap-1 max-w-xs">
                    {film.genres.slice(3).map((genre) => (
                      <span
                        key={genre}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                  </span>
                  <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-700"></span>
                </span>
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-center">
          {film.watched ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
              Watched
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
              Unwatched
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-center">
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {film.rating ? (
              <RatingBadge rating={film.rating} />
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400">
                Add Rating
              </span>
            )}
          </button>
        </td>
        <td className="px-3 py-3 text-center">
          <button
            onClick={handleToggleOwned}
            disabled={isUpdatingOwned}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              film.owned
                ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
            }`}
          >
            {isUpdatingOwned ? "..." : film.owned ? "Owned" : "Not Owned"}
          </button>
        </td>
        <td className="px-3 py-3 text-center">
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              film.review
                ? "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50"
                : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
            }`}
          >
            {film.review ? "Has Review" : "No Review"}
          </button>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center justify-center gap-2">
            <a
              href={`https://www.themoviedb.org/movie/${film.tmdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs font-medium"
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
                  className="text-yellow-400 hover:text-yellow-300 text-xs font-medium"
                >
                  IMDB
                </a>
              </>
            )}
          </div>
        </td>
      </tr>

      <UpdateRatingModal
        film={film}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onUpdate={() => onUpdate?.()}
      />

      <DirectorFilmsModal
        director={selectedDirector}
        isOpen={isDirectorModalOpen}
        onClose={handleCloseDirectorModal}
      />

      <ReviewModal
        film={film}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onUpdate={() => onUpdate?.()}
      />
    </>
  )
}
