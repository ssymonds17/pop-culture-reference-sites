import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import PersonFilmsModal from './PersonFilmsModal'
import { API_ENDPOINTS } from '@/lib/api'
import { ImdbRating, Person, TmdbPersonFilm } from '@/types'

// A factory avoids loading axios's ESM browser build, which Jest cannot parse.
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), create: jest.fn() },
}))
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: jest.fn() }),
}))

const mockAxiosGet = axios.get as jest.Mock
const mockAxiosCreate = axios.create as jest.Mock

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

// Finds a row's cell by its column header, so tests don't break when columns are added or removed
const cellInColumn = (row: HTMLElement, header: string) => {
  const headers = within(row.closest('table')!).getAllByRole('columnheader')
  const index = headers.findIndex((cell) => cell.textContent === header)
  return within(row).getAllByRole('cell')[index]
}

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

  describe('links', () => {
    it("should link to the person's TMDb page", async () => {
      mockAxiosGet.mockResolvedValueOnce(filmsResponse([]))

      render(renderModal(person))

      expect(screen.getByRole('link', { name: 'TMDB' })).toHaveAttribute(
        'href',
        'https://www.themoviedb.org/person/123'
      )
      await screen.findByText('No films found')
    })

    it('should link to IMDb once the person loads with an IMDb ID', async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, imdbPersonId: 'nm0000244', films: [] } } })

      render(renderModal(person))

      expect(await screen.findByRole('link', { name: 'IMDB' })).toHaveAttribute(
        'href',
        'https://www.imdb.com/name/nm0000244'
      )
      expect(screen.getByRole('link', { name: 'IMDB' })).toHaveAttribute('target', '_blank')
    })

    it.each([null, undefined])('should not link to IMDb when the ID is %p', async (imdbPersonId) => {
      mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, imdbPersonId, films: [] } } })

      render(renderModal(person))

      await screen.findByText('No films found')
      expect(screen.queryByRole('link', { name: 'IMDB' })).not.toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('should show the stats from the loaded person, which are fresher than those passed in', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: { data: { ...person, totalFilms: 3, seenFilms: 2, averageRating: 8.5, films } },
      })

      render(renderModal(person))

      expect(await screen.findByText('3 films · 2 seen · 8.50 avg rating')).toBeInTheDocument()
    })

    it('should link to IMDb from the person passed in before the films load', () => {
      mockAxiosGet.mockReturnValueOnce(deferred().promise)

      render(renderModal({ ...person, imdbPersonId: 'nm0000244' }))

      expect(screen.getByRole('link', { name: 'IMDB' })).toHaveAttribute(
        'href',
        'https://www.imdb.com/name/nm0000244'
      )
    })
  })

  describe('role column', () => {
    const roleFilms = [
      { _id: 'film1', title: 'Alien', year: 1979, lead: true },
      { _id: 'film2', title: 'Galaxy Quest', year: 1999, lead: false },
    ]

    it("should show whether an actor is a lead or support in each film", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, films: roleFilms } } })

      render(renderModal(person, true, 'actor'))

      const alienRow = (await screen.findByText('Alien')).closest('tr')!
      expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument()
      expect(within(alienRow).getByText('Lead')).toBeInTheDocument()
      expect(within(screen.getByText('Galaxy Quest').closest('tr')!).getByText('Support')).toBeInTheDocument()
    })

    it('should not show a role column for a director', async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: { data: { ...person, films: roleFilms } } })

      render(renderModal(person, true, 'director'))

      await screen.findByText('Alien')
      expect(screen.queryByRole('columnheader', { name: 'Role' })).not.toBeInTheDocument()
      expect(screen.queryByText('Support')).not.toBeInTheDocument()
    })
  })

  describe('all films tab', () => {
    const tmdbFilm = (overrides: Partial<TmdbPersonFilm> = {}): TmdbPersonFilm => ({
      tmdbId: '348',
      title: 'Alien',
      year: 1979,
      character: 'Ellen Ripley',
      inCollection: false,
      ...overrides,
    })

    const mockApi = (tmdbFilms: TmdbPersonFilm[] | Error, yourFilms = () => films) => {
      mockAxiosGet.mockImplementation(async (url: string) => {
        if (url === API_ENDPOINTS.tmdbPersonFilms('123')) {
          if (tmdbFilms instanceof Error) throw tmdbFilms
          return { data: { data: tmdbFilms } }
        }
        return { data: { data: { ...person, films: yourFilms() } } }
      })
    }

    const tmdbCalls = () =>
      mockAxiosGet.mock.calls.filter(([url]) => url === API_ENDPOINTS.tmdbPersonFilms('123'))

    const mockPost = jest.fn()
    // The signed-in client's GET, which loads IMDb ratings; by default every film is rated
    // with enough votes to pass the filter
    const mockClientGet = jest.fn()
    const wellRatedFor = (_url: string, config: { params: { tmdbIds: string } }) =>
      Promise.resolve({
        data: {
          data: Object.fromEntries(
            config.params.tmdbIds
              .split(',')
              .map((tmdbId) => [tmdbId, { imdbId: `tt${tmdbId}`, imdbRating: 7, imdbVotes: 5000 }])
          ),
        },
      })

    beforeEach(() => {
      mockAxiosGet.mockReset()
      mockPost.mockReset()
      mockPost.mockResolvedValue({})
      mockClientGet.mockReset()
      mockClientGet.mockImplementation(wellRatedFor)
      mockAxiosCreate.mockReturnValue({ post: mockPost, get: mockClientGet })
    })

    const openAllFilms = async (props: { kind?: 'actor' | 'director' } = {}) => {
      const user = userEvent.setup()
      render(
        <PersonFilmsModal
          person={person}
          kind={props.kind ?? 'actor'}
          isOpen
          onClose={jest.fn()}
        />
      )
      await screen.findByText('Galaxy Quest')
      await user.click(screen.getByRole('tab', { name: 'All films' }))
      return user
    }

    it('should start on "Your films" without fetching from TMDb', async () => {
      mockApi([tmdbFilm()])

      render(renderModal(person))

      await screen.findByText('Galaxy Quest')
      expect(screen.getByRole('tab', { name: 'Your films' })).toHaveAttribute('aria-selected', 'true')
      expect(tmdbCalls()).toHaveLength(0)
    })

    it("should fetch the person's TMDb filmography for their kind when opened", async () => {
      mockApi([tmdbFilm()])

      await openAllFilms({ kind: 'director' })

      expect(screen.getByRole('tab', { name: 'All films' })).toHaveAttribute('aria-selected', 'true')
      expect(mockAxiosGet).toHaveBeenCalledWith(API_ENDPOINTS.tmdbPersonFilms('123'), {
        params: { kind: 'director' },
      })
    })

    it('should show each film with its character, year and TMDb link, and no TMDb score', async () => {
      mockApi([tmdbFilm()])

      await openAllFilms()

      const link = await screen.findByRole('link', { name: 'Alien' })
      expect(link).toHaveAttribute('href', 'https://www.themoviedb.org/movie/348')
      const row = link.closest('tr')!
      expect(within(row).getByText('as Ellen Ripley')).toBeInTheDocument()
      expect(within(row).getByText('1979')).toBeInTheDocument()
      expect(screen.queryByRole('columnheader', { name: 'TMDb' })).not.toBeInTheDocument()
    })

    it('should show "-" for the year when TMDb has no date', async () => {
      mockApi([tmdbFilm({ year: null, character: null })])

      await openAllFilms()

      const row = (await screen.findByRole('link', { name: 'Alien' })).closest('tr')!
      expect(cellInColumn(row, 'Year')).toHaveTextContent(/^-$/)
      expect(within(row).queryByText(/^as /)).not.toBeInTheDocument()
    })

    it('should fetch the filmography only once when switching tabs', async () => {
      mockApi([tmdbFilm()])
      const user = await openAllFilms()
      await screen.findByRole('link', { name: 'Alien' })

      await user.click(screen.getByRole('tab', { name: 'Your films' }))
      await user.click(screen.getByRole('tab', { name: 'All films' }))

      expect(await screen.findByRole('link', { name: 'Alien' })).toBeInTheDocument()
      expect(tmdbCalls()).toHaveLength(1)
    })

    it('should show "In collection" instead of Add for a film already added', async () => {
      mockApi([tmdbFilm({ inCollection: true })])

      await openAllFilms()

      expect(await screen.findByText('In collection')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument()
    })

    it('should add a film, mark it as in the collection and refresh "Your films"', async () => {
      let yourFilms = films
      mockApi([tmdbFilm({ tmdbId: '679', title: 'Aliens', year: 1986 })], () => yourFilms)
      const user = await openAllFilms()
      yourFilms = [...films, { _id: 'film3', title: 'Aliens', year: 1986 }]

      await user.click(await screen.findByRole('button', { name: 'Add Aliens (1986)' }))

      expect(mockPost).toHaveBeenCalledWith(API_ENDPOINTS.createFilm, { tmdbId: '679' })
      expect(await screen.findByText('In collection')).toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: 'Your films' }))

      expect(await screen.findByText('Aliens')).toBeInTheDocument()
    })

    it('should refresh "Your films" when the film already exists', async () => {
      let yourFilms = films
      mockApi([tmdbFilm({ tmdbId: '679', title: 'Aliens', year: 1986 })], () => yourFilms)
      mockPost.mockRejectedValueOnce({ response: { status: 409 } })
      const user = await openAllFilms()
      yourFilms = [...films, { _id: 'film3', title: 'Aliens', year: 1986 }]

      await user.click(await screen.findByRole('button', { name: 'Add Aliens (1986)' }))
      await screen.findByText('In collection')
      await user.click(screen.getByRole('tab', { name: 'Your films' }))

      expect(await screen.findByText('Aliens')).toBeInTheDocument()
    })

    it('should treat a film that already exists as in the collection', async () => {
      mockApi([tmdbFilm()])
      mockPost.mockRejectedValueOnce({ response: { status: 409 } })
      const user = await openAllFilms()

      await user.click(await screen.findByRole('button', { name: 'Add Alien (1979)' }))

      expect(await screen.findByText('In collection')).toBeInTheDocument()
      expect(screen.queryByText('Could not add')).not.toBeInTheDocument()
    })

    it('should show an error on the row and keep Add when adding fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockApi([tmdbFilm()])
      mockPost.mockRejectedValueOnce({ response: { status: 502 } })
      const user = await openAllFilms()

      await user.click(await screen.findByRole('button', { name: 'Add Alien (1979)' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not add')
      expect(screen.getByRole('button', { name: 'Add Alien (1979)' })).toBeEnabled()
      consoleError.mockRestore()
    })

    it('should disable Add while the film is being added', async () => {
      mockApi([tmdbFilm()])
      const pending = deferred()
      mockPost.mockReturnValueOnce(pending.promise)
      const user = await openAllFilms()

      await user.click(await screen.findByRole('button', { name: 'Add Alien (1979)' }))

      expect(screen.getByRole('button', { name: 'Adding... Alien (1979)' })).toBeDisabled()
      await act(async () => pending.resolve({}))
    })

    // Stands in for the parent page, which owns `isOpen` and closes the modal from `onClose`
    const ModalOnPage = ({ onFilmsAdded }: { onFilmsAdded: () => void }) => {
      const [isOpen, setIsOpen] = useState(true)
      return (
        <>
          <button onClick={() => setIsOpen(true)}>Open person</button>
          <PersonFilmsModal
            person={person}
            kind="actor"
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onFilmsAdded={onFilmsAdded}
          />
        </>
      )
    }

    const addAlienOnPage = async (onFilmsAdded: () => void) => {
      const user = userEvent.setup()
      const utils = render(<ModalOnPage onFilmsAdded={onFilmsAdded} />)
      await screen.findByText('Galaxy Quest')
      await user.click(screen.getByRole('tab', { name: 'All films' }))
      await user.click(await screen.findByRole('button', { name: 'Add Alien (1979)' }))
      return { user, ...utils }
    }

    it('should tell the page behind that films were added once it closes, and only once', async () => {
      mockApi([tmdbFilm()])
      const onFilmsAdded = jest.fn()
      const { user } = await addAlienOnPage(onFilmsAdded)
      await screen.findByText('In collection')

      expect(onFilmsAdded).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)

      await user.click(screen.getByRole('button', { name: 'Open person' }))
      await user.click(await screen.findByRole('button', { name: 'Close' }))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)
    })

    it('should tell the page behind when closed by clicking the backdrop', async () => {
      mockApi([tmdbFilm()])
      const onFilmsAdded = jest.fn()
      const { user, container } = await addAlienOnPage(onFilmsAdded)
      await screen.findByText('In collection')

      await user.click(container.querySelector('.fixed.inset-0')!)

      expect(onFilmsAdded).toHaveBeenCalledTimes(1)
    })

    it('should tell the page behind when an add finishes after the modal closed', async () => {
      mockApi([tmdbFilm()])
      const pending = deferred()
      mockPost.mockReturnValueOnce(pending.promise)
      const onFilmsAdded = jest.fn()
      const { user } = await addAlienOnPage(onFilmsAdded)

      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(onFilmsAdded).not.toHaveBeenCalled()
      await act(async () => pending.resolve({}))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)

      await user.click(screen.getByRole('button', { name: 'Open person' }))
      await user.click(await screen.findByRole('button', { name: 'Close' }))
      expect(onFilmsAdded).toHaveBeenCalledTimes(1)
    })

    it('should not tell the page behind about a film that already existed', async () => {
      mockApi([tmdbFilm()])
      mockPost.mockRejectedValueOnce({ response: { status: 409 } })
      const onFilmsAdded = jest.fn()
      const { user } = await addAlienOnPage(onFilmsAdded)
      await screen.findByText('In collection')

      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(onFilmsAdded).not.toHaveBeenCalled()
    })

    it('should offer to try again when TMDb fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockApi(new Error('TMDb down'))
      const user = await openAllFilms()
      await screen.findByText('Failed to load films from TMDb')

      mockApi([tmdbFilm()])
      await user.click(screen.getByRole('button', { name: 'Try again' }))

      expect(await screen.findByRole('link', { name: 'Alien' })).toBeInTheDocument()
      expect(tmdbCalls()).toHaveLength(2)
      consoleError.mockRestore()
    })

    it('should name the Add button without a year when TMDb has no date', async () => {
      mockApi([tmdbFilm({ year: null })])

      await openAllFilms()

      expect(await screen.findByRole('button', { name: 'Add Alien' })).toBeInTheDocument()
    })

    it('should announce when TMDb fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockApi(new Error('TMDb down'))

      await openAllFilms()

      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load films from TMDb')
      consoleError.mockRestore()
    })

    it('should not fetch again when All films is clicked while it is loading', async () => {
      const pending = deferred()
      mockAxiosGet.mockImplementation((url: string) =>
        url === API_ENDPOINTS.tmdbPersonFilms('123')
          ? pending.promise
          : Promise.resolve({ data: { data: { ...person, films } } })
      )
      const user = await openAllFilms()

      await user.click(screen.getByRole('tab', { name: 'Your films' }))
      await user.click(screen.getByRole('tab', { name: 'All films' }))

      expect(screen.getByText('Loading films...')).toBeInTheDocument()
      expect(tmdbCalls()).toHaveLength(1)
      await act(async () => pending.resolve({ data: { data: [tmdbFilm()] } }))
      expect(await screen.findByRole('link', { name: 'Alien' })).toBeInTheDocument()
    })

    it("should keep a late TMDb response with its own person after switching", async () => {
      const firstPerson = deferred()
      mockAxiosGet.mockImplementation((url: string) => {
        if (url === API_ENDPOINTS.tmdbPersonFilms('123')) return firstPerson.promise
        if (url === API_ENDPOINTS.tmdbPersonFilms('456')) {
          return Promise.resolve({ data: { data: [tmdbFilm({ tmdbId: '11', title: 'Twister' })] } })
        }
        return Promise.resolve({ data: { data: { ...person, films } } })
      })
      const user = userEvent.setup()
      const { rerender } = render(renderModal(person))
      await screen.findByText('Galaxy Quest')
      await user.click(screen.getByRole('tab', { name: 'All films' }))

      rerender(renderModal(otherPerson))
      await act(async () => firstPerson.resolve({ data: { data: [tmdbFilm()] } }))
      await user.click(screen.getByRole('tab', { name: 'All films' }))

      expect(await screen.findByRole('link', { name: 'Twister' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Alien' })).not.toBeInTheDocument()

      rerender(renderModal(person))
      await user.click(screen.getByRole('tab', { name: 'All films' }))
      expect(await screen.findByRole('link', { name: 'Alien' })).toBeInTheDocument()
      expect(tmdbCalls()).toHaveLength(1)
    })

    it('should mark a film added for one person as in the collection after switching', async () => {
      mockApi([tmdbFilm()])
      const pending = deferred()
      mockPost.mockReturnValueOnce(pending.promise)
      const user = userEvent.setup()
      const { rerender } = render(renderModal(person))
      await screen.findByText('Galaxy Quest')
      await user.click(screen.getByRole('tab', { name: 'All films' }))
      await user.click(await screen.findByRole('button', { name: 'Add Alien (1979)' }))

      rerender(renderModal(otherPerson))
      await act(async () => pending.resolve({}))
      rerender(renderModal(person))

      expect(await screen.findByText('In collection')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument()
    })

    it('should say when TMDb has no films for the person', async () => {
      mockApi([])

      await openAllFilms()

      expect(await screen.findByText('No films found on TMDb')).toBeInTheDocument()
    })

    it('should go back to "Your films" when reopened', async () => {
      mockApi([tmdbFilm()])
      const user = userEvent.setup()
      const { rerender } = render(renderModal(person))
      await screen.findByText('Galaxy Quest')
      await user.click(screen.getByRole('tab', { name: 'All films' }))
      await screen.findByRole('link', { name: 'Alien' })

      rerender(renderModal(person, false))
      rerender(renderModal(person))

      expect(screen.getByRole('tab', { name: 'Your films' })).toHaveAttribute('aria-selected', 'true')
      expect(await screen.findByText('Galaxy Quest')).toBeInTheDocument()
    })

    describe('IMDb ratings', () => {
      const aliens = (overrides: Partial<TmdbPersonFilm> = {}) =>
        tmdbFilm({ tmdbId: '679', title: 'Aliens', year: 1986, ...overrides })

      const imdbResponse = (ratings: Record<string, ImdbRating | null>) => ({ data: { data: ratings } })

      const rated = (imdbId: string, imdbRating: number, imdbVotes: number): ImdbRating => ({
        imdbId,
        imdbRating,
        imdbVotes,
      })

      const ratingRequests = () => mockClientGet.mock.calls.map(([, config]) => config.params.tmdbIds)

      const imdbCell = (title: string) =>
        cellInColumn(screen.getByRole('link', { name: title }).closest('tr')!, 'IMDb')

      const wellRatedResponse = (tmdbIds: string[]) =>
        imdbResponse(Object.fromEntries(tmdbIds.map((tmdbId) => [tmdbId, rated(`tt${tmdbId}`, 7, 5000)])))

      const manyFilms = (count: number) =>
        Array.from({ length: count }, (_, i) => tmdbFilm({ tmdbId: String(i + 1), title: `Film ${i + 1}` }))


      it('should request the ratings for the whole filmography through the signed-in client', async () => {
        mockApi([tmdbFilm(), aliens()])

        await openAllFilms()

        await screen.findByRole('link', { name: 'Alien' })
        expect(mockClientGet).toHaveBeenCalledWith(API_ENDPOINTS.imdbRatings, {
          params: { tmdbIds: '348,679' },
          timeout: 35000,
        })
      })

      it('should show the rating linked to IMDb, with its vote count', async () => {
        mockApi([tmdbFilm()])
        mockClientGet.mockResolvedValueOnce(imdbResponse({ '348': rated('tt0078748', 8.5, 950000) }))

        await openAllFilms()

        const link = await screen.findByRole('link', { name: '8.5 on IMDb for Alien (1979)' })
        expect(link).toHaveAttribute('href', 'https://www.imdb.com/title/tt0078748')
        expect(link).toHaveAttribute('target', '_blank')
        expect(within(link.closest('td')!).getByText('950K votes')).toBeInTheDocument()
      })

      it('should show "-" when IMDb has no rating or TMDb has no IMDb ID', async () => {
        mockApi([tmdbFilm(), aliens()])
        mockClientGet.mockResolvedValueOnce(
          imdbResponse({
            '348': { imdbId: 'tt0078748', imdbRating: null, imdbVotes: null },
            '679': { imdbId: null, imdbRating: null, imdbVotes: null },
          })
        )

        const user = await openAllFilms()
        await user.click(await screen.findByRole('button', { name: /^Show all/ }))

        expect(imdbCell('Alien')).toHaveTextContent(/^-$/)
        expect(imdbCell('Aliens')).toHaveTextContent(/^-$/)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })

      it('should show no films until their ratings arrive', async () => {
        mockApi([tmdbFilm()])
        const pending = deferred()
        mockClientGet.mockReturnValueOnce(pending.promise)

        await openAllFilms()

        await waitFor(() => expect(mockClientGet).toHaveBeenCalled())
        expect(screen.getByText('Loading films...')).toBeInTheDocument()
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
        await act(async () => pending.resolve(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) })))
        expect(screen.getByRole('link', { name: '8.5 on IMDb for Alien (1979)' })).toBeInTheDocument()
      })

      it('should wait for every batch of a long filmography before showing it', async () => {
        const films = manyFilms(150)
        mockApi(films)
        const secondBatch = deferred()
        mockClientGet
          .mockResolvedValueOnce(wellRatedResponse(films.slice(0, 100).map((film) => film.tmdbId)))
          .mockReturnValueOnce(secondBatch.promise)

        await openAllFilms()

        await waitFor(() => expect(ratingRequests()).toHaveLength(2))
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
        await act(async () =>
          secondBatch.resolve(wellRatedResponse(films.slice(100).map((film) => film.tmdbId)))
        )
        expect(screen.getAllByRole('row')).toHaveLength(151)
      })

      it('should hide failed films under one banner that retries only them', async () => {
        const user = userEvent.setup()
        mockApi([tmdbFilm(), aliens()])
        mockClientGet
          .mockResolvedValueOnce(imdbResponse({ '348': null, '679': rated('tt0090605', 8.4, 1000) }))
          .mockResolvedValueOnce(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) }))
        await openAllFilms()

        expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load some IMDb ratings")
        expect(screen.queryByRole('link', { name: 'Alien' })).not.toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /^Retry/ })).toHaveLength(1)

        await user.click(screen.getByRole('button', { name: 'Retry' }))

        expect(await screen.findByRole('link', { name: '8.5 on IMDb for Alien (1979)' })).toBeInTheDocument()
        expect(ratingRequests()).toEqual(['348,679', '348'])
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })

      it('should keep the Retry button focused and inert while retrying, and announce it', async () => {
        const user = userEvent.setup()
        mockApi([tmdbFilm()])
        const retry = deferred()
        mockClientGet
          .mockResolvedValueOnce(imdbResponse({ '348': null }))
          .mockReturnValueOnce(retry.promise)
        await openAllFilms()

        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        const retrying = screen.getByRole('button', { name: 'Retrying...' })
        expect(retrying).toHaveAttribute('aria-disabled', 'true')
        expect(retrying).toHaveFocus()
        expect(screen.getByRole('status')).toHaveTextContent('Retrying IMDb ratings')

        await user.click(retrying)
        expect(mockClientGet).toHaveBeenCalledTimes(2)

        await act(async () => retry.resolve(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) })))
        expect(screen.getByRole('status')).toHaveTextContent('IMDb ratings loaded')
      })

      it('should keep the banner and focus on Retry when a retry fails again', async () => {
        const user = userEvent.setup()
        mockApi([tmdbFilm()])
        mockClientGet
          .mockResolvedValueOnce(imdbResponse({ '348': null }))
          .mockResolvedValueOnce(imdbResponse({ '348': null }))
        await openAllFilms()

        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        const retry = await screen.findByRole('button', { name: 'Retry' })
        expect(retry).not.toHaveAttribute('aria-disabled', 'true')
        expect(retry).toHaveFocus()
        expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load some IMDb ratings")
        expect(screen.getByRole('status')).toHaveTextContent("Some IMDb ratings still couldn't be loaded")
      })

      it('should leave focus alone when the user has moved on before a retry finishes', async () => {
        const user = userEvent.setup()
        mockApi([tmdbFilm()])
        const retry = deferred()
        mockClientGet
          .mockResolvedValueOnce(imdbResponse({ '348': null }))
          .mockReturnValueOnce(retry.promise)
        await openAllFilms()
        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        const yourFilmsTab = screen.getByRole('tab', { name: 'Your films' })
        yourFilmsTab.focus()
        await act(async () => retry.resolve(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) })))

        expect(yourFilmsTab).toHaveFocus()
      })

      it("should not show another person's retry as in progress", async () => {
        const user = userEvent.setup()
        mockAxiosGet.mockImplementation(async (url: string) => {
          if (url === API_ENDPOINTS.tmdbPersonFilms('123')) return { data: { data: [tmdbFilm()] } }
          if (url === API_ENDPOINTS.tmdbPersonFilms('456')) {
            return { data: { data: [tmdbFilm({ tmdbId: '11', title: 'Twister' })] } }
          }
          return { data: { data: { ...person, films } } }
        })
        const retry = deferred()
        mockClientGet
          .mockResolvedValueOnce(imdbResponse({ '348': null }))
          .mockReturnValueOnce(retry.promise)
          .mockResolvedValueOnce(imdbResponse({ '11': null }))
        const { rerender } = render(renderModal(person))
        await screen.findByText('Galaxy Quest')
        await user.click(screen.getByRole('tab', { name: 'All films' }))
        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        rerender(renderModal(otherPerson))
        await user.click(await screen.findByRole('tab', { name: 'All films' }))

        expect(await screen.findByRole('button', { name: 'Retry' })).not.toHaveAttribute('aria-disabled', 'true')
        await act(async () => retry.resolve(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) })))
      })

      it('should move focus to the films once a retry leaves nothing to retry', async () => {
        const user = userEvent.setup()
        mockApi([tmdbFilm()])
        mockClientGet
          .mockResolvedValueOnce(imdbResponse({ '348': null }))
          .mockResolvedValueOnce(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) }))
        await openAllFilms()

        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        await screen.findByRole('link', { name: '8.5 on IMDb for Alien (1979)' })
        expect(screen.getByRole('tabpanel')).toHaveFocus()
      })

      it('should stop at a failed request and leave the rest for the retry', async () => {
        const user = userEvent.setup()
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockApi(manyFilms(150))
        mockClientGet.mockRejectedValueOnce(new Error('502'))

        await openAllFilms()

        expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load some IMDb ratings")
        expect(ratingRequests()).toHaveLength(1)

        await user.click(screen.getByRole('button', { name: 'Retry' }))

        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
        expect(ratingRequests()).toHaveLength(3)
        expect(ratingRequests()[1].split(',')).toHaveLength(100)
        expect(ratingRequests()[2].split(',')).toHaveLength(50)
        consoleError.mockRestore()
      })

      it('should retry only the unfinished batch when a later request fails', async () => {
        const user = userEvent.setup()
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        const films = manyFilms(150)
        mockApi(films)
        mockClientGet
          .mockImplementationOnce(async (_url, config) => wellRatedResponse(config.params.tmdbIds.split(',')))
          .mockRejectedValueOnce(new Error('502'))
        await openAllFilms()

        await screen.findByRole('alert')
        expect(imdbCell('Film 1')).toHaveTextContent('7.0')
        expect(screen.queryByRole('link', { name: 'Film 150' })).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Retry' }))

        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
        expect(ratingRequests()[2].split(',')).toEqual(films.slice(100).map((film) => film.tmdbId))
        consoleError.mockRestore()
      })

      it('should request a long filmography in batches of 100, one after another, each with a fresh token', async () => {
        const films = manyFilms(150)
        mockApi(films)
        const firstBatch = deferred()
        mockClientGet.mockReturnValueOnce(firstBatch.promise)

        await openAllFilms()

        await waitFor(() => expect(ratingRequests()).toHaveLength(1))
        expect(ratingRequests()[0].split(',')).toHaveLength(100)
        const clientsBefore = mockAxiosCreate.mock.calls.length

        await act(async () =>
          firstBatch.resolve(wellRatedResponse(films.slice(0, 100).map((film) => film.tmdbId)))
        )

        expect(ratingRequests()).toHaveLength(2)
        expect(ratingRequests()[1].split(',')).toEqual(films.slice(100).map((film) => film.tmdbId))
        expect(mockAxiosCreate.mock.calls.length).toBe(clientsBefore + 1)
      })

      it('should not request a film again when another person shares it', async () => {
        const user = userEvent.setup()
        mockAxiosGet.mockImplementation(async (url: string) => {
          if (url === API_ENDPOINTS.tmdbPersonFilms('123')) return { data: { data: [tmdbFilm()] } }
          if (url === API_ENDPOINTS.tmdbPersonFilms('456')) {
            return { data: { data: [tmdbFilm(), tmdbFilm({ tmdbId: '11', title: 'Twister' })] } }
          }
          return { data: { data: { ...person, films } } }
        })
        const { rerender } = render(renderModal(person))
        await screen.findByText('Galaxy Quest')
        await user.click(screen.getByRole('tab', { name: 'All films' }))
        await screen.findByRole('link', { name: 'Alien' })

        rerender(renderModal(otherPerson))
        await user.click(await screen.findByRole('tab', { name: 'All films' }))
        await screen.findByRole('link', { name: 'Twister' })

        expect(ratingRequests()).toEqual(['348', '11'])
      })

      it('should not request the ratings again when switching tabs', async () => {
        mockApi([tmdbFilm()])
        mockClientGet.mockResolvedValueOnce(imdbResponse({ '348': rated('tt0078748', 8.5, 1000) }))
        const user = await openAllFilms()
        await screen.findByRole('link', { name: '8.5 on IMDb for Alien (1979)' })

        await user.click(screen.getByRole('tab', { name: 'Your films' }))
        await user.click(screen.getByRole('tab', { name: 'All films' }))

        expect(screen.getByRole('link', { name: '8.5 on IMDb for Alien (1979)' })).toBeInTheDocument()
        expect(mockClientGet).toHaveBeenCalledTimes(1)
      })
    })

    describe('vote filter', () => {
      const ratingWithVotes = (tmdbId: string, imdbVotes: number | null): ImdbRating => ({
        imdbId: imdbVotes === null ? null : `tt${tmdbId}`,
        imdbRating: imdbVotes === null ? null : 7,
        imdbVotes,
      })

      const mockVotes = (votesByTmdbId: Record<string, number | null>) =>
        mockClientGet.mockResolvedValueOnce({
          data: {
            data: Object.fromEntries(
              Object.entries(votesByTmdbId).map(([tmdbId, votes]) => [tmdbId, ratingWithVotes(tmdbId, votes)])
            ),
          },
        })

      const film = (tmdbId: string, title: string, overrides: Partial<TmdbPersonFilm> = {}) =>
        tmdbFilm({ tmdbId, title, ...overrides })

      it('should hide films under 100 IMDb votes and say how many are hidden', async () => {
        mockApi([film('1', 'Ninety Nine'), film('2', 'One Hundred'), film('3', 'Unrated')])
        mockVotes({ '1': 99, '2': 100, '3': null })

        await openAllFilms()

        expect(await screen.findByRole('link', { name: 'One Hundred' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Ninety Nine' })).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Unrated' })).not.toBeInTheDocument()
        expect(screen.getByText(/2 films with fewer than 100 IMDb votes or no rating hidden/)).toBeInTheDocument()
      })

      it('should show the hidden films on request, and hide them again', async () => {
        mockApi([film('1', 'Obscure'), film('2', 'Popular')])
        mockVotes({ '1': 5, '2': 5000 })
        const user = await openAllFilms()

        await user.click(await screen.findByRole('button', { name: /^Show all/ }))

        expect(screen.getByRole('link', { name: 'Obscure' })).toBeInTheDocument()
        expect(screen.getByText(/1 film with fewer than 100 IMDb votes or no rating shown/)).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /^Hide them/ }))

        expect(screen.queryByRole('link', { name: 'Obscure' })).not.toBeInTheDocument()
      })

      it('should always show films in the collection', async () => {
        mockApi([film('1', 'Owned Obscurity', { inCollection: true }), film('2', 'Popular')])
        mockVotes({ '1': 5, '2': 5000 })

        await openAllFilms()

        expect(await screen.findByRole('link', { name: 'Owned Obscurity' })).toBeInTheDocument()
        expect(screen.queryByText(/fewer than 100 IMDb votes/)).not.toBeInTheDocument()
      })

      it('should hide films whose lookup failed until Show all, with the retry banner', async () => {
        mockApi([film('1', 'Unknown'), film('2', 'Popular')])
        mockClientGet.mockResolvedValueOnce({ data: { data: { '1': null, '2': ratingWithVotes('2', 5000) } } })
        const user = await openAllFilms()

        expect(await screen.findByRole('link', { name: 'Popular' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Unknown' })).not.toBeInTheDocument()
        expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load some IMDb ratings")

        await user.click(screen.getByRole('button', { name: /^Show all/ }))

        expect(screen.getByRole('link', { name: 'Unknown' })).toBeInTheDocument()
      })

      it('should show a failed film after a retry only if it has enough votes', async () => {
        mockApi([film('1', 'Obscure'), film('2', 'Popular'), film('3', 'Classic')])
        mockClientGet
          .mockResolvedValueOnce({ data: { data: { '1': null, '2': ratingWithVotes('2', 5000), '3': null } } })
          .mockResolvedValueOnce({
            data: { data: { '1': ratingWithVotes('1', 5), '3': ratingWithVotes('3', 5000) } },
          })
        const user = await openAllFilms()

        await user.click(await screen.findByRole('button', { name: 'Retry' }))

        expect(await screen.findByRole('link', { name: 'Classic' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Obscure' })).not.toBeInTheDocument()
        expect(screen.getByText(/1 film with fewer than 100 IMDb votes or no rating hidden/)).toBeInTheDocument()
      })

      it('should keep a low-vote film added from the modal on screen when hiding again', async () => {
        mockApi([film('1', 'Obscure'), film('2', 'Popular')])
        mockVotes({ '1': 5, '2': 5000 })
        const user = await openAllFilms()
        await user.click(await screen.findByRole('button', { name: /^Show all/ }))

        await user.click(screen.getByRole('button', { name: 'Add Obscure (1979)' }))
        await screen.findByText('In collection')

        expect(screen.queryByRole('button', { name: /^Hide them/ })).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Obscure' })).toBeInTheDocument()
      })

      it('should keep the low-vote films hidden for another person after showing them for one', async () => {
        mockAxiosGet.mockImplementation(async (url: string) => {
          if (url === API_ENDPOINTS.tmdbPersonFilms('123')) {
            return { data: { data: [film('1', 'Obscure'), film('2', 'Popular')] } }
          }
          if (url === API_ENDPOINTS.tmdbPersonFilms('456')) {
            return { data: { data: [film('3', 'Also Obscure'), film('4', 'Twister')] } }
          }
          return { data: { data: { ...person, films } } }
        })
        mockVotes({ '1': 5, '2': 5000 })
        mockVotes({ '3': 5, '4': 5000 })
        const user = userEvent.setup()
        const { rerender } = render(renderModal(person))
        await screen.findByText('Galaxy Quest')
        await user.click(screen.getByRole('tab', { name: 'All films' }))
        await user.click(await screen.findByRole('button', { name: /^Show all/ }))

        rerender(renderModal(otherPerson))
        await user.click(await screen.findByRole('tab', { name: 'All films' }))

        expect(await screen.findByRole('link', { name: 'Twister' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Also Obscure' })).not.toBeInTheDocument()
      })

      it("should wait for a shared film's rating from another person's load before showing", async () => {
        mockAxiosGet.mockImplementation(async (url: string) => {
          if (url === API_ENDPOINTS.tmdbPersonFilms('123')) return { data: { data: [film('348', 'Alien')] } }
          if (url === API_ENDPOINTS.tmdbPersonFilms('456')) {
            return { data: { data: [film('348', 'Alien'), film('11', 'Twister')] } }
          }
          return { data: { data: { ...person, films } } }
        })
        const firstLoad = deferred()
        mockClientGet.mockReturnValueOnce(firstLoad.promise)
        mockVotes({ '11': 5000 })
        const user = userEvent.setup()
        const { rerender } = render(renderModal(person))
        await screen.findByText('Galaxy Quest')
        await user.click(screen.getByRole('tab', { name: 'All films' }))
        await waitFor(() => expect(mockClientGet).toHaveBeenCalledTimes(1))

        rerender(renderModal(person, false))
        rerender(renderModal(otherPerson))
        await user.click(await screen.findByRole('tab', { name: 'All films' }))
        await waitFor(() => expect(mockClientGet).toHaveBeenCalledTimes(2))

        expect(screen.getByText('Loading films...')).toBeInTheDocument()
        expect(mockClientGet.mock.calls[1][1].params.tmdbIds).toBe('11')

        await act(async () => firstLoad.resolve({ data: { data: { '348': ratingWithVotes('348', 5) } } }))

        expect(await screen.findByRole('link', { name: 'Twister' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Alien' })).not.toBeInTheDocument()
      })

      it('should explain an empty list when every film is hidden', async () => {
        mockApi([film('1', 'Obscure'), film('2', 'Also Obscure')])
        mockVotes({ '1': 5, '2': null })
        const user = await openAllFilms()

        expect(await screen.findByText(/No films with 100 or more IMDb votes/)).toBeInTheDocument()
        expect(screen.queryByRole('table')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: /^Show all/ }))

        expect(screen.getByRole('link', { name: 'Obscure' })).toBeInTheDocument()
      })

      it('should hide the low-vote films again when the modal is reopened', async () => {
        mockApi([film('1', 'Obscure'), film('2', 'Popular')])
        mockVotes({ '1': 5, '2': 5000 })
        const user = userEvent.setup()
        const { rerender } = render(renderModal(person))
        await screen.findByText('Galaxy Quest')
        await user.click(screen.getByRole('tab', { name: 'All films' }))
        await user.click(await screen.findByRole('button', { name: /^Show all/ }))

        rerender(renderModal(person, false))
        rerender(renderModal(person))
        await user.click(await screen.findByRole('tab', { name: 'All films' }))

        expect(await screen.findByRole('link', { name: 'Popular' })).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Obscure' })).not.toBeInTheDocument()
      })
    })
  })
})
