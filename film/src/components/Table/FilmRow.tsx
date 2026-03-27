import { useState } from "react"
import { Film, Director } from "@/types"
import { formatDuration } from "@/lib/utils"
import RatingBadge from "../Rating/RatingBadge"
import UpdateRatingModal from "../Modal/UpdateRatingModal"
import DirectorFilmsModal from "../Modal/DirectorFilmsModal"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"

interface FilmRowProps {
  film: Film
  onUpdate?: () => void
}

export default function FilmRow({ film, onUpdate }: FilmRowProps) {
  const [isUpdatingOwned, setIsUpdatingOwned] = useState(false)
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null)
  const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false)

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
      await axios.patch(API_ENDPOINTS.film(film._id), {
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
        <td className="px-6 py-4">
          <div className="font-medium">{film.title}</div>
          {film.originalTitle && film.originalTitle !== film.title && (
            <div className="text-xs text-gray-500 mt-1">
              Original: {film.originalTitle}
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-gray-300">{film.year}</td>
        <td className="px-6 py-4 text-gray-300">
          {film.directors && film.directors.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {film.directors.map((director, index) => {
                const isLast = index === film.directors.length - 1
                const isSecondToLast = index === film.directors.length - 2
                const hasTwoDirectors = film.directors.length === 2
                const hasThreeOrMore = film.directors.length >= 3

                return (
                  <span key={director._id}>
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
          ) : (
            "Unknown"
          )}
        </td>
        <td className="px-6 py-4 text-gray-300">
          {film.duration ? formatDuration(film.duration) : "—"}
        </td>
        <td className="px-6 py-4">
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
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{film.genres.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-center">
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
        <td className="px-6 py-4 text-center">
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {film.rating ? (
              <RatingBadge rating={film.rating} />
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400">
                Add Rating
              </span>
            )}
          </button>
        </td>
        <td className="px-6 py-4 text-center">
          <button
            onClick={handleToggleOwned}
            disabled={isUpdatingOwned}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              film.owned
                ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                : "bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400"
            }`}
          >
            {isUpdatingOwned ? "..." : film.owned ? "Owned" : "Not Owned"}
          </button>
        </td>
        <td className="px-6 py-4">
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
    </>
  )
}
