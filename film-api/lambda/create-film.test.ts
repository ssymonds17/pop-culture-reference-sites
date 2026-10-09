import axios from "axios"
import * as mongodb from "./mongodb"
import * as utils from "./utils"
import Director from "./mongodb/models/director"

jest.mock("axios")
jest.mock("./mongodb")
jest.mock("./mongodb/models/director")
jest.mock("./utils")
jest.mock("./auth", () => ({
  requireAuth:
    (handler: (event: any, userId: string) => Promise<any>) => (event: any) =>
      handler(event, "user1"),
}))

// The handler reads the key when the module loads, so it must be set before requiring it.
process.env.TMDB_API_KEY = "test-key"
const { handler } = require("./create-film") as typeof import("./create-film")

const mockAxiosGet = axios.get as jest.Mock
const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetFilmByTmdbId = mongodb.getFilmByTmdbId as jest.Mock
const mockCreateFilm = mongodb.createFilm as jest.Mock
const mockFindOrCreateDirector = mongodb.findOrCreateDirector as jest.Mock
const mockUpdateDirectorStats = mongodb.updateDirectorStats as jest.Mock
const mockFindOrCreateActor = mongodb.findOrCreateActor as jest.Mock
const mockUpdateCastActorStats = mongodb.updateCastActorStats as jest.Mock
const mockUpdateYearStats = mongodb.updateYearStats as jest.Mock
const mockIsEligibleRating = mongodb.isEligibleRating as unknown as jest.Mock
const mockAddFilmToTopAtTierBottom = mongodb.addFilmToTopAtTierBottom as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const tmdbEvent = { body: JSON.stringify({ tmdbId: "550" }) }

const tmdbFilm = (overrides: Record<string, unknown> = {}) => ({
  id: 550,
  title: "Fight Club",
  release_date: "1999-10-15",
  genres: [{ id: 18, name: "Drama" }],
  original_language: "en",
  runtime: 139,
  poster_path: "/poster.jpg",
  overview: "An overview",
  vote_average: 8.4,
  external_ids: { imdb_id: "tt0137523" },
  credits: {
    cast: [],
    crew: [{ id: 7467, name: "David Fincher", job: "Director", profile_path: "/fincher.jpg" }],
  },
  production_companies: [],
  belongs_to_collection: null,
  ...overrides,
})

const castMember = (order: number, overrides: Record<string, unknown> = {}) => ({
  id: 1000 + order,
  name: `Actor ${order}`,
  character: `Character ${order}`,
  order,
  profile_path: `/profile-${order}.jpg`,
  ...overrides,
})

const mockDirectorFindByIdAndUpdate = jest.fn()
Director.findByIdAndUpdate = mockDirectorFindByIdAndUpdate as any

const createdFilmData = () => mockCreateFilm.mock.calls[0][0]

