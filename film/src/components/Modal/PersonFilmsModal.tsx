"use client"

import { useState, useEffect, useId, useRef } from "react"
import { Person, PersonFilm, TmdbPersonFilm } from "@/types"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import { API_ENDPOINTS } from "@/lib/api"
import { createAuthenticatedClient } from "@/lib/auth-api"
import { PERSON_KINDS, PersonKind } from "@/lib/personKinds"
import { getTmdbPosterUrl } from "@/lib/utils"
import ImdbRatingBox from "../Rating/ImdbRatingBox"
import RatingBadge from "../Rating/RatingBadge"

interface PersonFilmsModalProps {
  person: Person | null
  kind: PersonKind
  isOpen: boolean
  onClose: () => void
  /** Called on closing after films were added, so the page behind can refresh */
  onFilmsAdded?: () => void
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => Array.from(word)[0])
    .filter((_, index, letters) => index === 0 || index === letters.length - 1)
    .join("")
    .toUpperCase()

// `details` replaces the person passed in, whose stats go stale once a film is added
type FilmsState =
  | { key: string; status: "loaded"; details: Person; films: PersonFilm[] }
  | { key: string; status: "error" }

type OtherFilms = { films: TmdbPersonFilm[]; hiddenCount: number }

type OtherFilmsEntry =
  | { status: "loading" }
  | ({ status: "loaded" } & OtherFilms)
  | { status: "error" }

type AddStatus = "adding" | "error"

const OTHER_FILMS_TIMEOUT_MS = 35000

// Keep in step with the filters in film-api/lambda/get-tmdb-person-films.ts
const HIDDEN_FILMS_REASON =
  "unreleased, no IMDb data, fewer than 1,000 IMDb votes or couldn't be checked"

const HEADER_CELL_CLASS =
  "px-4 py-3 text-xs font-medium text-gray-400 uppercase"

const SECTION_HEADING_CLASS =
  "text-lg font-semibold mb-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-film-500"

