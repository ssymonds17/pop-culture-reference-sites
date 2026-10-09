import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import FilmCard from './FilmCard'
import { API_ENDPOINTS } from '@/lib/api'
import { Director, Film } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
jest.mock('../Modal/FilmDetailModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>Film detail modal</div> : null),
}))

const mockAxiosGet = axios.get as jest.Mock

const director: Director = {
  _id: 'director1',
  tmdbPersonId: '956',
  name: 'guy ritchie',
  displayName: 'Guy Ritchie',
  films: [],
  totalFilms: 1,
  seenFilms: 1,
  totalScore: 8,
  ratingCounts: {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 0,
    rating8: 1,
    rating9: 0,
    rating10: 0,
  },
  totalPoints: 6,
}

const film: Film = {
  _id: 'film1',
  title: 'Snatch',
  year: 2000,
  directors: [director],
  watched: true,
  rating: 8,
  genres: [],
  tmdbId: '107',
}

describe('FilmCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should open the director's films from the director endpoint", async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce({
      data: { data: { ...director, films: [{ _id: 'film1', title: 'Snatch', year: 2000 }] } },
    })
    render(<FilmCard film={film} />)

    await user.click(screen.getByRole('button', { name: 'Guy Ritchie' }))

    expect(mockAxiosGet).toHaveBeenCalledWith(API_ENDPOINTS.director('956'))
    expect(await screen.findByRole('heading', { name: 'Guy Ritchie' })).toBeInTheDocument()
    expect(screen.queryByText('Film detail modal')).not.toBeInTheDocument()
  })

  it('should open the film details from the poster', async () => {
    const user = userEvent.setup()
    render(<FilmCard film={film} />)

    await user.click(screen.getByRole('button', { name: 'View details for Snatch' }))

    expect(screen.getByText('Film detail modal')).toBeInTheDocument()
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })
})
