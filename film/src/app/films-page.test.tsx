import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import FilmsPage from './films/page'
import { API_ENDPOINTS } from '@/lib/api'
import { Film } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: true }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
jest.mock('@/components/Filters/FilmFilters', () => ({
  __esModule: true,
  default: ({
    onSearch,
    onReset,
  }: {
    onSearch: (filters: { owned?: boolean; searchString?: string }) => void
    onReset: () => void
  }) => (
    <div>
      <button onClick={() => onSearch({ owned: true })}>Search owned</button>
      <button onClick={() => onSearch({ searchString: 'ali' })}>Search by title</button>
      <button onClick={onReset}>Reset filters</button>
    </div>
  ),
}))
jest.mock('@/components/Modal/AddFilmModal', () => ({ AddFilmModal: () => null }))

const mockAxiosGet = axios.get as jest.Mock

const filmsResponse = (titles: string[]) => ({
  data: { data: titles.map((title, i) => ({ _id: `${title}-${i}`, title, year: 2000 })) },
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

describe('FilmsPage', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockAxiosGet.mockReset()
  })

  it('should keep the films on screen while refreshing them after an edit', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien', 'Aliens']))
    render(<FilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Load All Films' }))
    await screen.findByText('Alien')
    const refresh = deferred()
    mockAxiosGet.mockReturnValueOnce(refresh.promise)

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    expect(mockAxiosGet).toHaveBeenLastCalledWith(`${API_ENDPOINTS.films}?`)
    expect(shownTitles()).toEqual(['Alien', 'Aliens'])

    await act(async () => refresh.resolve(filmsResponse(['Alien (rated)', 'Aliens'])))

    expect(shownTitles()).toEqual(['Alien (rated)', 'Aliens'])
  })

  it('should re-run the filters behind the results on screen when refreshing', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
    render(<FilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Search owned' }))
    await screen.findByText('Alien')
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))

    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    expect(mockAxiosGet).toHaveBeenLastCalledWith(`${API_ENDPOINTS.films}?owned=true`)
  })

  it('should not let a slow refresh overwrite a newer search', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
    render(<FilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Load All Films' }))
    await screen.findByText('Alien')
    const refresh = deferred()
    mockAxiosGet.mockReturnValueOnce(refresh.promise)
    await user.click(screen.getByRole('button', { name: 'Edit a film' }))
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Brazil']))

    await user.click(screen.getByRole('button', { name: 'Search owned' }))
    await screen.findByText('Brazil')
    await act(async () => refresh.resolve(filmsResponse(['Alien (rated)'])))

    expect(shownTitles()).toEqual(['Brazil'])
  })

  it('should not let a slow refresh of a title search overwrite a newer search', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
    render(<FilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Search by title' }))
    await screen.findByText('Alien')
    const refresh = deferred()
    mockAxiosGet.mockReturnValueOnce(refresh.promise)
    await user.click(screen.getByRole('button', { name: 'Edit a film' }))
    expect(mockAxiosGet).toHaveBeenLastCalledWith(
      `${API_ENDPOINTS.search}?searchString=ali&itemType=film`
    )
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Brazil']))

    await user.click(screen.getByRole('button', { name: 'Search owned' }))
    await screen.findByText('Brazil')
    await act(async () => refresh.resolve(filmsResponse(['Alien (rated)'])))

    expect(shownTitles()).toEqual(['Brazil'])
  })

  it('should not let a refresh refill the list after a reset', async () => {
    const user = userEvent.setup()
    mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
    render(<FilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Load All Films' }))
    await screen.findByText('Alien')
    const refresh = deferred()
    mockAxiosGet.mockReturnValueOnce(refresh.promise)
    await user.click(screen.getByRole('button', { name: 'Edit a film' }))

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    await act(async () => refresh.resolve(filmsResponse(['Alien (rated)'])))

    expect(shownTitles()).toEqual([])
    expect(screen.getByRole('button', { name: 'Load All Films' })).toBeInTheDocument()
  })
})