export default function PersonFilmsModal({
  person,
  kind,
  isOpen,
  onClose,
  onFilmsAdded,
}: PersonFilmsModalProps) {
  const { getToken } = useAuth()
  // Keyed by person and kind so switching never shows the previous person's films while loading
  const [filmsState, setFilmsState] = useState<FilmsState | null>(null)
  // Bumped after adding a film so "Your films" refetches and includes it
  const [filmsVersion, setFilmsVersion] = useState(0)
  // Remembered by path so a stale TMDb photo falls back to initials, and a different photo still loads
  const [failedPhotoPath, setFailedPhotoPath] = useState<string | null>(null)
  // Cached per person and kind, so each filmography is requested once while the modal is mounted
  const [otherFilmsByKey, setOtherFilmsByKey] = useState<
    Record<string, OtherFilmsEntry>
  >({})
  // Films added from this modal; any filmography listing one shows it as in the collection
  const [addedTmdbIds, setAddedTmdbIds] = useState<Set<string>>(new Set())
  // Set by an add while the modal is open, and cleared when it closes and tells the page behind
  const hasUnreportedAddRef = useRef(false)
  // Lets an add that finishes after the modal closed report straight away
  const isOpenRef = useRef(isOpen)
  const loadOtherFilmsButtonRef = useRef<HTMLButtonElement>(null)
  const otherFilmsHeadingRef = useRef<HTMLHeadingElement>(null)
  // The person and kind whose films arrived while the load button had focus, so focus can follow
  // to the list that replaces the button
  const focusOtherFilmsKeyRef = useRef<string | null>(null)
  const [addStatusByTmdbId, setAddStatusByTmdbId] = useState<
    Record<string, AddStatus | undefined>
  >({})
  const yourFilmsHeadingId = useId()
  const otherFilmsHeadingId = useId()
  const tmdbPersonId = person?.tmdbPersonId
  const requestKey = tmdbPersonId ? `${kind}:${tmdbPersonId}` : null

  useEffect(() => {
    if (!isOpen || !tmdbPersonId || !requestKey) return

    let cancelled = false
    setFilmsState((previous) =>
      previous?.status === "error" ? null : previous,
    )

    const fetchPersonFilms = async () => {
      try {
        const response = await axios.get<{
          data: Person & { films?: PersonFilm[] }
        }>(PERSON_KINDS[kind].detailEndpoint(tmdbPersonId))
        if (!cancelled) {
          const { films: personFilms, ...details } = response.data.data
          setFilmsState({
            key: requestKey,
            status: "loaded",
            details,
            films: personFilms || [],
          })
        }
      } catch (err) {
        if (cancelled) return
        console.error(
          `Error fetching ${PERSON_KINDS[kind].singular} films:`,
          err,
        )
        setFilmsState({ key: requestKey, status: "error" })
      }
    }

    fetchPersonFilms()

    return () => {
      cancelled = true
    }
  }, [isOpen, kind, tmdbPersonId, requestKey, filmsVersion])

  // Runs however the modal closes
  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) return
    if (hasUnreportedAddRef.current) {
      hasUnreportedAddRef.current = false
      onFilmsAdded?.()
    }
  }, [isOpen])

  useEffect(() => {
    const key = focusOtherFilmsKeyRef.current
    if (key === null) return
    focusOtherFilmsKeyRef.current = null
    if (key === requestKey) otherFilmsHeadingRef.current?.focus()
  })

  const loadOtherFilms = async (key: string, personId: string) => {
    setOtherFilmsByKey((previous) => ({
      ...previous,
      [key]: { status: "loading" },
    }))
    try {
      const client = await createAuthenticatedClient(getToken)
      const response = await client.get<{ data: OtherFilms }>(
        API_ENDPOINTS.tmdbPersonFilms(personId),
        // Above the API's own time budget of about 25 seconds, so only a stalled request is cut off
        { params: { kind }, timeout: OTHER_FILMS_TIMEOUT_MS },
      )
      const { films, hiddenCount } = response.data.data
      // Checked when the response arrives, not at the click, so a user who has moved on keeps their focus
      if (document.activeElement === loadOtherFilmsButtonRef.current) {
        focusOtherFilmsKeyRef.current = key
      }
      setOtherFilmsByKey((previous) => ({
        ...previous,
        [key]: { status: "loaded", films, hiddenCount },
      }))
    } catch (err) {
      console.error(
        `Error fetching ${PERSON_KINDS[kind].singular} films from TMDb:`,
        err,
      )
      setOtherFilmsByKey((previous) => ({
        ...previous,
        [key]: { status: "error" },
      }))
    }
  }

  const handleLoadOtherFilms = () => {
    if (!requestKey || !tmdbPersonId) return
    if (otherFilmsByKey[requestKey]?.status === "loading") return
    loadOtherFilms(requestKey, tmdbPersonId)
  }

  const setAddStatus = (tmdbId: string, status: AddStatus | undefined) => {
    setAddStatusByTmdbId((previous) => ({ ...previous, [tmdbId]: status }))
  }

  const handleAddFilm = async (tmdbId: string) => {
    if (addStatusByTmdbId[tmdbId] === "adding") return
    try {
      setAddStatus(tmdbId, "adding")
      const client = await createAuthenticatedClient(getToken)
      await client.post(API_ENDPOINTS.createFilm, { tmdbId })
      if (isOpenRef.current) {
        hasUnreportedAddRef.current = true
      } else {
        onFilmsAdded?.()
      }
    } catch (err: any) {
      // A 409 means the film is already in the collection, so it is treated like a successful add
      if (err.response?.status !== 409) {
        console.error("Error adding film:", err)
        setAddStatus(tmdbId, "error")
        return
      }
    }
    setAddedTmdbIds((previous) => new Set(previous).add(tmdbId))
    setAddStatus(tmdbId, undefined)
    setFilmsVersion((version) => version + 1)
  }

  if (!isOpen || !person) return null

  const currentFilms = filmsState?.key === requestKey ? filmsState : null
  const loading = currentFilms === null
  const error = currentFilms?.status === "error" ? "Failed to load films" : null
  const films = currentFilms?.status === "loaded" ? currentFilms.films : []
  const details =
    currentFilms?.status === "loaded" ? currentFilms.details : person
  const photoPath =
    person.profilePath !== failedPhotoPath ? person.profilePath : undefined
  const otherFilms = requestKey ? otherFilmsByKey[requestKey] : undefined
  const showRole = kind === "actor"

  const renderYourFilms = () => {
    if (error) {
      return (
        <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )
    }
    if (loading) {
      return (
        <div className="text-center py-12 text-gray-400">Loading films...</div>
      )
    }
    if (films.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">No films found</div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className={`${HEADER_CELL_CLASS} text-left`}>Title</th>
              <th className={`${HEADER_CELL_CLASS} text-center`}>Year</th>
              {showRole && (
                <th className={`${HEADER_CELL_CLASS} text-center`}>Role</th>
              )}
              <th className={`${HEADER_CELL_CLASS} text-center`}>
                Your rating
              </th>
              <th className={`${HEADER_CELL_CLASS} text-center`}>Owned</th>
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
                {showRole && (
                  <td className="px-4 py-3 text-center text-sm">
                    {film.lead ? (
                      <span className="text-blue-400">Lead</span>
                    ) : (
                      <span className="text-gray-400">Support</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  {film.rating ? (
                    <RatingBadge rating={film.rating} />
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
    )
  }

  const renderAddCell = (film: TmdbPersonFilm) => {
    if (addedTmdbIds.has(film.tmdbId)) {
      return <span className="text-sm text-gray-400">In collection</span>
    }
    const status = addStatusByTmdbId[film.tmdbId]
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleAddFilm(film.tmdbId)}
          disabled={status === "adding"}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "adding" ? "Adding..." : "Add"}
          <span className="sr-only">{` ${film.title} (${film.year})`}</span>
        </button>
        {status === "error" && (
          <span role="alert" className="text-xs text-red-400">
            Could not add
          </span>
        )}
      </div>
    )
  }

  const renderLoadOtherFilms = () => {
    const isLoadingOtherFilms = otherFilms?.status === "loading"
    let label = "Load other films and IMDb ratings"
    if (isLoadingOtherFilms) {
      label = "Loading other films..."
    } else if (otherFilms?.status === "error") {
      label = "Try again"
    }
    return (
      <div className="flex flex-col items-start gap-2">
        {otherFilms?.status === "error" && (
          <p role="alert" className="text-sm text-red-400">
            Couldn&apos;t load other films
          </p>
        )}
        {/* One button through every state, and aria-disabled rather than disabled, so it keeps focus */}
        <button
          ref={loadOtherFilmsButtonRef}
          type="button"
          onClick={handleLoadOtherFilms}
          aria-disabled={isLoadingOtherFilms}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
        >
          {label}
        </button>
      </div>
    )
  }

  const renderOtherFilms = ({ films: otherFilmList, hiddenCount }: OtherFilms) => (
    <>
      {otherFilmList.length === 0 && (
        <p className="mb-3 text-sm text-gray-400">No other films to show</p>
      )}
      {hiddenCount > 0 && (
        <p className="mb-3 text-sm text-gray-400">
          {hiddenCount} {hiddenCount === 1 ? "film" : "films"} hidden:{" "}
          {HIDDEN_FILMS_REASON}
        </p>
      )}
      {otherFilmList.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className={`${HEADER_CELL_CLASS} text-left`}>Title</th>
                <th className={`${HEADER_CELL_CLASS} text-center`}>Year</th>
                <th className={`${HEADER_CELL_CLASS} text-center`}>IMDb</th>
                <th className={`${HEADER_CELL_CLASS} text-center`}>
                  <span className="sr-only">Collection</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {otherFilmList.map((film) => (
                <tr
                  key={film.tmdbId}
                  className="hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.themoviedb.org/movie/${film.tmdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-blue-300 transition-colors"
                    >
                      {film.title}
                    </a>
                    {film.character && (
                      <div className="text-xs text-gray-400">
                        as {film.character}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-300">
                    {film.year}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ImdbRatingBox
                      imdbId={film.imdbId}
                      rating={film.imdbRating}
                      votes={film.imdbVotes}
                      filmName={`${film.title} (${film.year})`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {renderAddCell(film)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )

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
              {details.totalFilms} films · {details.seenFilms} seen
              {details.averageRating &&
                ` · ${details.averageRating.toFixed(2)} avg rating`}
            </p>
            <div className="flex items-center gap-3 text-sm mt-2">
              <a
                href={`https://www.themoviedb.org/person/${person.tmdbPersonId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                TMDB
              </a>
              {details.imdbPersonId && (
                <>
                  <span className="text-gray-600">|</span>
                  <a
                    href={`https://www.imdb.com/name/${details.imdbPersonId}`}
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
        </div>

        <section aria-labelledby={yourFilmsHeadingId}>
          <h3 id={yourFilmsHeadingId} className={SECTION_HEADING_CLASS}>
            Your films
          </h3>
          {renderYourFilms()}
        </section>

        <section aria-labelledby={otherFilmsHeadingId} className="mt-6">
          <h3
            ref={otherFilmsHeadingRef}
            id={otherFilmsHeadingId}
            tabIndex={-1}
            className={SECTION_HEADING_CLASS}
          >
            Other films
          </h3>
          {/* A focused button's new label isn't reliably read out, so the loading state is announced here */}
          <p role="status" className="sr-only">
            {otherFilms?.status === "loading" ? "Loading other films" : ""}
          </p>
          {otherFilms?.status === "loaded"
            ? renderOtherFilms(otherFilms)
            : renderLoadOtherFilms()}
        </section>

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
