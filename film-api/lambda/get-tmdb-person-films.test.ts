import axios from "axios"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  get: jest.fn(),
}))
jest.mock("./mongodb")
jest.mock("./utils")
const mockRequireAuth = jest.fn(
  (handler: (event: any, userId: string) => Promise<any>) => (event: any) => handler(event, "user1"),
)
jest.mock("./auth", () => ({
  requireAuth: (handler: (event: any, userId: string) => Promise<any>) => mockRequireAuth(handler),
}))

// The handler reads the keys when the module loads, so they must be set before requiring it.
process.env.TMDB_API_KEY = "tmdb-key"
process.env.OMDB_API_KEY = "omdb-key"
const { handler, CONCURRENT_LOOKUPS, LOOKUP_BUDGET_MS, MIN_IMDB_VOTES } =
  require("./get-tmdb-person-films") as typeof import("./get-tmdb-person-films")
// Captured at load, as the clearAllMocks in beforeEach would wipe it
const wrappedInRequireAuth = mockRequireAuth.mock.calls.length > 0

const mockAxiosGet = axios.get as jest.Mock
const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockFindCollectedTmdbIds = mongodb.findCollectedTmdbIds as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const PERSON_URL = "https://api.themoviedb.org/3/person/287"
const FILM_DETAILS = /\/movie\/(\d+)$/
const OMDB_URL = "https://www.omdbapi.com/"

const personEvent = (kind?: string) => ({
  pathParameters: { tmdbPersonId: "287" },
  queryStringParameters: kind === undefined ? null : { kind },
})

