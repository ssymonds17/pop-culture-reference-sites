import axios from "axios"
import * as utils from "./utils"

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  get: jest.fn(),
}))
jest.mock("./utils")

// The handler reads the key when the module loads, so it must be set before requiring it.
process.env.TMDB_API_KEY = "test-key"
const { handler } = require("./get-tmdb-film-details") as typeof import("./get-tmdb-film-details")

const mockAxiosGet = axios.get as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const event = { pathParameters: { tmdbId: "550" } }

const tmdbFilm = (overrides: Record<string, unknown> = {}) => ({
  id: 550,
  title: "Fight Club",
  release_date: "1999-10-15",
  runtime: 139,
  credits: {
    cast: [
      { id: 287, name: "Brad Pitt", character: "Tyler Durden", order: 1 },
      { id: 819, name: "Edward Norton", character: "Narrator", order: 0 },
      { id: 9, name: "Extra", character: "Waiter (uncredited)", order: 2 },
      { id: 10, name: "Helena Bonham Carter", character: "", order: 3 },
    ],
    crew: [
      { id: 7467, name: "David Fincher", job: "Director" },
      { id: 1, name: "Someone Else", job: "Producer" },
    ],
  },
  ...overrides,
})

const responseBody = (result: any) => JSON.parse(result.body)

describe("get-tmdb-film-details handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should request the film with its credits from TMDb", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm() })

    await handler(event)

    expect(mockAxiosGet).toHaveBeenCalledWith("https://api.themoviedb.org/3/movie/550", {
      params: { api_key: "test-key", append_to_response: "credits" },
    })
  })

  it("should return the film details with its directors and credited cast", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm() })

    const result = await handler(event)

    expect(result.statusCode).toBe(200)
    expect(responseBody(result)).toEqual({
      tmdbId: "550",
      title: "Fight Club",
      year: 1999,
      duration: 139,
      directors: [{ tmdbPersonId: "7467", name: "David Fincher" }],
      cast: [
        { tmdbPersonId: "819", name: "Edward Norton", character: "Narrator" },
        { tmdbPersonId: "287", name: "Brad Pitt", character: "Tyler Durden" },
        { tmdbPersonId: "10", name: "Helena Bonham Carter", character: null },
      ],
    })
  })

  it("should return empty directors and cast when TMDb has no credits", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm({ credits: undefined }) })

    const result = await handler(event)

    expect(responseBody(result)).toMatchObject({ directors: [], cast: [] })
  })

  it("should return 400 when no TMDb ID is given", async () => {
    const result = await handler({ pathParameters: {} })

    expect(result.statusCode).toBe(400)
    expect(mockAxiosGet).not.toHaveBeenCalled()
  })

  it("should return 404 when TMDb has no such film", async () => {
    const notFound = Object.assign(new Error("Not found"), {
      isAxiosError: true,
      response: { status: 404 },
    })
    mockAxiosGet.mockRejectedValueOnce(notFound)

    const result = await handler(event)

    expect(result.statusCode).toBe(404)
  })

  it("should return 502 when TMDb fails", async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error("Network error"))

    const result = await handler(event)

    expect(result.statusCode).toBe(502)
  })
})
