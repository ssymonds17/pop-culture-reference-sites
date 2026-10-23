import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { AddFilmModal } from './AddFilmModal'
import { API_ENDPOINTS } from '@/lib/api'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), create: jest.fn() },
}))
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: jest.fn() }),
}))

const mockAxiosGet = axios.get as jest.Mock

const searchResult = {
  tmdbId: '550',
  title: 'Fight Club',
  year: 1999,
  posterPath: null,
  overview: 'An overview',
}

const details = (overrides: Record<string, unknown> = {}) => ({
  tmdbId: '550',
  title: 'Fight Club',
  year: 1999,
  duration: 139,
  directors: [{ tmdbPersonId: '7467', name: 'David Fincher' }],
  cast: [
    { tmdbPersonId: '819', name: 'Edward Norton', character: 'Narrator' },
    { tmdbPersonId: '287', name: 'Brad Pitt', character: 'Tyler Durden' },
  ],
  ...overrides,
})

const expandFirstResult = async (filmDetails: ReturnType<typeof details>) => {
  mockAxiosGet.mockImplementation(async (url: string) =>
    url === API_ENDPOINTS.searchTmdb
      ? { data: { data: [searchResult] } }
      : { data: filmDetails },
  )

  const user = userEvent.setup()
  render(<AddFilmModal isOpen onClose={jest.fn()} onFilmAdded={jest.fn()} />)

  await user.type(screen.getByPlaceholderText('Search for a film...'), 'fight club{Enter}')
  await user.click(await screen.findByText('Fight Club'))
  await screen.findByText('David Fincher')
}

describe('AddFilmModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the cast in billing order when a result is expanded', async () => {
    await expandFirstResult(details())

    expect(mockAxiosGet).toHaveBeenCalledWith(API_ENDPOINTS.tmdbFilmDetails('550'))
    expect(screen.getByText('Cast:')).toBeInTheDocument()
    expect(screen.getByText('Edward Norton, Brad Pitt')).toBeInTheDocument()
  })

  it('searches when Enter is pressed in the year field', async () => {
    const user = userEvent.setup()
    render(<AddFilmModal isOpen onClose={jest.fn()} onFilmAdded={jest.fn()} />)

    await user.type(screen.getByPlaceholderText('Year'), '1999{Enter}')

    expect(await screen.findByText('Please enter a search query')).toBeInTheDocument()
  })

    it('omits the cast line when TMDb has no credited cast', async () => {
    await expandFirstResult(details({ cast: [] }))

    expect(screen.queryByText('Cast:')).not.toBeInTheDocument()
  })
})
