import { act, fireEvent, render, screen } from '@testing-library/react'
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

const otherPerson: Person = { ...person, _id: 'person2', tmdbPersonId: '456', displayName: 'Bill Paxton' }

const filmsResponse = (titles: string[]) => ({
  data: { data: { films: titles.map((title, i) => ({ _id: `${title}-${i}`, title, year: 2000 })) } },
})

const deferred = () => {
  let resolve!: (value: unknown) => void
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const renderModal = (current: Person, isOpen = true, kind: 'director' | 'actor' = 'actor') => (
  <PersonFilmsModal person={current} kind={kind} isOpen={isOpen} onClose={jest.fn()} />
)

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

  describe('photo', () => {
    const withPhoto = { ...person, profilePath: '/weaver.jpg' }

    it("should show the person's TMDb photo as a decorative image", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))

      const { container } = render(renderModal(withPhoto))

      const photo = container.querySelector('img')
      expect(photo).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w185/weaver.jpg')
      expect(photo).toHaveAttribute('alt', '')
      expect(screen.queryByText('SW')).not.toBeInTheDocument()
      await screen.findByText('No films found')
    })

    it.each([
      ['Sigourney Weaver', 'SW'],
      ['Philip Seymour Hoffman', 'PH'],
      ['Madonna', 'M'],
      ['  Sigourney   Weaver ', 'SW'],
      ['Éva Green', 'ÉG'],
    ])('should show initials for "%s" when there is no photo', async (displayName, initials) => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))

      const { container } = render(renderModal({ ...person, displayName }))

      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(screen.getByText(initials)).toHaveAttribute('aria-hidden', 'true')
      await screen.findByText('No films found')
    })

    it('should fall back to initials when the photo fails to load', async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))
      const { container } = render(renderModal(withPhoto))

      fireEvent.error(container.querySelector('img')!)

      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(screen.getByText('SW')).toBeInTheDocument()
      await screen.findByText('No films found')
    })

    it('should still load a different photo after one has failed', async () => {
      mockAxiosGet
        .mockResolvedValueOnce(filmsResponse([]))
        .mockResolvedValueOnce(filmsResponse([]))
      const { container, rerender } = render(renderModal(withPhoto))
      fireEvent.error(container.querySelector('img')!)

      rerender(renderModal({ ...otherPerson, profilePath: '/paxton.jpg' }))

      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'https://image.tmdb.org/t/p/w185/paxton.jpg'
      )
      await screen.findByText('No films found')
    })

    it('should switch from a photo to initials for a person without one', async () => {
      mockAxiosGet
        .mockResolvedValueOnce(filmsResponse([]))
        .mockResolvedValueOnce(filmsResponse([]))
      const { container, rerender } = render(renderModal(withPhoto))

      rerender(renderModal(otherPerson))

      expect(container.querySelector('img')).not.toBeInTheDocument()
      expect(screen.getByText('BP')).toBeInTheDocument()
      await screen.findByText('No films found')
    })
  })

  it('should say no films were found when the response has none', async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person } } })

    render(renderModal(person))

    expect(await screen.findByText('No films found')).toBeInTheDocument()
  })

  describe('switching person', () => {
    it("should show loading rather than the previous person's films", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
      const { rerender } = render(renderModal(person))
      await screen.findByText('Alien')
      const pending = deferred()
      mockAxiosGet.mockReturnValueOnce(pending.promise)

      rerender(renderModal(otherPerson))

      expect(screen.queryByText('Alien')).not.toBeInTheDocument()
      expect(screen.getByText('Loading films...')).toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.actor('456'))

      await act(async () => pending.resolve(filmsResponse(['Twister'])))

      expect(screen.getByText('Twister')).toBeInTheDocument()
    })

    it('should ignore a response for the previous person that arrives late', async () => {
      const firstPerson = deferred()
      mockAxiosGet.mockReturnValueOnce(firstPerson.promise)
      const { rerender } = render(renderModal(person))
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Twister']))

      rerender(renderModal(otherPerson))
      await screen.findByText('Twister')
      await act(async () => firstPerson.resolve(filmsResponse(['Alien'])))

      expect(screen.getByText('Twister')).toBeInTheDocument()
      expect(screen.queryByText('Alien')).not.toBeInTheDocument()
    })

    it('should ignore a failure for the previous person that arrives late', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      let rejectFirst!: (reason: unknown) => void
      mockAxiosGet.mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectFirst = reject
        })
      )
      const { rerender } = render(renderModal(person))
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Twister']))

      rerender(renderModal(otherPerson))
      await screen.findByText('Twister')
      await act(async () => rejectFirst(new Error('network down')))

      expect(screen.queryByText('Failed to load films')).not.toBeInTheDocument()
      expect(consoleError).not.toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('should render and fetch nothing when the person is cleared', async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
      const { rerender, container } = render(renderModal(person))
      await screen.findByText('Alien')

      rerender(<PersonFilmsModal person={null} kind="actor" isOpen onClose={jest.fn()} />)

      expect(container).toBeEmptyDOMElement()
      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
    })

    it('should refetch when the same person is shown as a different kind', async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
      const { rerender } = render(renderModal(person, true, 'actor'))
      await screen.findByText('Alien')
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Directed Film']))

      rerender(renderModal(person, true, 'director'))

      expect(screen.queryByText('Alien')).not.toBeInTheDocument()
      expect(screen.getByText('Loading films...')).toBeInTheDocument()
      expect(await screen.findByText('Directed Film')).toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenLastCalledWith(API_ENDPOINTS.director('123'))
    })
  })

  describe('closing and reopening', () => {
    it('should ignore a response that arrives after the modal closes', async () => {
      const beforeClose = deferred()
      mockAxiosGet.mockReturnValueOnce(beforeClose.promise)
      const { rerender } = render(renderModal(person))

      rerender(renderModal(person, false))
      await act(async () => beforeClose.resolve(filmsResponse(['Alien'])))
      mockAxiosGet.mockReturnValueOnce(deferred().promise)
      rerender(renderModal(person))

      expect(screen.getByText('Loading films...')).toBeInTheDocument()
      expect(screen.queryByText('Alien')).not.toBeInTheDocument()
    })

    it('should show the films already loaded while refreshing them on reopen', async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))
      const { rerender } = render(renderModal(person))
      await screen.findByText('Alien')
      rerender(renderModal(person, false))
      const refresh = deferred()
      mockAxiosGet.mockReturnValueOnce(refresh.promise)

      rerender(renderModal(person))

      expect(screen.getByText('Alien')).toBeInTheDocument()
      expect(screen.queryByText('Loading films...')).not.toBeInTheDocument()
      expect(mockAxiosGet).toHaveBeenCalledTimes(2)

      await act(async () => refresh.resolve(filmsResponse(['Alien', 'Aliens'])))

      expect(screen.getByText('Aliens')).toBeInTheDocument()
    })

    it('should retry after an error and show the films once they load', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockAxiosGet.mockRejectedValueOnce(new Error('network down'))
      const { rerender } = render(renderModal(person))
      await screen.findByText('Failed to load films')
      rerender(renderModal(person, false))
      mockAxiosGet.mockResolvedValueOnce(filmsResponse(['Alien']))

      rerender(renderModal(person))

      expect(screen.queryByText('Failed to load films')).not.toBeInTheDocument()
      expect(await screen.findByText('Alien')).toBeInTheDocument()
      consoleError.mockRestore()
    })
  })
})
