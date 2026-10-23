import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import RandomFilmsPage from './random/page'
import { API_ENDPOINTS } from '@/lib/api'
import { Film } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
const mockUseUser = jest.fn()
jest.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('@/components/Films/FilmGrid', () => ({
  __esModule: true,
  default: ({ films, onUpdate }: { films: Film[]; onUpdate?: (filmId: string) => void }) => (
    <div>
      <ul aria-label="Film cards">
        {films.map((film) => (
          <li key={film._id}>{film.title}</li>
        ))}
      </ul>
      {films.map((film) => (
        <button key={film._id} onClick={() => onUpdate?.(film._id)}>
          Edit {film._id}
        </button>
      ))}
    </div>
  ),
}))

const mockAxiosGet = axios.get as jest.Mock

const film = (id: string, title: string) => ({ _id: id, title, year: 2000 })

const deferred = () => {
  let resolve!: (value: unknown) => void
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const shownTitles = () =>
  screen.queryAllByRole('listitem').map((item) => item.textContent)

// Each draw of random films returns the next list; each film by ID returns `filmsById`.
const mockApi = (draws: object[][], filmsById: Record<string, unknown> = {}) => {
  mockAxiosGet.mockImplementation((url: string) => {
    if (url === API_ENDPOINTS.genres) return Promise.resolve({ data: { data: [] } })
    if (url.startsWith(API_ENDPOINTS.randomFilms)) {
      return Promise.resolve({ data: { data: draws.shift() } })
    }
    const id = url.slice(API_ENDPOINTS.film('').length)
    const result = filmsById[id]
    if (result instanceof Error) return Promise.reject(result)
    return result instanceof Promise ? result : Promise.resolve({ data: { data: result } })
  })
}

describe('RandomFilmsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAxiosGet.mockReset()
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true })
  })

  it('should ask visitors to sign in without loading anything', () => {
    mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: false })

    render(<RandomFilmsPage />)

    expect(screen.getByRole('heading', { name: 'Sign In Required' })).toBeInTheDocument()
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it('should refresh only the edited film, keeping the order', async () => {
    const user = userEvent.setup()
    mockApi([[film('a', 'Alien'), film('b', 'Brazil')]], {
      a: film('a', 'Alien (rated)'),
    })
    render(<RandomFilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Get Random Films' }))
    await screen.findByText('Alien')

    await user.click(screen.getByRole('button', { name: 'Edit a' }))

    expect(await screen.findByText('Alien (rated)')).toBeInTheDocument()
    expect(mockAxiosGet).toHaveBeenCalledWith(API_ENDPOINTS.film('a'))
    expect(mockAxiosGet).not.toHaveBeenCalledWith(API_ENDPOINTS.film('b'))
    expect(shownTitles()).toEqual(['Alien (rated)', 'Brazil'])
  })

  it('should keep the films on screen when a refresh fails', async () => {
    const user = userEvent.setup()
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockApi([[film('a', 'Alien')]], { a: new Error('network down') })
    render(<RandomFilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Get Random Films' }))
    await screen.findByText('Alien')

    await user.click(screen.getByRole('button', { name: 'Edit a' }))

    expect(shownTitles()).toEqual(['Alien'])
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('should not bring back the old films when a refresh finishes after a new draw', async () => {
    const user = userEvent.setup()
    const refresh = deferred()
    mockApi([[film('a', 'Alien')], [film('c', 'Casablanca')]], {
      a: refresh.promise,
    })
    render(<RandomFilmsPage />)
    await user.click(screen.getByRole('button', { name: 'Get Random Films' }))
    await screen.findByText('Alien')
    await user.click(screen.getByRole('button', { name: 'Edit a' }))

    await user.click(screen.getByRole('button', { name: 'Get Random Films' }))
    await screen.findByText('Casablanca')
    await act(async () => refresh.resolve({ data: { data: film('a', 'Alien (rated)') } }))

    expect(shownTitles()).toEqual(['Casablanca'])
  })
})
