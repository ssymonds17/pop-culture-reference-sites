"use client"

import { useState, useEffect } from "react"
import { useFilmContext } from "@/lib/context/FilmContext"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"

interface FilmFiltersProps {
  onSearch?: () => void
}

export default function FilmFilters({ onSearch }: FilmFiltersProps) {
  const { setSelectedFilters, resetFilters } = useFilmContext()
  const [watched, setWatched] = useState<string>("all")
  const [minRating, setMinRating] = useState<string>("")
  const [maxRating, setMaxRating] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [searchString, setSearchString] = useState<string>("")
  const [review, setReview] = useState<string>("all")
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.genres)
        setAvailableGenres(response.data.data)
      } catch (error) {
        console.error("Error fetching genres:", error)
      }
    }
    fetchGenres()
  }, [])

  const handleSearchSubmit = () => {
    const filters: any = {}

    if (watched === "watched") filters.watched = true
    if (watched === "unwatched") filters.watched = false
    if (minRating) filters.minRating = parseInt(minRating)
    if (maxRating) filters.maxRating = parseInt(maxRating)
    if (year) filters.year = parseInt(year)
    if (selectedGenres.length > 0) filters.genres = selectedGenres
    if (searchString) filters.searchString = searchString
    if (review === "hasReview") filters.hasReview = true
    if (review === "noReview") filters.hasReview = false

    setSelectedFilters(filters)
    onSearch?.()
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit()
    }
  }

  const handleReset = () => {
    setWatched("all")
    setMinRating("")
    setMaxRating("")
    setYear("")
    setSelectedGenres([])
    setSearchString("")
    setReview("all")
    resetFilters()
    onSearch?.()
  }

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSearchSubmit}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded text-sm font-medium transition-colors"
        >
          Search
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search films"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:border-film-500"
            />
            {searchString && (
              <button
                onClick={() => setSearchString("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Status
          </label>
          <select
            value={watched}
            onChange={(e) => setWatched(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          >
            <option value="all">All</option>
            <option value="watched">Watched</option>
            <option value="unwatched">Unwatched</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Min Rating
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="1-10"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Max Rating
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            placeholder="1-10"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2020"
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Review
          </label>
          <select
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-film-500"
          >
            <option value="all">All</option>
            <option value="hasReview">Has Review</option>
            <option value="noReview">No Review</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Genres (click to select multiple - AND logic)
        </label>
        <div className="flex flex-wrap gap-2">
          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => handleGenreToggle(genre)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedGenres.includes(genre)
                  ? "bg-blue-600 text-white border border-blue-600"
                  : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
