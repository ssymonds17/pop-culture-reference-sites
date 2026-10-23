import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import PersonFilmsModal from './PersonFilmsModal'
import { API_ENDPOINTS } from '@/lib/api'
import { Person, TmdbPersonFilm } from '@/types'

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
      tmdbRating: 8.137,
      tmdbVoteCount: 15000,
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

    beforeEach(() => {
      mockAxiosGet.mockReset()
      mockPost.mockReset()
      mockPost.mockResolvedValue({})
      mockAxiosCreate.mockReturnValue({ post: mockPost })
    })

    const openAllFilms = async (props: { readOnly?: boolean; kind?: 'actor' | 'director' } = {}) => {
      const user = userEvent.setup()
      render(
        <PersonFilmsModal
          person={person}
          kind={props.kind ?? 'actor'}
          isOpen
          onClose={jest.fn()}
          readOnly={props.readOnly}
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

    it('should show each film with its character, TMDb score and TMDb link', async () => {
      mockApi([tmdbFilm()])

      await openAllFilms()

      const link = await screen.findByRole('link', { name: 'Alien' })
      expect(link).toHaveAttribute('href', 'https://www.themoviedb.org/movie/348')
      const row = link.closest('tr')!
      expect(within(row).getByText('as Ellen Ripley')).toBeInTheDocument()
      expect(within(row).getByText('1979')).toBeInTheDocument()
      expect(within(row).getByText('8.1')).toBeInTheDocument()
      expect(within(row).getByText('15K votes')).toBeInTheDocument()
    })

    it('should hide the score when TMDb has no votes and the year when it has no date', async () => {
      mockApi([tmdbFilm({ tmdbRating: 0, tmdbVoteCount: 0, year: null, character: null })])

      await openAllFilms()

      const row = (await screen.findByRole('link', { name: 'Alien' })).closest('tr')!
      expect(within(row).getAllByText('-')).toHaveLength(2)
      expect(within(row).queryByText(/votes?$/)).not.toBeInTheDocument()
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

    it('should not offer Add when read-only', async () => {
      mockApi([tmdbFilm(), tmdbFilm({ tmdbId: '679', title: 'Aliens', inCollection: true })])

      await openAllFilms({ readOnly: true })

      expect(await screen.findByRole('link', { name: 'Alien' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument()
      expect(screen.getByText('In collection')).toBeInTheDocument()
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

      expect(screen.getByText('Loading films from TMDb...')).toBeInTheDocument()
      expect(tmdbCalls()).toHaveLength(1)
      await act(async () => pending.resolve({ data: { data: [tmdbFilm()] } }))
      expect(screen.getByRole('link', { name: 'Alien' })).toBeInTheDocument()
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
  })
})
