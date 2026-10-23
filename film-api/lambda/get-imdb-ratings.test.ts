import axios from "axios"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  get: jest.fn(),
}))
jest.mock("./mongodb")
jest.mock("./utils")
jest.mock("./auth", () => ({
  requireAuth:
    (handler: (event: any, userId: string) => Promise<any>) => (event: any) =>
      handler(event, "user1"),
}))

// The handler reads the keys when the module loads, so they must be set before requiring it.
process.env.TMDB_API_KEY = "tmdb-key"
process.env.OMDB_API_KEY = "omdb-key"
const { handler, CONCURRENT_LOOKUPS, LOOKUP_BUDGET_MS, MAX_FILMS_PER_REQUEST } =
  require("./get-imdb-ratings") as typeof import("./get-imdb-ratings")

const mockAxiosGet = axios.get as jest.Mock
const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockFindStoredImdbIds = mongodb.findStoredImdbIds as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const TMDB_EXTERNAL_IDS = /\/movie\/(\d+)\/external_ids$/
const OMDB_URL = "https://www.omdbapi.com/"

const ratingsEvent = (tmdbIds?: string) => ({
  queryStringParameters: tmdbIds === undefined ? null : { tmdbIds },
})

const responseBody = (result: any) => JSON.parse(result.body)

const ids = (count: number) => Array.from({ length: count }, (_, i) => String(i + 1))

const httpError = (status: number, data: unknown = {}) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  })

const found = (rating = "7.0", votes = "10") => ({ Response: "True", imdbRating: rating, imdbVotes: votes })

// TMDb answers with `imdbIdsByTmdbId`, and OMDb with `omdbByImdbId`; an Error makes that call fail.
const mockApis = (
  imdbIdsByTmdbId: Record<string, string | null | Error>,
  omdbByImdbId: Record<string, Record<string, string> | Error>,
) => {
  mockAxiosGet.mockImplementation(async (url: string, config: any) => {
    const tmdbMatch = url.match(TMDB_EXTERNAL_IDS)
    if (tmdbMatch) {
      const imdbId = imdbIdsByTmdbId[tmdbMatch[1]]
      if (imdbId instanceof Error) throw imdbId
      return { data: { imdb_id: imdbId } }
    }
    if (url === OMDB_URL) {
      const title = omdbByImdbId[config.params.i]
      if (title instanceof Error) throw title
      return { data: title }
    }
    throw new Error(`Unexpected URL ${url}`)
  })
}

