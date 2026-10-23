import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import YearDetails from './YearDetails'
import { API_ENDPOINTS } from '@/lib/api'
import { Film, YearStats } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
jest.mock('@/components/Films/FilmGrid', () => ({
  __esModule: true,
  default: ({ films, onUpdate }: { films: Film[]; onUpdate?: () => void }) => (
    <div>
      <ul aria-label="Film cards">
        {films.map((film) => (
          <li key={film._id}>{film.title}</li>
        ))}
      </ul>
      <button onClick={onUpdate}>Edit a film</button>
    </div>
  ),
}))
jest.mock('@/components/Stats/OverviewCard', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/Stats/RatingDistribution', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/Stats/GenreDistribution', () => ({ __esModule: true, default: () => null }))

const mockAxiosGet = axios.get as jest.Mock

const yearStats: YearStats = {
  _id: 'year1979',
  year: 1979,
  totalFilms: 2,
  watchedFilms: 1,
  totalScore: 8,
  filmsRated6Plus: 1,
  percentRated6Plus: 50,
  yearScore: 6,
  ratingDistribution: {
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
  topGenres: [],
}

const filmsResponse = (titles: string[]) => ({
  data: { data: titles.map((title, i) => ({ _id: `${title}-${i}`, title, year: 1979 })) },
})

const deferred = () => {
  let resolve!: (value: unknown) => void
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const shownTitles = () =>
  screen.queryAllByRole('listitem').map((item) => item.textContent)

describe('YearDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAxiosGet.mockReset()
  })

  it("should load the year's films", async () => {
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))

    render(<YearDetails yearStats={yearStats} onClose={jest.fn()} />)

    expect(await screen.findByText('Alien')).toBeInTheDocument()
    expect(mockAxiosGet).toHaveBeenCalledWith(API_ENDPOINTS.films, { params: { year: 1979 } })
  })

  it('should keep the films on screen while refreshing them after an edit', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien', 'Apocalypse Now']))
    render(<YearDetails yearStats={yearStats} onClose={jest.fn()} />)
    await screen.findByText('Alien')
    const refresh = deferred()
    mockAxiosGet.mockReturnValueOnce(refresh.promise)

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    expect(mockAxiosGet).toHaveBeenCalledTimes(2)
    expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.films, { params: { year: 1979 } })
    expect(shownTitles()).toEqual(['Alien', 'Apocalypse Now'])

    await act(async () => refresh.resolve(filmsResponse(['Alien (rated)', 'Apocalypse Now'])))

    expect(shownTitles()).toEqual(['Alien (rated)', 'Apocalypse Now'])
  })

  it('should ask for the year stats to be refreshed after an edit', async () => {
    const user = userEvent.setup()
    const onFilmUpdated = jest.fn()
    mockAxiosGet.mockResolvedValue(filmsResponse(['Alien']))
    render(<YearDetails yearStats={yearStats} onClose={jest.fn()} onFilmUpdated={onFilmUpdated} />)
    await screen.findByText('Alien')

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    expect(onFilmUpdated).toHaveBeenCalledTimes(1)
  })

  it('should keep the latest refresh when an earlier one lands late', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
    render(<YearDetails yearStats={yearStats} onClose={jest.fn()} />)
    await screen.findByText('Alien')
    const first = deferred()
    const second = deferred()
    mockAxiosGet.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))
    await user.click(screen.getByRole('button', { name: 'Edit a film' }))
    await act(async () => second.resolve(filmsResponse(['Alien (rated 9)'])))
    await act(async () => first.resolve(filmsResponse(['Alien (rated 8)'])))

    expect(shownTitles()).toEqual(['Alien (rated 9)'])
  })

  it('should keep the films on screen when a refresh fails', async () => {
    const user = userEvent.setup()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
    render(<YearDetails yearStats={yearStats} onClose={jest.fn()} />)
    await screen.findByText('Alien')
    mockAxiosGet.mockRejectedValueOnce(new Error('network down'))

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    expect(shownTitles()).toEqual(['Alien'])
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
