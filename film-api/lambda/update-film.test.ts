import { handler } from "./update-film"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")
jest.mock("./auth", () => ({
  requireAuth:
    (handler: (event: any, userId: string) => Promise<any>) => (event: any) =>
      handler(event, "user1"),
}))

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetFilmById = mongodb.getFilmById as jest.Mock
const mockUpdateFilm = mongodb.updateFilm as jest.Mock
const mockUpdateDirectorStats = mongodb.updateDirectorStats as jest.Mock
const mockUpdateCastActorStats = mongodb.updateCastActorStats as jest.Mock
const mockUpdateYearStats = mongodb.updateYearStats as jest.Mock
const mockIsEligibleRating = mongodb.isEligibleRating as unknown as jest.Mock
const mockAddFilmToTopAtTierBottom = mongodb.addFilmToTopAtTierBottom as jest.Mock
const mockRemoveFilmFromTop = mongodb.removeFilmFromTop as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const cast = [{ actor: "actor1", character: "Lead", order: 0 }]

const currentFilm = (overrides: Record<string, unknown> = {}) => ({
  _id: "film1",
  year: 2000,
  directors: [{ _id: "director1" }],
  cast,
  ...overrides,
})

const updateEvent = (body: Record<string, unknown>) => ({
  pathParameters: { id: "film1" },
  body: JSON.stringify(body),
})

describe("update-film handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockLogger.info = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
    mockGetFilmById.mockResolvedValue(currentFilm())
    mockUpdateFilm.mockImplementation(async (_id, rating, owned, review) => ({
      id: "film1",
      rating: rating ?? undefined,
      watched: rating !== null && rating !== undefined,
      owned,
      review,
    }))
    mockIsEligibleRating.mockImplementation((rating) => rating >= 8 && rating <= 10)
  })

  it("should update director, actor and year stats when the rating changes", async () => {
    await handler(updateEvent({ rating: 7 }))

    expect(mockUpdateFilm).toHaveBeenCalledWith("film1", 7, undefined, undefined)
    expect(mockUpdateDirectorStats).toHaveBeenCalledWith("director1")
    expect(mockUpdateCastActorStats).toHaveBeenCalledWith(cast)
    expect(mockUpdateYearStats).toHaveBeenCalledWith(2000)
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      id: "film1",
      title: undefined,
      rating: 7,
      watched: true,
      owned: undefined,
      review: undefined,
      message: "Successfully updated film",
    })
  })

  it("should update actor stats after the year and top film updates", async () => {
    mockGetFilmById.mockResolvedValueOnce(currentFilm({ rating: 7 }))

    await handler(updateEvent({ rating: 9 }))

    const actorStatsOrder = mockUpdateCastActorStats.mock.invocationCallOrder[0]
    expect(mockUpdateYearStats.mock.invocationCallOrder[0]).toBeLessThan(actorStatsOrder)
    expect(mockAddFilmToTopAtTierBottom.mock.invocationCallOrder[0]).toBeLessThan(actorStatsOrder)
  })

  it("should update stats when the rating is cleared", async () => {
    mockGetFilmById.mockResolvedValueOnce(currentFilm({ rating: 6 }))

    await handler(updateEvent({ rating: null }))

    expect(mockUpdateFilm).toHaveBeenCalledWith("film1", null, undefined, undefined)
    expect(mockUpdateCastActorStats).toHaveBeenCalledWith(cast)
    expect(mockUpdateDirectorStats).toHaveBeenCalledWith("director1")
  })

  it("should not update stats when only owned or review change", async () => {
    await handler(updateEvent({ owned: true, review: "Great" }))

    expect(mockUpdateFilm).toHaveBeenCalledWith("film1", undefined, true, "Great")
    expect(mockUpdateDirectorStats).not.toHaveBeenCalled()
    expect(mockUpdateCastActorStats).not.toHaveBeenCalled()
    expect(mockUpdateYearStats).not.toHaveBeenCalled()
  })

  it("should add the film to the top films when it moves into a top tier", async () => {
    mockGetFilmById.mockResolvedValueOnce(currentFilm({ rating: 7 }))

    await handler(updateEvent({ rating: 9 }))

    expect(mockRemoveFilmFromTop).not.toHaveBeenCalled()
    expect(mockAddFilmToTopAtTierBottom).toHaveBeenCalledWith("film1", 9)
  })

  it("should move the film between top tiers", async () => {
    mockGetFilmById.mockResolvedValueOnce(currentFilm({ rating: 8 }))

    await handler(updateEvent({ rating: 10 }))

    expect(mockRemoveFilmFromTop).toHaveBeenCalledWith("film1")
    expect(mockAddFilmToTopAtTierBottom).toHaveBeenCalledWith("film1", 10)
  })

  it("should remove the film from the top films when it drops out of the top tiers", async () => {
    mockGetFilmById.mockResolvedValueOnce(currentFilm({ rating: 9 }))

    await handler(updateEvent({ rating: 6 }))

    expect(mockRemoveFilmFromTop).toHaveBeenCalledWith("film1")
    expect(mockAddFilmToTopAtTierBottom).not.toHaveBeenCalled()
  })

  it.each([0, 11, 7.5, "7"])("should reject a rating of %p", async (rating) => {
    await handler(updateEvent({ rating }))

    expect(mockUpdateFilm).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Rating must be a whole number between 1 and 10"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update film",
    })
  })

  it("should return 502 when the film does not exist", async () => {
    mockGetFilmById.mockResolvedValueOnce(null)

    await handler(updateEvent({ rating: 7 }))

    expect(mockUpdateFilm).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update film",
    })
  })

  it("should return 502 when the request body is not valid JSON", async () => {
    await handler({ pathParameters: { id: "film1" }, body: "not json" })

    expect(mockUpdateFilm).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update film",
    })
  })

  it("should return 502 when the film ID is missing", async () => {
    await handler({ pathParameters: {}, body: JSON.stringify({ rating: 7 }) })

    expect(mockGetFilmById).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update film",
    })
  })
})