const omdbCalls = () => mockAxiosGet.mock.calls.filter(([url]) => url === OMDB_URL)
const tmdbCalls = () => mockAxiosGet.mock.calls.filter(([url]) => TMDB_EXTERNAL_IDS.test(url))
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("get-imdb-ratings handler", () => {
  let clock: number
  let nowSpy: jest.SpyInstance | undefined

  // A clock tests can move, so the time budget can be reached without waiting
  const useClock = () => {
    clock = 0
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => clock)
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
    mockFindStoredImdbIds.mockResolvedValue(new Map())
  })

  afterEach(() => {
    nowSpy?.mockRestore()
    nowSpy = undefined
  })

  it("should look up each film's IMDb ID on TMDb and its rating on OMDb", async () => {
    mockApis({ "348": "tt0078748" }, { tt0078748: found("8.5", "1,012,345") })

    const result = await handler(ratingsEvent("348"))

    expect(result.statusCode).toBe(200)
    expect(responseBody(result)).toEqual({
      data: { "348": { imdbId: "tt0078748", imdbRating: 8.5, imdbVotes: 1012345 } },
    })
    expect(mockAxiosGet).toHaveBeenCalledWith("https://api.themoviedb.org/3/movie/348/external_ids", {
      params: { api_key: "tmdb-key" },
      signal: expect.any(AbortSignal),
    })
    expect(mockAxiosGet).toHaveBeenCalledWith(OMDB_URL, {
      params: { i: "tt0078748", apikey: "omdb-key" },
      signal: expect.any(AbortSignal),
    })
  })

  it("should use the IMDb ID stored for films in the collection instead of asking TMDb", async () => {
    mockFindStoredImdbIds.mockResolvedValueOnce(new Map([["348", "tt0078748"]]))
    mockApis({ "679": "tt0090605" }, { tt0078748: found("8.5"), tt0090605: found("8.4") })

    const result = await handler(ratingsEvent("348,679"))

    expect(mockFindStoredImdbIds).toHaveBeenCalledWith(["348", "679"])
    expect(tmdbCalls().map(([url]) => url)).toEqual([
      "https://api.themoviedb.org/3/movie/679/external_ids",
    ])
    expect(responseBody(result).data["348"]).toEqual({ imdbId: "tt0078748", imdbRating: 8.5, imdbVotes: 10 })
  })

  it.each([
    ["has no IMDb ID", { "1": null }],
    ["doesn't know the film", { "1": httpError(404) }],
  ])("should return empty figures without calling OMDb when TMDb %s", async (_case, imdbIds) => {
    mockApis(imdbIds, {})

    const result = await handler(ratingsEvent("1"))

    expect(responseBody(result).data["1"]).toEqual({ imdbId: null, imdbRating: null, imdbVotes: null })
    expect(omdbCalls()).toHaveLength(0)
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it.each([
    ["has no figures", { Response: "True", imdbRating: "N/A", imdbVotes: "N/A" }],
    ["says the ID is incorrect", { Response: "False", Error: "Incorrect IMDb ID." }],
    ["says the title is not found", { Response: "False", Error: "Movie not found!" }],
  ])("should return empty figures when OMDb %s", async (_case, omdbTitle) => {
    mockApis({ "1": "tt0000001" }, { tt0000001: omdbTitle })

    const result = await handler(ratingsEvent("1"))

    expect(responseBody(result).data["1"]).toEqual({ imdbId: "tt0000001", imdbRating: null, imdbVotes: null })
  })

  it("should count any other OMDb error as that film's lookup failing", async () => {
    mockApis({ "1": "tt0000001" }, { tt0000001: { Response: "False", Error: "Something went wrong." } })

    const result = await handler(ratingsEvent("1"))

    expect(responseBody(result).data["1"]).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("Something went wrong."))
  })

  it("should return null for a film whose lookup fails, and the rest as usual", async () => {
    mockApis(
      { "1": new Error("TMDb down"), "2": "tt0000002", "3": "tt0000003" },
      { tt0000002: new Error("OMDb down"), tt0000003: found() },
    )

    const result = await handler(ratingsEvent("1,2,3"))

    expect(result.statusCode).toBe(200)
    expect(responseBody(result).data).toEqual({
      "1": null,
      "2": null,
      "3": { imdbId: "tt0000003", imdbRating: 7, imdbVotes: 10 },
    })
    expect(mockLogger.warn).toHaveBeenCalledTimes(2)
  })

  it("should return 502 and start no more lookups when OMDb rejects the key", async () => {
    const rejected = httpError(401, { Response: "False", Error: "Invalid API key!" })
    mockApis(
      Object.fromEntries(ids(25).map((id) => [id, `tt${id}`])),
      Object.fromEntries(ids(25).map((id) => [`tt${id}`, rejected])),
    )

    const result = await handler(ratingsEvent(ids(25).join(",")))
    await nextTick()

    expect(result.statusCode).toBe(502)
    expect(responseBody(result)).toEqual({ message: "Could not fetch IMDb ratings" })
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("Invalid API key!"))
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(tmdbCalls()).toHaveLength(CONCURRENT_LOOKUPS)
  })

  it("should look up each film once when an ID is repeated", async () => {
    mockApis({ "1": "tt0000001" }, { tt0000001: found() })

    const result = await handler(ratingsEvent("1,1"))

    expect(tmdbCalls()).toHaveLength(1)
    expect(Object.keys(responseBody(result).data)).toEqual(["1"])
  })

  it(`should never have more than ${CONCURRENT_LOOKUPS} lookups in flight`, async () => {
    let inFlight = 0
    let mostInFlight = 0
    mockAxiosGet.mockImplementation(async (url: string) => {
      inFlight++
      mostInFlight = Math.max(mostInFlight, inFlight)
      await nextTick()
      inFlight--
      return url === OMDB_URL ? { data: found() } : { data: { imdb_id: "tt0000001" } }
    })

    const result = await handler(ratingsEvent(ids(25).join(",")))

    expect(Object.keys(responseBody(result).data)).toHaveLength(25)
    expect(mostInFlight).toBe(CONCURRENT_LOOKUPS)
  })

  it("should finish lookups already started, and return null for films not started in time", async () => {
    useClock()
    const tmdbIds = ids(CONCURRENT_LOOKUPS + 2)
    mockFindStoredImdbIds.mockResolvedValueOnce(new Map(tmdbIds.map((id) => [id, `tt${id}`])))
    mockAxiosGet.mockImplementation(async () => {
      await nextTick()
      clock = LOOKUP_BUDGET_MS + 1
      return { data: found() }
    })

    const result = await handler(ratingsEvent(tmdbIds.join(",")))

    const data = responseBody(result).data
    expect(tmdbIds.slice(0, CONCURRENT_LOOKUPS).every((id) => data[id] !== null)).toBe(true)
    expect(tmdbIds.slice(CONCURRENT_LOOKUPS).map((id) => data[id])).toEqual([null, null])
    expect(omdbCalls()).toHaveLength(CONCURRENT_LOOKUPS)
  })

  it("should not ask OMDb once the budget runs out between the TMDb and OMDb steps", async () => {
    useClock()
    mockAxiosGet.mockImplementation(async () => {
      clock = LOOKUP_BUDGET_MS + 1
      return { data: { imdb_id: "tt0000001" } }
    })

    const result = await handler(ratingsEvent("1"))

    expect(responseBody(result).data).toEqual({ "1": null })
    expect(tmdbCalls()).toHaveLength(1)
    expect(omdbCalls()).toHaveLength(0)
  })

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["not numeric", "348,abc"],
    ["a path", "348/external_ids"],
    ["zero-padded", "07"],
    ["longer than ten digits", "12345678901"],
    ["over the limit", ids(MAX_FILMS_PER_REQUEST + 1).join(",")],
  ])("should return 400 when the IDs are %s", async (_case, tmdbIds) => {
    const result = await handler(ratingsEvent(tmdbIds))

    expect(result.statusCode).toBe(400)
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it("should accept exactly the maximum number of IDs", async () => {
    mockAxiosGet.mockResolvedValue({ data: { imdb_id: null } })

    const result = await handler(ratingsEvent(ids(MAX_FILMS_PER_REQUEST).join(",")))

    expect(result.statusCode).toBe(200)
  })

  it("should return 502 without the error details when the database fails", async () => {
    mockConnectToDatabase.mockRejectedValueOnce(new Error("connection refused at 10.0.0.1"))

    const result = await handler(ratingsEvent("1"))

    expect(result.statusCode).toBe(502)
    expect(responseBody(result)).toEqual({ message: "Could not fetch IMDb ratings" })
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("connection refused"))
  })
})
