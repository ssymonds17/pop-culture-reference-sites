"use client"

import { useState } from "react"
import { Film, Director } from "@/types"
import { formatDuration, getTmdbPosterUrl } from "@/lib/utils"
import RatingBadge from "../Rating/RatingBadge"
import FilmDetailModal from "../Modal/FilmDetailModal"
import DirectorFilmsModal from "../Modal/DirectorFilmsModal"

interface FilmCardProps {
  film: Film
  onUpdate?: () => void
}

export default function FilmCard({ film, onUpdate }: FilmCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
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

  return (
    <>
      <div className="flex flex-col">
        {/* Poster (opens detail modal) */}
        <button
          onClick={() => setIsDetailOpen(true)}
          className="relative block w-full overflow-hidden rounded-lg border border-gray-800 hover:border-film-700 transition-colors focus:outline-none focus:ring-2 focus:ring-film-500"
          aria-label={`View details for ${film.title}`}
        >
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
          {film.rating && (
            <div className="absolute top-2 right-2">
              <RatingBadge rating={film.rating} />
            </div>
          )}
        </button>

        {/* Details below poster */}
        <div className="mt-2 space-y-0.5">
          <h3 className="font-semibold text-sm leading-tight">{film.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
            <span>{film.year}</span>
            {film.duration && (
              <>
                <span className="text-gray-600">•</span>
                <span>{formatDuration(film.duration)}</span>
              </>
            )}
          </div>
          {film.directors && film.directors.length > 0 && (
            <div className="text-xs">
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
                        {hasTwoDirectors
                          ? " & "
                          : hasThreeOrMore && isSecondToLast
                            ? " & "
                            : ", "}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <FilmDetailModal
        film={film}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
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