describe("create-film handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockLogger.info = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
    mockGetFilmByTmdbId.mockResolvedValue(null)
    mockFindOrCreateDirector.mockResolvedValue({ _id: "director1" })
    mockFindOrCreateActor.mockImplementation(async (tmdbPersonId: string) => ({
      _id: `actor-${tmdbPersonId}`,
    }))
    mockCreateFilm.mockImplementation(async (data) => ({ _id: "film1", ...data }))
    mockIsEligibleRating.mockReturnValue(false)
    mockDirectorFindByIdAndUpdate.mockResolvedValue(undefined)
  })

  describe("creating from a TMDb ID", () => {
    it("should create the film with its TMDb details and update related stats", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm() })

      await handler(tmdbEvent)

      expect(mockAxiosGet).toHaveBeenCalledWith(
        "https://api.themoviedb.org/3/movie/550",
        { params: { api_key: "test-key", append_to_response: "credits,external_ids" } },
      )
      expect(createdFilmData()).toMatchObject({
        title: "Fight Club",
        year: 1999,
        directors: ["director1"],
        watched: false,
        owned: false,
        genres: ["Drama"],
        language: "en",
        duration: 139,
        tmdbId: "550",
        imdbId: "tt0137523",
        posterPath: "/poster.jpg",
        overview: "An overview",
        voteAverage: 8.4,
      })
      expect(mockFindOrCreateDirector).toHaveBeenCalledWith(
        "7467",
        "David Fincher",
        "/fincher.jpg",
      )
      expect(mockDirectorFindByIdAndUpdate).toHaveBeenCalledWith("director1", {
        $push: { films: "film1" },
      })
      expect(mockUpdateDirectorStats).toHaveBeenCalledWith("director1")
      expect(mockUpdateYearStats).toHaveBeenCalledWith(1999)
      expect(mockAddFilmToTopAtTierBottom).not.toHaveBeenCalled()
      expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
        id: "film1",
        title: "Fight Club",
        year: 1999,
        directors: 1,
        message: "Successfully created film from TMDB",
      })
    })

    it("should link the director the lookup returns", async () => {
      mockFindOrCreateDirector.mockResolvedValueOnce({ _id: "existing" })
      mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm() })

      await handler(tmdbEvent)

      expect(createdFilmData().directors).toEqual(["existing"])
    })

    it("should pass no photo for a director TMDb has none for", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: tmdbFilm({
          credits: {
            cast: [],
            crew: [{ id: 1, name: "Unknown Director", job: "Director", profile_path: null }],
          },
        }),
      })

      await handler(tmdbEvent)

      expect(mockFindOrCreateDirector).toHaveBeenCalledWith("1", "Unknown Director", undefined)
    })

    it("should keep the top 20 credited cast members in billing order", async () => {
      const cast = [
        castMember(0, { character: "Narrator (uncredited)" }),
        ...Array.from({ length: 25 }, (_, i) => castMember(25 - i)),
      ]
      mockAxiosGet.mockResolvedValueOnce({
        data: tmdbFilm({ credits: { cast, crew: [] } }),
      })

      await handler(tmdbEvent)

      const storedCast = createdFilmData().cast
      expect(storedCast).toHaveLength(20)
      expect(storedCast.map((member: any) => member.order)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1),
      )
      expect(storedCast[0]).toEqual({
        actor: "actor-1001",
        character: "Character 1",
        order: 1,
      })
      expect(mockFindOrCreateActor).toHaveBeenCalledTimes(20)
      expect(mockFindOrCreateActor).not.toHaveBeenCalledWith(
        "1000",
        expect.anything(),
        expect.anything(),
      )
      expect(mockFindOrCreateActor).toHaveBeenCalledWith("1001", "Actor 1", "/profile-1.jpg")
      expect(mockUpdateCastActorStats).toHaveBeenCalledWith(storedCast)
    })

    it("should store missing character and profile values as undefined rather than empty or null", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: tmdbFilm({
          credits: {
            cast: [castMember(0, { character: "", profile_path: null })],
            crew: [],
          },
        }),
      })

      await handler(tmdbEvent)

      expect(mockFindOrCreateActor).toHaveBeenCalledWith("1000", "Actor 0", undefined)
      expect(createdFilmData().cast).toEqual([
        { actor: "actor-1000", character: undefined, order: 0 },
      ])
    })

    it("should map production companies and the collection", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: tmdbFilm({
          production_companies: [
            { id: 508, name: "Regency", logo_path: "/regency.png", origin_country: "US" },
            { id: 9, name: "Small Films", logo_path: null, origin_country: "" },
          ],
          belongs_to_collection: { id: 10, name: "Fight Club Collection" },
        }),
      })

      await handler(tmdbEvent)

      expect(createdFilmData().productionCompanies).toEqual([
        { tmdbId: "508", name: "Regency", logoPath: "/regency.png", originCountry: "US" },
        { tmdbId: "9", name: "Small Films", logoPath: undefined, originCountry: undefined },
      ])
      expect(createdFilmData().tmdbCollection).toEqual({
        tmdbId: "10",
        name: "Fight Club Collection",
      })
    })

    it("should store an empty cast and no collection when TMDb has none", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: tmdbFilm({ credits: undefined, production_companies: undefined }),
      })

      await handler(tmdbEvent)

      expect(createdFilmData()).toMatchObject({
        directors: [],
        cast: [],
        productionCompanies: [],
        tmdbCollection: undefined,
      })
      expect(mockUpdateCastActorStats).toHaveBeenCalledWith([])
    })

    it("should keep each role when one actor plays several characters", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: tmdbFilm({
          credits: {
            cast: [
              castMember(0, { id: 42, name: "Peter Sellers", character: "Mandrake" }),
              castMember(1, { id: 42, name: "Peter Sellers", character: "President Muffley" }),
            ],
            crew: [],
          },
        }),
      })

      await handler(tmdbEvent)

      expect(createdFilmData().cast).toEqual([
        { actor: "actor-42", character: "Mandrake", order: 0 },
        { actor: "actor-42", character: "President Muffley", order: 1 },
      ])
      expect(mockUpdateCastActorStats).toHaveBeenCalledTimes(1)
      expect(mockUpdateCastActorStats).toHaveBeenCalledWith(createdFilmData().cast)
    })

    it("should update actor stats after the year and top film updates", async () => {
      mockIsEligibleRating.mockReturnValueOnce(true)
      mockCreateFilm.mockImplementationOnce(async (data) => ({ _id: "film1", ...data, rating: 9 }))
      mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm() })

      await handler(tmdbEvent)

      const actorStatsOrder = mockUpdateCastActorStats.mock.invocationCallOrder[0]
      expect(mockUpdateYearStats.mock.invocationCallOrder[0]).toBeLessThan(actorStatsOrder)
      expect(mockAddFilmToTopAtTierBottom.mock.invocationCallOrder[0]).toBeLessThan(actorStatsOrder)
    })

    it("should still update year stats when the actor stats update fails", async () => {
      mockUpdateCastActorStats.mockRejectedValueOnce(new Error("Actor not found"))
      mockAxiosGet.mockResolvedValueOnce({ data: tmdbFilm() })

      await handler(tmdbEvent)

      expect(mockUpdateYearStats).toHaveBeenCalledWith(1999)
      expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
        message: "Could not create film",
        error: "Actor not found",
      })
    })

    it("should return 409 without calling TMDb when the film already exists", async () => {
      mockGetFilmByTmdbId.mockResolvedValueOnce({ _id: "film1", title: "Fight Club" })

      await handler(tmdbEvent)

      expect(mockAxiosGet).not.toHaveBeenCalled()
      expect(mockCreateFilm).not.toHaveBeenCalled()
      expect(mockCreateApiResponse).toHaveBeenCalledWith(409, {
        message: "Film already exists in database",
        filmId: "film1",
        title: "Fight Club",
      })
    })

    it("should return 502 when TMDb fails", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("TMDb down"))

      await handler(tmdbEvent)

      expect(mockCreateFilm).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
        message: "Could not create film",
        error: "TMDb down",
      })
    })
  })

  describe("creating from full film data", () => {
    it("should save the body as sent and add a top-tier film to the top films", async () => {
      const film = { title: "Film One", year: 2001, tmdbId: "1", rating: 9 }
      mockIsEligibleRating.mockReturnValueOnce(true)

      await handler({ body: JSON.stringify(film) })

      expect(mockAxiosGet).not.toHaveBeenCalled()
      expect(mockCreateFilm).toHaveBeenCalledWith(film)
      expect(mockUpdateYearStats).toHaveBeenCalledWith(2001)
      expect(mockAddFilmToTopAtTierBottom).toHaveBeenCalledWith("film1", 9)
      expect(mockUpdateCastActorStats).toHaveBeenCalledWith(undefined)
      expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
        id: "film1",
        title: "Film One",
        year: 2001,
        message: "Successfully created film",
      })
    })

    it("should update stats for any cast sent in the body", async () => {
      const cast = [{ actor: "actor1", character: "Lead", order: 0 }]

      await handler({
        body: JSON.stringify({ title: "Film One", year: 2001, tmdbId: "1", cast }),
      })

      expect(mockUpdateCastActorStats).toHaveBeenCalledWith(cast)
    })

    it("should return 502 when required fields are missing", async () => {
      await handler({ body: JSON.stringify({ title: "Film One" }) })

      expect(mockCreateFilm).not.toHaveBeenCalled()
      expect(mockUpdateCastActorStats).not.toHaveBeenCalled()
      expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
        message: "Could not create film",
        error: "Missing required fields: title, year, or tmdbId",
      })
    })
  })
})
