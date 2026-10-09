import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import PeopleRankings from './PeopleRankings'
import { API_ENDPOINTS } from '@/lib/api'
import { Person } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))

const mockAxiosGet = axios.get as jest.Mock

const person = (id: number, stats: Partial<Person> = {}): Person => ({
  _id: `person${id}`,
  tmdbPersonId: `${id}`,
  name: `person ${id}`,
  displayName: `Person ${id}`,
  totalFilms: 0,
  seenFilms: 0,
  totalScore: 0,
  ratingCounts: {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 0,
    rating8: 0,
    rating9: 0,
    rating10: 0,
  },
  totalPoints: 0,
  ...stats,
})

const respondWith = (people: Person[]) => mockAxiosGet.mockResolvedValueOnce({ data: { data: people } })

const displayedNames = () =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)

describe('PeopleRankings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.each([
    ['director', 'Directors', API_ENDPOINTS.directors],
    ['actor', 'Actors', API_ENDPOINTS.actors],
  ] as const)('for %s', (kind, title, listEndpoint) => {
    it('should show the title and the search box for the kind', () => {
      render(<PeopleRankings kind={kind} />)

      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(`Search ${title.toLowerCase()}`)).toBeInTheDocument()
    })

    it('should load the list sorted by total points, keeping the server order', async () => {
      const user = userEvent.setup()
      respondWith([person(1, { totalPoints: 1 }), person(2, { totalPoints: 9 })])
      render(<PeopleRankings kind={kind} />)

      await user.click(screen.getByRole('button', { name: `Load All ${title}` }))

      expect(mockAxiosGet).toHaveBeenCalledWith(`${listEndpoint}?sortBy=totalPoints`)
      expect(await screen.findByText(`Showing 2 ${title.toLowerCase()}`)).toBeInTheDocument()
      expect(displayedNames()).toEqual(['Person 1', 'Person 2'])
    })

    it('should search by name for the kind', async () => {
      const user = userEvent.setup()
      respondWith([person(1)])
      render(<PeopleRankings kind={kind} />)

      await user.type(screen.getByRole('textbox'), 'weaver{Enter}')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        `${API_ENDPOINTS.search}?searchString=weaver&itemType=${kind}`
      )
      expect(await screen.findByText(`Showing 1 ${kind}`)).toBeInTheDocument()
    })
  })

  it('should request the list with the chosen sort', async () => {
    const user = userEvent.setup()
    respondWith([person(1)])
    render(<PeopleRankings kind="actor" />)

    await user.click(screen.getByRole('button', { name: 'Films Seen' }))

    expect(mockAxiosGet).toHaveBeenCalledWith(`${API_ENDPOINTS.actors}?sortBy=seenFilms`)
  })

  it.each([
    ['Total Points', { totalPoints: 1 }, { totalPoints: 9 }],
    ['Films Seen', { seenFilms: 1 }, { seenFilms: 9 }],
    ['Total Films', { totalFilms: 1 }, { totalFilms: 9 }],
    ['Average Rating', { averageRating: 6 }, { averageRating: 8 }],
  ])('should sort search results by %s, highest first', async (sortLabel, low, high) => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValue({ data: { data: [person(1, low), person(2, high)] } })
    render(<PeopleRankings kind="actor" />)
    await user.type(screen.getByRole('textbox'), 'person')

    await user.click(screen.getByRole('button', { name: sortLabel }))

    await screen.findByText('Showing 2 actors')
    expect(displayedNames()).toEqual(['Person 2', 'Person 1'])
  })

  it("should open a person's films from the detail endpoint for the kind", async () => {
    const user = userEvent.setup()
    respondWith([person(1)])
    render(<PeopleRankings kind="actor" />)
    await user.click(screen.getByRole('button', { name: 'Load All Actors' }))
    mockAxiosGet.mockResolvedValueOnce({
      data: { data: { ...person(1), films: [{ _id: 'film1', title: 'Alien', year: 1979 }] } },
    })

    await user.click(await screen.findByRole('heading', { level: 3, name: 'Person 1' }))

    expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.actor('1'))
    expect(await screen.findByText('Alien')).toBeInTheDocument()
  })

  it('should show an error when loading fails', async () => {
    const user = userEvent.setup()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockAxiosGet.mockRejectedValueOnce(new Error('network down'))
    render(<PeopleRankings kind="actor" />)

    await user.click(screen.getByRole('button', { name: 'Load All Actors' }))

    expect(await screen.findByText('Failed to load actors')).toBeInTheDocument()
    consoleError.mockRestore()
  })

  it('should clear the results on reset', async () => {
    const user = userEvent.setup()
    respondWith([person(1)])
    render(<PeopleRankings kind="actor" />)
    await user.click(screen.getByRole('button', { name: 'Load All Actors' }))
    await screen.findByText('Showing 1 actor')

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.queryByText('Person 1')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load All Actors' })).toBeInTheDocument()
  })
})
