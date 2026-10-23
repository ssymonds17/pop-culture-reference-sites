import axios from "axios"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  get: jest.fn(),
}))
jest.mock("./mongodb")
jest.mock("./utils")

// The handler reads the key when the module loads, so it must be set before requiring it.
process.env.TMDB_API_KEY = "test-key"
const { handler } = require("./get-tmdb-person-films") as typeof import("./get-tmdb-person-films")

const mockAxiosGet = axios.get as jest.Mock
const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockFindCollectedTmdbIds = mongodb.findCollectedTmdbIds as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const personEvent = (kind?: string) => ({
  pathParameters: { tmdbPersonId: "287" },
  queryStringParameters: kind === undefined ? null : { kind },
})

// Includes TMDb's vote fields, which the handler ignores, so the exact matches below prove they're dropped
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

const responseBody = (result: any) => JSON.parse(result.body)
const films = (result: any) => responseBody(result).data

describe("get-tmdb-person-films handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
    mockFindCollectedTmdbIds.mockResolvedValue(new Set())
  })

  it("should request the person with their film credits from TMDb", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: tmdbPerson() })

    await handler(personEvent("actor"))

    expect(mockAxiosGet).toHaveBeenCalledWith("https://api.themoviedb.org/3/person/287", {
      params: { api_key: "test-key", append_to_response: "movie_credits" },
    })
  })

  it("should return an actor's credited roles", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: tmdbPerson([
        credit(1, { character: "Tyler Durden" }),
        credit(2, { character: "Himself (uncredited)" }),
        credit(3, { character: "" }),
      ]),
    })

    const result = await handler(personEvent("actor"))

    expect(result.statusCode).toBe(200)
    expect(films(result)).toEqual([
      {
        tmdbId: "3",
        title: "Film 3",
        year: 2003,
        character: null,
        inCollection: false,
      },
      {
        tmdbId: "1",
        title: "Film 1",
        year: 2001,
        character: "Tyler Durden",
        inCollection: false,
      },
    ])
  })

  it("should return only the films a director directed, without characters", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: tmdbPerson(
        [credit(9, { character: "Cameo" })],
        [credit(1, { job: "Director" }), credit(2, { job: "Producer" })],
      ),
    })

    const result = await handler(personEvent("director"))

    expect(films(result)).toEqual([
      {
        tmdbId: "1",
        title: "Film 1",
        year: 2001,
        inCollection: false,
      },
    ])
  })

  it("should leave out an actor's crew credits, even as director", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: tmdbPerson([credit(1, { character: "Lead" })], [credit(2, { job: "Director" })]),
    })

    const result = await handler(personEvent("actor"))

    expect(films(result).map((film: any) => film.tmdbId)).toEqual(["1"])
  })

  it("should list a film once, keeping every character an actor plays in it", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: tmdbPerson([
        credit(1, { character: "Mandrake" }),
        credit(1, { character: "President Muffley" }),
        credit(1, { character: "Mandrake" }),
      ]),
    })

    const result = await handler(personEvent("actor"))

    expect(films(result)).toHaveLength(1)
    expect(films(result)[0].character).toBe("Mandrake / President Muffley")
  })

  it("should list a film once when TMDb credits the director twice", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: tmdbPerson([], [credit(1, { job: "Director" }), credit(1, { job: "Director" })]),
    })

    const result = await handler(personEvent("director"))

    expect(films(result)).toHaveLength(1)
  })

  it("should sort newest first, then by title, with undated films last", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: tmdbPerson([
        credit(1, { title: "Undated B", release_date: "" }),
        credit(2, { title: "Old", release_date: "1990-05-01" }),
        credit(3, { title: "Undated A", release_date: undefined }),
        credit(4, { title: "New B", release_date: "2020-01-01" }),
        credit(5, { title: "New A", release_date: "2020-01-01" }),
      ]),
    })

    const result = await handler(personEvent("actor"))

    expect(films(result).map((film: any) => film.title)).toEqual([
      "New A",
      "New B",
      "Old",
      "Undated A",
      "Undated B",
    ])
    expect(films(result)[3].year).toBeNull()
  })

  it("should mark the films already in the collection", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: tmdbPerson([credit(1), credit(2)]) })
    mockFindCollectedTmdbIds.mockResolvedValueOnce(new Set(["2"]))

    const result = await handler(personEvent("actor"))

    expect(mockFindCollectedTmdbIds).toHaveBeenCalledWith(["2", "1"])
    expect(films(result).map((film: any) => [film.tmdbId, film.inCollection])).toEqual([
      ["2", true],
      ["1", false],
    ])
  })

  it("should return an empty list when TMDb has no credits", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { id: 287 } })

    const result = await handler(personEvent("actor"))

    expect(films(result)).toEqual([])
  })

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
    const notFound = Object.assign(new Error("Not found"), {
      isAxiosError: true,
      response: { status: 404 },
    })
    mockAxiosGet.mockRejectedValueOnce(notFound)

    const result = await handler(personEvent("actor"))

    expect(result.statusCode).toBe(404)
  })

  it("should return 502 when TMDb fails", async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error("Network error"))

    const result = await handler(personEvent("actor"))

    expect(result.statusCode).toBe(502)
  })

  it("should return 502 without the error details when the collection lookup fails", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: tmdbPerson([credit(1)]) })
    mockFindCollectedTmdbIds.mockRejectedValueOnce(new Error("connection refused at 10.0.0.1"))

    const result = await handler(personEvent("actor"))

    expect(result.statusCode).toBe(502)
    expect(responseBody(result)).toEqual({ message: "Could not fetch TMDB person films" })
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("connection refused"))
  })
})