// Dated 2001 to 2025, all released. Includes TMDb's own vote fields, which the handler ignores.
const credit = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Film ${id}`,
  release_date: `20${String(id).padStart(2, "0")}-01-01`,
  vote_average: 7.5,
  vote_count: 100,
  ...overrides,
})

const tmdbPerson = (cast: unknown[] = [], crew: unknown[] = []) => ({
  id: 287,
  name: "Brad Pitt",
  movie_credits: { cast, crew },
})

const httpError = (status: number, data: unknown = {}) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  })

const omdbTitle = (imdbRating = "7.0", imdbVotes = "5,000") => ({
  Response: "True",
  imdbRating,
  imdbVotes,
})

type Details = { status?: string; imdbId?: string | null } | Error
type OmdbAnswer = Record<string, string> | Error

// By default every film is "Released" with IMDb ID tt<id>, and OMDb rates it 7.0 from 5,000 votes.
const mockApis = (
  person: unknown,
  { details = {}, omdb = {} }: { details?: Record<string, Details>; omdb?: Record<string, OmdbAnswer> } = {},
) => {
  mockAxiosGet.mockImplementation(async (url: string, config: any) => {
    if (url === PERSON_URL) return { data: person }
    const detailsMatch = url.match(FILM_DETAILS)
    if (detailsMatch) {
      const tmdbId = detailsMatch[1]
      const film = details[tmdbId] ?? {}
      if (film instanceof Error) throw film
      const imdbId = film.imdbId === undefined ? `tt${tmdbId}` : film.imdbId
      return { data: { status: film.status ?? "Released", external_ids: { imdb_id: imdbId } } }
    }
    if (url === OMDB_URL) {
      const answer = omdb[config.params.i] ?? omdbTitle()
      if (answer instanceof Error) throw answer
      return { data: answer }
    }
    throw new Error(`Unexpected URL ${url}`)
  })
}

const responseBody = (result: any) => JSON.parse(result.body)
const films = (result: any) => responseBody(result).data.films
const titles = (result: any) => films(result).map((film: any) => film.title)
const callsTo = (matches: (url: string) => boolean) =>
  mockAxiosGet.mock.calls.filter(([url]) => matches(url))
const detailsCalls = () => callsTo((url) => FILM_DETAILS.test(url))
const omdbCalls = () => callsTo((url) => url === OMDB_URL)
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("get-tmdb-person-films handler", () => {
  let nowSpy: jest.SpyInstance | undefined

  // A clock tests can move, so the time budget can be reached without waiting
  const useClock = () => {
    const clock = { now: 0 }
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => clock.now)
    return clock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAxiosGet.mockReset()
    mockLogger.error = jest.fn()
    mockLogger.warn = jest.fn()
    mockLogger.info = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
    mockFindCollectedTmdbIds.mockResolvedValue(new Set())
  })

  afterEach(() => {
    nowSpy?.mockRestore()
    nowSpy = undefined
  })

  it("should require a sign-in, as it spends OMDb requests", () => {
    expect(wrappedInRequireAuth).toBe(true)
  })

  it("should request the person with their film credits from TMDb", async () => {
    mockApis(tmdbPerson())

    await handler(personEvent("actor"))

    expect(mockAxiosGet).toHaveBeenCalledWith(PERSON_URL, {
      params: { api_key: "tmdb-key", append_to_response: "movie_credits" },
      signal: expect.any(AbortSignal),
    })
  })

  it("should look up each film's status and IMDb ID in one TMDb call, then its rating on OMDb", async () => {
    mockApis(tmdbPerson([credit(1, { character: "Tyler Durden" })]), {
      omdb: { tt1: omdbTitle("8.8", "2,400,000") },
    })

    const result = await handler(personEvent("actor"))

    expect(result.statusCode).toBe(200)
    expect(responseBody(result).data).toEqual({
      films: [
        {
          tmdbId: "1",
          title: "Film 1",
          year: 2001,
          character: "Tyler Durden",
          imdbId: "tt1",
          imdbRating: 8.8,
          imdbVotes: 2400000,
        },
      ],
      hiddenCount: 0,
    })
    expect(mockAxiosGet).toHaveBeenCalledWith("https://api.themoviedb.org/3/movie/1", {
      params: { api_key: "tmdb-key", append_to_response: "external_ids" },
      signal: expect.any(AbortSignal),
    })
    expect(mockAxiosGet).toHaveBeenCalledWith(OMDB_URL, {
      params: { i: "tt1", apikey: "omdb-key" },
      signal: expect.any(AbortSignal),
    })
  })

  describe("filmography", () => {
    it("should leave out uncredited roles without counting them as hidden", async () => {
      mockApis(tmdbPerson([credit(1, { character: "Lead" }), credit(2, { character: "Himself (uncredited)" })]))

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 1"])
      expect(responseBody(result).data.hiddenCount).toBe(0)
    })

    it("should return only the films a director directed, without characters", async () => {
      mockApis(
        tmdbPerson([credit(9, { character: "Cameo" })], [credit(1, { job: "Director" }), credit(2, { job: "Producer" })]),
      )

      const result = await handler(personEvent("director"))

      expect(titles(result)).toEqual(["Film 1"])
      expect(films(result)[0]).not.toHaveProperty("character")
    })

    it("should list a film once when TMDb credits the director twice", async () => {
      mockApis(tmdbPerson([], [credit(1, { job: "Director" }), credit(1, { job: "Director" })]))

      const result = await handler(personEvent("director"))

      expect(titles(result)).toEqual(["Film 1"])
      expect(detailsCalls()).toHaveLength(1)
    })

    it("should leave out an actor's crew credits, even as director", async () => {
      mockApis(tmdbPerson([credit(1, { character: "Lead" })], [credit(2, { job: "Director" })]))

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 1"])
    })

    it("should list a film once, keeping every character an actor plays in it", async () => {
      mockApis(
        tmdbPerson([
          credit(1, { character: "Mandrake" }),
          credit(1, { character: "President Muffley" }),
          credit(1, { character: "Mandrake" }),
        ]),
      )

      const result = await handler(personEvent("actor"))

      expect(films(result)).toHaveLength(1)
      expect(films(result)[0].character).toBe("Mandrake / President Muffley")
      expect(detailsCalls()).toHaveLength(1)
    })

    it("should give a null character when TMDb has no character name", async () => {
      mockApis(tmdbPerson([credit(1, { character: "" })]))

      const result = await handler(personEvent("actor"))

      expect(films(result)[0].character).toBeNull()
    })

    it("should sort newest first, then by title", async () => {
      mockApis(
        tmdbPerson([
          credit(2, { title: "Old", release_date: "1990-05-01" }),
          credit(4, { title: "New B", release_date: "2020-01-01" }),
          credit(5, { title: "New A", release_date: "2020-01-01" }),
        ]),
      )

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["New A", "New B", "Old"])
    })

    it("should return an empty list when TMDb has no credits", async () => {
      mockApis({ id: 287 })

      const result = await handler(personEvent("actor"))

      expect(responseBody(result).data).toEqual({ films: [], hiddenCount: 0 })
    })
  })

  describe("filtering", () => {
    it("should leave out undated and future films without looking them up", async () => {
      mockApis(
        tmdbPerson([
          credit(1),
          credit(2, { release_date: "" }),
          credit(3, { release_date: undefined }),
          credit(4, { release_date: "2999-01-01" }),
        ]),
      )

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 1"])
      expect(responseBody(result).data.hiddenCount).toBe(3)
      expect(detailsCalls().map(([url]) => url)).toEqual(["https://api.themoviedb.org/3/movie/1"])
    })

    it("should count a film released today as released", async () => {
      const today = new Date().toISOString().slice(0, 10)
      mockApis(tmdbPerson([credit(1, { release_date: today })]))

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 1"])
    })

    it.each([
      ["isn't released on TMDb", { status: "Post Production" }],
      ["has no IMDb ID", { imdbId: null }],
      ["is unknown to TMDb", httpError(404)],
    ])("should leave out a film that %s, without asking OMDb", async (_case, details) => {
      mockApis(tmdbPerson([credit(1), credit(2)]), { details: { "2": details as Details } })

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 1"])
      expect(responseBody(result).data.hiddenCount).toBe(1)
      expect(omdbCalls().map(([, config]) => config.params.i)).toEqual(["tt1"])
    })

    it.each([
      ["has no rating", { Response: "True", imdbRating: "N/A", imdbVotes: "N/A" }],
      ["doesn't know the IMDb ID", { Response: "False", Error: "Incorrect IMDb ID." }],
      ["can't find the title", { Response: "False", Error: "Movie not found!" }],
      ["has too few votes", omdbTitle("7.0", String(MIN_IMDB_VOTES - 1))],
      ["has a rating but no vote count", omdbTitle("7.0", "N/A")],
      ["fails the lookup", new Error("OMDb down")],
      ["gives any other error", { Response: "False", Error: "Something went wrong." }],
    ])("should leave out a film when OMDb %s", async (_case, answer) => {
      mockApis(tmdbPerson([credit(1), credit(2)]), { omdb: { tt2: answer } })

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 1"])
      expect(responseBody(result).data.hiddenCount).toBe(1)
    })

    it(`should keep a film with exactly ${MIN_IMDB_VOTES} votes`, async () => {
      mockApis(tmdbPerson([credit(1)]), { omdb: { tt1: omdbTitle("6.0", String(MIN_IMDB_VOTES)) } })

      const result = await handler(personEvent("actor"))

      expect(films(result)[0]).toMatchObject({ imdbRating: 6, imdbVotes: MIN_IMDB_VOTES })
    })

    it("should log a lookup that failed", async () => {
      mockApis(tmdbPerson([credit(1), credit(2)]), { details: { "1": new Error("TMDb down") } })

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 2"])
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("TMDb down"))
    })

    it("should return 502 when every lookup fails, rather than an empty list", async () => {
      const down = new Error("TMDb down")
      mockApis(tmdbPerson([credit(1), credit(2)]), { details: { "1": down, "2": down } })

      const result = await handler(personEvent("actor"))

      expect(result.statusCode).toBe(502)
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("Every film lookup failed"))
    })

    it("should return an empty list when the films that didn't fail were hidden", async () => {
      mockApis(tmdbPerson([credit(1), credit(2)]), {
        details: { "1": new Error("TMDb down"), "2": { status: "Post Production" } },
      })

      const result = await handler(personEvent("actor"))

      expect(responseBody(result).data).toEqual({ films: [], hiddenCount: 2 })
    })
  })

  describe("collection films", () => {
    it("should leave out collection films without looking them up or counting them as hidden", async () => {
      mockFindCollectedTmdbIds.mockResolvedValueOnce(new Set(["1", "3"]))
      mockApis(tmdbPerson([credit(1), credit(2), credit(3, { release_date: "" })]))

      const result = await handler(personEvent("actor"))

      expect(titles(result)).toEqual(["Film 2"])
      expect(responseBody(result).data.hiddenCount).toBe(0)
      expect(mockFindCollectedTmdbIds).toHaveBeenCalledWith(["1", "2", "3"])
      expect(detailsCalls().map(([url]) => url)).toEqual(["https://api.themoviedb.org/3/movie/2"])
      expect(omdbCalls()).toHaveLength(1)
    })
  })

  describe("limits", () => {
    it(`should never have more than ${CONCURRENT_LOOKUPS} lookups in flight`, async () => {
      const cast = Array.from({ length: 25 }, (_, i) => credit(i + 1))
      let inFlight = 0
      let mostInFlight = 0
      mockAxiosGet.mockImplementation(async (url: string) => {
        if (url === PERSON_URL) return { data: tmdbPerson(cast) }
        inFlight++
        mostInFlight = Math.max(mostInFlight, inFlight)
        await nextTick()
        inFlight--
        return url === OMDB_URL
          ? { data: omdbTitle() }
          : { data: { status: "Released", external_ids: { imdb_id: "tt0000001" } } }
      })

      const result = await handler(personEvent("actor"))

      expect(films(result)).toHaveLength(25)
      expect(mostInFlight).toBe(CONCURRENT_LOOKUPS)
    })

    it("should leave out films not looked up in time, and log it", async () => {
      const clock = useClock()
      mockAxiosGet.mockImplementation(async (url: string) => {
        if (url !== PERSON_URL) throw new Error(`Unexpected URL ${url}`)
        clock.now = LOOKUP_BUDGET_MS + 1
        return { data: tmdbPerson([credit(1), credit(2)]) }
      })

      const result = await handler(personEvent("actor"))

      expect(responseBody(result).data).toEqual({ films: [], hiddenCount: 2 })
      expect(mockAxiosGet).toHaveBeenCalledTimes(1)
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("2 films were not looked up"))
    })

    it("should finish lookups already started, and leave out films not started in time", async () => {
      const clock = useClock()
      const cast = Array.from({ length: CONCURRENT_LOOKUPS + 2 }, (_, i) => credit(i + 1))
      mockAxiosGet.mockImplementation(async (url: string) => {
        if (url === PERSON_URL) return { data: tmdbPerson(cast) }
        if (url !== OMDB_URL) return { data: { status: "Released", external_ids: { imdb_id: "tt0000001" } } }
        // Waiting a tick lets every first lookup reach OMDb before the budget is spent
        await nextTick()
        clock.now = LOOKUP_BUDGET_MS + 1
        return { data: omdbTitle() }
      })

      const result = await handler(personEvent("actor"))

      // Newest first, so the two oldest films are the ones left waiting
      expect(titles(result)).toEqual(cast.slice(2).reverse().map((film) => film.title))
      expect(responseBody(result).data.hiddenCount).toBe(2)
      expect(omdbCalls()).toHaveLength(CONCURRENT_LOOKUPS)
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("2 films were not looked up"))
    })

    it("should not ask OMDb once the budget runs out between the TMDb and OMDb steps", async () => {
      const clock = useClock()
      mockAxiosGet.mockImplementation(async (url: string) => {
        if (url === PERSON_URL) return { data: tmdbPerson([credit(1)]) }
        clock.now = LOOKUP_BUDGET_MS + 1
        return { data: { status: "Released", external_ids: { imdb_id: "tt1" } } }
      })

      const result = await handler(personEvent("actor"))

      expect(films(result)).toEqual([])
      expect(omdbCalls()).toHaveLength(0)
    })

    it("should return 502 when the only lookups that ran failed", async () => {
      const clock = useClock()
      mockAxiosGet.mockImplementation(async (url: string) => {
        if (url === PERSON_URL) return { data: tmdbPerson([credit(1), credit(2)]) }
        clock.now = LOOKUP_BUDGET_MS + 1
        if (url.endsWith("/movie/2")) throw new Error("TMDb down")
        return { data: { status: "Released", external_ids: { imdb_id: "tt1" } } }
      })

      const result = await handler(personEvent("actor"))

      expect(result.statusCode).toBe(502)
      expect(omdbCalls()).toHaveLength(0)
    })

    it("should return 502 and start no more lookups when OMDb rejects the key", async () => {
      const cast = Array.from({ length: 25 }, (_, i) => credit(i + 1))
      const rejected = httpError(401, { Response: "False", Error: "Invalid API key!" })
      mockApis(tmdbPerson(cast), { omdb: Object.fromEntries(cast.map((film) => [`tt${film.id}`, rejected])) })

      const result = await handler(personEvent("actor"))
      await nextTick()

      expect(result.statusCode).toBe(502)
      expect(responseBody(result)).toEqual({ message: "Could not fetch TMDB person films" })
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("Invalid API key!"))
      expect(detailsCalls()).toHaveLength(CONCURRENT_LOOKUPS)
    })
  })

  describe("errors", () => {
    it.each([undefined, "producer"])("should return 400 for a kind of %p", async (kind) => {
      const result = await handler(personEvent(kind))

      expect(result.statusCode).toBe(400)
      expect(mockAxiosGet).not.toHaveBeenCalled()
    })

    it.each([undefined, "abc", "287/movie_credits", "-1"])(
      "should return 400 for a TMDb person ID of %p",
      async (tmdbPersonId) => {
        const result = await handler({
          pathParameters: { tmdbPersonId },
          queryStringParameters: { kind: "actor" },
        })

        expect(result.statusCode).toBe(400)
        expect(mockAxiosGet).not.toHaveBeenCalled()
      },
    )

    it("should return 404 when TMDb has no such person", async () => {
      mockAxiosGet.mockRejectedValueOnce(httpError(404))

      const result = await handler(personEvent("actor"))

      expect(result.statusCode).toBe(404)
    })

    it("should return 502 when TMDb fails", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Network error"))

      const result = await handler(personEvent("actor"))

      expect(result.statusCode).toBe(502)
    })

    it("should return 502 without the error details when the collection lookup fails", async () => {
      mockApis(tmdbPerson([credit(1)]))
      mockFindCollectedTmdbIds.mockRejectedValueOnce(new Error("connection refused at 10.0.0.1"))

      const result = await handler(personEvent("actor"))

      expect(result.statusCode).toBe(502)
      expect(responseBody(result)).toEqual({ message: "Could not fetch TMDB person films" })
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("connection refused"))
    })
  })
})
