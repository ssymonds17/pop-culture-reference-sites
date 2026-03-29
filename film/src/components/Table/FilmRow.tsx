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
  viewMode?: 'mobile' | 'desktop'
  gridCols?: string
}

export default function FilmRow({ film, onUpdate, viewMode = 'desktop', gridCols }: FilmRowProps) {
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

  if (viewMode === 'mobile') {
    return (
      <>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
          {/* Header with poster and title */}
          <div className="flex gap-4 mb-4">
            <div className="flex-shrink-0">
              {film.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${film.posterPath}`}
                  alt={film.title}
                  className="w-20 h-auto object-contain rounded"
                />
              ) : (
                <div className="w-20 h-28 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs text-center p-2">
                  No poster
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-1">{film.title}</h3>
              {film.originalTitle && film.originalTitle !== film.title && (
                <p className="text-sm text-gray-500 mb-2">
                  Original: {film.originalTitle}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                <span>{film.year}</span>
                {film.duration && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span>{formatDuration(film.duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Directors */}
          {film.directors && film.directors.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-gray-500 mr-2">Director(s):</span>
              {film.directors.map((director, index) => {
                const isLast = index === film.directors.length - 1
                const isSecondToLast = index === film.directors.length - 2
                const hasTwoDirectors = film.directors.length === 2
                const hasThreeOrMore = film.directors.length >= 3

                return (
                  <span key={director._id} className="text-sm">
                    <button
                      onClick={(e) => handleDirectorClick(director, e)}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
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
          )}

          {/* Genres */}
          {film.genres && film.genres.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {film.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {film.watched ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                Watched
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
                Unwatched
              </span>
            )}

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
          </div>

          {/* Links */}
          <div className="flex items-center gap-3 text-sm border-t border-gray-800 pt-3">
            <span className="text-gray-500 text-xs">Links:</span>
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

  // Desktop view - wrapper with display: contents makes children direct grid items
  return (
    <>
      <div style={{ display: 'contents' }}>
        {/* Background styling element that spans all columns */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors" style={{ gridColumn: '1 / -1' }} />

        {/* Poster */}
        <div className="p-4 relative z-10 flex items-center">
          {film.posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${film.posterPath}`}
              alt={film.title}
              className="w-16 h-auto object-contain rounded"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs text-center p-1">
              No poster
            </div>
          )}
        </div>

        {/* Title & Year */}
        <div className="p-4 relative z-10 flex items-center">
          <div>
            <h3 className="font-bold text-sm">{film.title}</h3>
            {film.originalTitle && film.originalTitle !== film.title && (
              <p className="text-xs text-gray-500">
                {film.originalTitle}
              </p>
            )}
            <p className="text-xs text-gray-400">{film.year}</p>
          </div>
        </div>

        {/* Directors */}
        <div className="p-4 relative z-10 flex items-center">
          {film.directors && film.directors.length > 0 ? (
            <div className="text-sm">
              {film.directors.map((director, index) => {
                const isLast = index === film.directors.length - 1
                const isSecondToLast = index === film.directors.length - 2
                const hasTwoDirectors = film.directors.length === 2
                const hasThreeOrMore = film.directors.length >= 3

                return (
                  <span key={director._id}>
                    <span
                      onClick={(e) => handleDirectorClick(director, e)}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                    >
                      {director.displayName}
                    </span>
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
            <span className="text-sm text-gray-500">Unknown</span>
          )}
        </div>

        {/* Duration */}
        <div className="p-4 relative z-10 text-sm text-gray-400 flex items-center">
          {film.duration ? formatDuration(film.duration) : "—"}
        </div>

        {/* Genres */}
        <div className="p-4 relative z-10">
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
              <span className="text-sm text-gray-500">—</span>
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
        </div>

        {/* Status badges */}
        <div className="p-4 relative z-10 flex flex-wrap gap-2 items-center">
          {film.watched ? (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 min-w-[80px]">
              Watched
            </span>
          ) : (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 min-w-[80px]">
              Unwatched
            </span>
          )}

          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {film.rating ? (
              <RatingBadge rating={film.rating} />
            ) : (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400 min-w-[70px]">
                Add Rating
              </span>
            )}
          </button>

          <button
            onClick={handleToggleOwned}
            disabled={isUpdatingOwned}
            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[85px] ${
              film.owned
                ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
            }`}
          >
            {isUpdatingOwned ? "..." : film.owned ? "Owned" : "Not Owned"}
          </button>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer min-w-[80px] ${
              film.review
                ? "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50"
                : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
            }`}
          >
            {film.review ? "Has Review" : "No Review"}
          </button>
        </div>

        {/* Links */}
        <div className="p-4 relative z-10 flex items-center gap-2 text-sm">
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
