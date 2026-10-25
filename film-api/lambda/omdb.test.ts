import axios from "axios"
import { fetchOmdbFigures, OmdbRejectedError } from "./omdb"

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  get: jest.fn(),
}))
jest.mock("./utils", () => ({ logger: { info: jest.fn() } }))

const mockAxiosGet = axios.get as jest.Mock

const httpError = (status: number, data: unknown = {}) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  })

const omdbAnswer = (data: Record<string, string | undefined>) => mockAxiosGet.mockResolvedValueOnce({ data })

describe("fetchOmdbFigures", () => {
  beforeEach(() => {
    mockAxiosGet.mockReset()
  })

  it("should look up the title by IMDb ID, with a hard timeout", async () => {
    omdbAnswer({ Response: "True", imdbRating: "7.4", imdbVotes: "1,234,567" })

    const figures = await fetchOmdbFigures("tt0000001", "omdb-key", 5000)

    expect(figures).toEqual({ imdbRating: 7.4, imdbVotes: 1234567 })
    expect(mockAxiosGet).toHaveBeenCalledWith("https://www.omdbapi.com/", {
      params: { i: "tt0000001", apikey: "omdb-key" },
      signal: expect.any(AbortSignal),
    })
  })

  it.each(["N/A", "", "not a number", undefined])("should read a figure of %p as null", async (value) => {
    omdbAnswer({ Response: "True", imdbRating: value, imdbVotes: value })

    expect(await fetchOmdbFigures("tt0000001", "omdb-key", 5000)).toEqual({
      imdbRating: null,
      imdbVotes: null,
    })
  })

  it.each(["Incorrect IMDb ID.", "Movie not found!"])(
    "should read %p as a title with no figures",
    async (error) => {
      omdbAnswer({ Response: "False", Error: error })

      expect(await fetchOmdbFigures("tt0000001", "omdb-key", 5000)).toEqual({
        imdbRating: null,
        imdbVotes: null,
      })
    },
  )

  it("should throw for any other OMDb error", async () => {
    omdbAnswer({ Response: "False", Error: "Something went wrong." })

    await expect(fetchOmdbFigures("tt0000001", "omdb-key", 5000)).rejects.toThrow("Something went wrong.")
  })

  it("should throw OmdbRejectedError with OMDb's message when the key is refused", async () => {
    mockAxiosGet.mockRejectedValueOnce(httpError(401, { Response: "False", Error: "Invalid API key!" }))

    const lookup = fetchOmdbFigures("tt0000001", "omdb-key", 5000)

    await expect(lookup).rejects.toBeInstanceOf(OmdbRejectedError)
    await expect(lookup).rejects.toThrow("Invalid API key!")
  })

  it("should give a refused key a fallback message when OMDb sends none", async () => {
    mockAxiosGet.mockRejectedValueOnce(httpError(401))

    await expect(fetchOmdbFigures("tt0000001", "omdb-key", 5000)).rejects.toThrow(
      "OMDb rejected the request",
    )
  })

  it("should rethrow any other request failure as it is", async () => {
    const failure = new Error("Network error")
    mockAxiosGet.mockRejectedValueOnce(failure)

    await expect(fetchOmdbFigures("tt0000001", "omdb-key", 5000)).rejects.toBe(failure)
  })
})
