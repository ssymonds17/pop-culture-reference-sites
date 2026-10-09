"use client"

import { useState, useEffect } from "react"
import { Film, Person } from "@/types"
import axios from "axios"
import { PERSON_KINDS, PersonKind } from "@/lib/personKinds"
import { getTmdbPosterUrl } from "@/lib/utils"

interface PersonFilmsModalProps {
  person: Person | null
  kind: PersonKind
  isOpen: boolean
  onClose: () => void
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => Array.from(word)[0])
    .filter((_, index, letters) => index === 0 || index === letters.length - 1)
    .join("")
    .toUpperCase()

type FilmsState =
  | { key: string; status: "loaded"; films: Film[] }
  | { key: string; status: "error" }

export default function PersonFilmsModal({
  person,
  kind,
  isOpen,
  onClose,
}: PersonFilmsModalProps) {
  // Keyed by person and kind so switching never shows the previous person's films while loading
  const [filmsState, setFilmsState] = useState<FilmsState | null>(null)
  // Remembered by path so a stale TMDb photo falls back to initials, and a different photo still loads
  const [failedPhotoPath, setFailedPhotoPath] = useState<string | null>(null)
  const tmdbPersonId = person?.tmdbPersonId
  const requestKey = tmdbPersonId ? `${kind}:${tmdbPersonId}` : null

  useEffect(() => {
    if (!isOpen || !tmdbPersonId || !requestKey) return

    let cancelled = false
    setFilmsState((previous) => (previous?.status === "error" ? null : previous))

    const fetchPersonFilms = async () => {
      try {
        const response = await axios.get<{ data: { films?: Film[] } }>(
          PERSON_KINDS[kind].detailEndpoint(tmdbPersonId),
        )
        if (!cancelled) {
          setFilmsState({
            key: requestKey,
            status: "loaded",
            films: response.data.data.films || [],
          })
        }
      } catch (err) {
        if (cancelled) return
        console.error(`Error fetching ${PERSON_KINDS[kind].singular} films:`, err)
        setFilmsState({ key: requestKey, status: "error" })
      }
    }

    fetchPersonFilms()

    return () => {
      cancelled = true
    }
  }, [isOpen, kind, tmdbPersonId, requestKey])

  if (!isOpen || !person) return null

  const currentFilms = filmsState?.key === requestKey ? filmsState : null
  const loading = currentFilms === null
  const error = currentFilms?.status === "error" ? "Failed to load films" : null
  const films = currentFilms?.status === "loaded" ? currentFilms.films : []
  const photoPath = person.profilePath !== failedPhotoPath ? person.profilePath : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          {photoPath ? (
            <img
              src={getTmdbPosterUrl(photoPath, "w185")}
              alt=""
              onError={() => setFailedPhotoPath(photoPath)}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-xl font-semibold text-gray-400 flex-shrink-0"
            >
              {initialsOf(person.displayName)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold mb-2">{person.displayName}</h2>
            <p className="text-gray-400 text-sm">
              {person.totalFilms} films · {person.seenFilms} seen
              {person.averageRating &&
                ` · ${person.averageRating.toFixed(2)} avg rating`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading films...
          </div>
        ) : films.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No films found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                    Year
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                    Owned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {films.map((film) => (
                  <tr
                    key={film._id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{film.title}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">
                      {film.year}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {film.rating ? (
                        <span className="font-semibold text-film-400">
                          {film.rating}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {film.owned ? (
                        <span className="text-blue-400 text-sm">✓</span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-6">
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
