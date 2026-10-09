import { render, screen } from '@testing-library/react'
import axios from 'axios'
import PersonFilmsModal from './PersonFilmsModal'
import { API_ENDPOINTS } from '@/lib/api'
import { Person } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))

const mockAxiosGet = axios.get as jest.Mock

const person: Person = {
  _id: 'person1',
  tmdbPersonId: '123',
  name: 'sigourney weaver',
  displayName: 'Sigourney Weaver',
  totalFilms: 2,
  seenFilms: 1,
  averageRating: 9,
  totalScore: 9,
  ratingCounts: {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 0,
    rating8: 0,
    rating9: 1,
    rating10: 0,
  },
  totalPoints: 10,
}

const films = [
  { _id: 'film1', title: 'Alien', year: 1979, rating: 9, owned: true },
  { _id: 'film2', title: 'Galaxy Quest', year: 1999 },
]

describe('PersonFilmsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['director', API_ENDPOINTS.director('123')],
    ['actor', API_ENDPOINTS.actor('123')],
  ] as const)('should load the films from the %s endpoint', async (kind, endpoint) => {
    mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, films } } })

    render(<PersonFilmsModal person={person} kind={kind} isOpen onClose={jest.fn()} />)

    expect(await screen.findByText('Alien')).toBeInTheDocument()
    expect(mockAxiosGet).toHaveBeenCalledWith(endpoint)
  })

  it("should show the person's name and stats", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, films } } })

    render(<PersonFilmsModal person={person} kind="actor" isOpen onClose={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Sigourney Weaver' })).toBeInTheDocument()
    expect(screen.getByText('2 films · 1 seen · 9.00 avg rating')).toBeInTheDocument()
    expect(await screen.findByText('Galaxy Quest')).toBeInTheDocument()
  })

  it('should not fetch or render while closed', () => {
    const { container } = render(
      <PersonFilmsModal person={person} kind="actor" isOpen={false} onClose={jest.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it('should show an error when the films cannot be loaded', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockAxiosGet.mockRejectedValueOnce(new Error('network down'))

    render(<PersonFilmsModal person={person} kind="actor" isOpen onClose={jest.fn()} />)

    expect(await screen.findByText('Failed to load films')).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
