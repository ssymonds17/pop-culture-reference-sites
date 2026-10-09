'use client'

import { useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '@/lib/api'
import { PERSON_KINDS, PersonKind } from '@/lib/personKinds'
import { Person, PersonSortOption } from '@/types'
import PeopleFilters from '@/components/Filters/PeopleFilters'
import PeopleTable from '@/components/Table/PeopleTable'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const DEFAULT_SORT: PersonSortOption = 'totalPoints'

const sortPeople = (people: Person[], sort: PersonSortOption): Person[] => {
  const sorted = [...people]
  if (sort === 'totalPoints') {
    sorted.sort((a, b) => b.totalPoints - a.totalPoints)
  } else if (sort === 'seenFilms') {
    sorted.sort((a, b) => b.seenFilms - a.seenFilms)
  } else if (sort === 'totalFilms') {
    sorted.sort((a, b) => b.totalFilms - a.totalFilms)
  } else if (sort === 'averageRating') {
    sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
  }
  return sorted
}

interface PeopleRankingsProps {
  kind: PersonKind
}

export default function PeopleRankings({ kind }: PeopleRankingsProps) {
  const { singular, plural, title, listEndpoint } = PERSON_KINDS[kind]
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<PersonSortOption>(DEFAULT_SORT)

  const fetchPeople = async (searchString: string, sort: PersonSortOption) => {
    try {
      setLoading(true)

      // The search endpoint does not sort by stats, so search results are sorted here
      if (searchString) {
        const params = new URLSearchParams()
        params.append('searchString', searchString)
        params.append('itemType', kind)

        const response = await axios.get(`${API_ENDPOINTS.search}?${params.toString()}`)
        setPeople(sortPeople(response.data.data, sort))
      } else {
        const response = await axios.get(`${listEndpoint}?sortBy=${sort}`)
        setPeople(response.data.data)
      }
      setError(null)
    } catch (err) {
      console.error(`Error fetching ${plural}:`, err)
      setError(`Failed to load ${plural}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (searchString: string, sort: PersonSortOption) => {
    setSortBy(sort)
    fetchPeople(searchString, sort)
  }

  const handleReset = () => {
    setSortBy(DEFAULT_SORT)
    setPeople([])
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-gray-400">Explore {singular} rankings and statistics</p>
      </div>

      <PeopleFilters kind={kind} sortBy={sortBy} onSearch={handleSearch} onReset={handleReset} />

      {error && (
        <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(20)].map((_, i) => (
            <Skeleton key={i} height={60} baseColor="#1f2937" highlightColor="#374151" />
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            No {plural} to show. Search or sort above, or load them all.
          </p>
          <button
            onClick={() => fetchPeople('', sortBy)}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Load All {title}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-gray-400">
            Showing {people.length} {people.length === 1 ? singular : plural}
          </div>
          <PeopleTable people={people} kind={kind} />
        </div>
      )}
    </div>
  )
}
