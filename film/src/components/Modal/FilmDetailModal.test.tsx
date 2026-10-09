import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import FilmDetailModal from './FilmDetailModal'
import { API_ENDPOINTS } from '@/lib/api'
import { Actor, CastMember, Film } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), create: jest.fn() },
}))
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: jest.fn() }),
}))

const mockAxiosGet = axios.get as jest.Mock

const film: Film = {
  _id: 'film1',
  title: 'Lock, Stock and Two Smoking Barrels',
  year: 1998,
  directors: [],
  watched: true,
  rating: 8,
  owned: true,
  genres: ['Comedy', 'Crime'],
  tmdbId: '100',
}

const actor = (id: number): Actor => ({
  _id: `actor${id}`,
  tmdbPersonId: `${id}`,
  name: `actor ${id}`,
  displayName: `Actor ${id}`,
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
})

const castOf = (size: number): CastMember[] =>
  Array.from({ length: size }, (_, i) => ({
    actor: actor(i + 1),
    character: `Character ${i + 1}`,
    order: i,
  }))

const mockDetails = (details: Partial<Film>) =>
  mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...film, ...details } } })

const deferred = () => {
  let resolve!: (value: unknown) => void
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const detailsResponse = (details: Partial<Film>) => ({ data: { data: { ...film, ...details } } })

const otherFilm: Film = { ...film, _id: 'film2', title: 'Snatch', year: 2000, tmdbId: '107' }

const renderModal = (props: Partial<Parameters<typeof FilmDetailModal>[0]> = {}) =>
  render(
    <FilmDetailModal film={film} isOpen onClose={jest.fn()} onUpdate={jest.fn()} {...props} />
  )

describe('FilmDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch the film details when opened', async () => {
    mockDetails({ cast: [] })

    renderModal()

    await waitFor(() => expect(mockAxiosGet).toHaveBeenCalledWith(API_ENDPOINTS.film('film1')))
  })

  it('should not fetch while closed', () => {
    renderModal({ isOpen: false })

    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it('should not refetch when the same film is updated', async () => {
    mockDetails({ cast: castOf(1) })
    const { rerender } = renderModal()
    await screen.findByText('Actor 1')

    rerender(
      <FilmDetailModal
        film={{ ...film, rating: 9 }}
        isOpen
        onClose={jest.fn()}
        onUpdate={jest.fn()}
      />
    )

    expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Actor 1')).toBeInTheDocument()
  })

  it('should show a loading message until the cast arrives', async () => {
    mockDetails({ cast: castOf(1) })

    renderModal()

    expect(screen.getByText('Loading cast...')).toBeInTheDocument()
    expect(await screen.findByText('Actor 1')).toBeInTheDocument()
    expect(screen.queryByText('Loading cast...')).not.toBeInTheDocument()
  })

  it('should show the first five cast members with their characters', async () => {
    mockDetails({ cast: castOf(8) })

    renderModal()

    expect(await screen.findByText('Actor 1')).toBeInTheDocument()
    expect(screen.getByText('as Character 1')).toBeInTheDocument()
    expect(screen.getByText('Actor 5')).toBeInTheDocument()
    expect(screen.queryByText('Actor 6')).not.toBeInTheDocument()
  })

  it('should toggle between the first five and the full cast', async () => {
    const user = userEvent.setup()
    mockDetails({ cast: castOf(8) })
    renderModal()

    await user.click(await screen.findByRole('button', { name: 'Show full cast (8)' }))

    expect(screen.getByText('Actor 8')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show less' }))

    expect(screen.queryByText('Actor 6')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show full cast (8)' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('should not offer the toggle when the cast fits in the preview', async () => {
    mockDetails({ cast: castOf(5) })

    renderModal()

    await screen.findByText('Actor 5')
    expect(screen.queryByRole('button', { name: /Show full cast/ })).not.toBeInTheDocument()
  })

  it('should show a cast member without a character by name alone', async () => {
    mockDetails({ cast: [{ actor: actor(1), order: 0 }] })

    renderModal()

    expect(await screen.findByText('Actor 1')).toBeInTheDocument()
    expect(screen.queryByText(/^as /)).not.toBeInTheDocument()
  })

  it('should skip cast members whose actor no longer exists', async () => {
    mockDetails({
      cast: [
        { actor: null, character: 'Gone', order: 0 },
        { actor: actor(2), character: 'Character 2', order: 1 },
      ],
    })

    renderModal()

    expect(await screen.findByText('Actor 2')).toBeInTheDocument()
    expect(screen.queryByText('as Gone')).not.toBeInTheDocument()
  })

  it('should list the production companies', async () => {
    mockDetails({
      cast: [],
      productionCompanies: [
        { tmdbId: '1', name: 'Handmade Films' },
        { tmdbId: '2', name: 'Summit Entertainment' },
      ],
    })

    renderModal()

    expect(await screen.findByText('Handmade Films, Summit Entertainment')).toBeInTheDocument()
    expect(screen.getByText('Produced by')).toBeInTheDocument()
  })

  it('should hide the cast and companies when the film has none', async () => {
    mockDetails({ cast: [], productionCompanies: [] })

    renderModal()

    await waitFor(() => expect(screen.queryByText('Loading cast...')).not.toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Cast' })).not.toBeInTheDocument()
    expect(screen.queryByText('Produced by')).not.toBeInTheDocument()
  })

  it('should say when the cast could not be loaded', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockAxiosGet.mockRejectedValueOnce(new Error('network down'))

    renderModal()

    expect(await screen.findByText('Could not load cast')).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('should show the cast but no edit controls when read-only', async () => {
    mockDetails({ cast: castOf(1) })

    renderModal({ readOnly: true })

    expect(await screen.findByText('Actor 1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '10' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Owned' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add review' })).not.toBeInTheDocument()
  })

  it('should label the cast list with its heading', async () => {
    mockDetails({ cast: castOf(1) })

    renderModal()

    expect(await screen.findByRole('list', { name: 'Cast' })).toBeInTheDocument()
  })

  describe('switching film', () => {
    const renderFilm = (rerender: (ui: React.ReactElement) => void, current: Film, isOpen = true) =>
      rerender(
        <FilmDetailModal film={current} isOpen={isOpen} onClose={jest.fn()} onUpdate={jest.fn()} />
      )

    it("should show loading rather than the previous film's cast", async () => {
      mockDetails({ cast: castOf(1) })
      const { rerender } = renderModal()
      await screen.findByText('Actor 1')
      const pending = deferred()
      mockAxiosGet.mockReturnValueOnce(pending.promise)

      renderFilm(rerender, otherFilm)

      expect(screen.queryByText('Actor 1')).not.toBeInTheDocument()
      expect(screen.getByText('Loading cast...')).toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.film('film2'))

      await act(async () => pending.resolve(detailsResponse({ _id: 'film2', cast: [{ actor: actor(9), order: 0 }] })))

      expect(screen.getByText('Actor 9')).toBeInTheDocument()
    })

    it('should ignore a response for the previous film that arrives late', async () => {
      const firstFilm = deferred()
      mockAxiosGet.mockReturnValueOnce(firstFilm.promise)
      const { rerender } = renderModal()
      mockDetails({ _id: 'film2', cast: [{ actor: actor(9), order: 0 }] })

      renderFilm(rerender, otherFilm)
      await screen.findByText('Actor 9')
      await act(async () => firstFilm.resolve(detailsResponse({ cast: castOf(1) })))

      expect(screen.getByText('Actor 9')).toBeInTheDocument()
      expect(screen.queryByText('Actor 1')).not.toBeInTheDocument()
    })

    it('should collapse the full cast for the new film', async () => {
      const user = userEvent.setup()
      mockDetails({ cast: castOf(8) })
      const { rerender } = renderModal()
      await user.click(await screen.findByRole('button', { name: 'Show full cast (8)' }))
      mockDetails({ _id: 'film2', cast: castOf(8) })

      renderFilm(rerender, otherFilm)

      expect(await screen.findByRole('button', { name: 'Show full cast (8)' })).toBeInTheDocument()
      expect(screen.queryByText('Actor 6')).not.toBeInTheDocument()
    })
  })

  describe('closing and reopening', () => {
    it('should ignore a response that arrives after the modal closes', async () => {
      const beforeClose = deferred()
      mockAxiosGet.mockReturnValueOnce(beforeClose.promise)
      const { rerender } = renderModal()

      rerender(<FilmDetailModal film={film} isOpen={false} onClose={jest.fn()} onUpdate={jest.fn()} />)
      await act(async () => beforeClose.resolve(detailsResponse({ cast: castOf(1) })))
      const afterReopen = deferred()
      mockAxiosGet.mockReturnValueOnce(afterReopen.promise)
      rerender(<FilmDetailModal film={film} isOpen onClose={jest.fn()} onUpdate={jest.fn()} />)

      expect(screen.getByText('Loading cast...')).toBeInTheDocument()
      expect(screen.queryByText('Actor 1')).not.toBeInTheDocument()
    })

    it('should retry after an error and show the cast once it loads', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockAxiosGet.mockRejectedValueOnce(new Error('network down'))
      const { rerender } = renderModal()
      await screen.findByText('Could not load cast')
      rerender(<FilmDetailModal film={film} isOpen={false} onClose={jest.fn()} onUpdate={jest.fn()} />)
      mockDetails({ cast: castOf(1) })

      rerender(<FilmDetailModal film={film} isOpen onClose={jest.fn()} onUpdate={jest.fn()} />)

      expect(screen.queryByText('Could not load cast')).not.toBeInTheDocument()
      expect(await screen.findByText('Actor 1')).toBeInTheDocument()
      consoleError.mockRestore()
    })
  })
})
