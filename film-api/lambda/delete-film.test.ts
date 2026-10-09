import { handler } from "./delete-film"
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
const mockDeleteFilm = mongodb.deleteFilm as jest.Mock
const mockUpdateDirectorStats = mongodb.updateDirectorStats as jest.Mock
const mockUpdateCastActorStats = mongodb.updateCastActorStats as jest.Mock
const mockUpdateYearStats = mongodb.updateYearStats as jest.Mock
const mockRemoveFilmFromTop = mongodb.removeFilmFromTop as jest.Mock
const mockDirectorFindByIdAndUpdate = jest.fn()
mongodb.Director.findByIdAndUpdate = mockDirectorFindByIdAndUpdate as any
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const deleteEvent = { pathParameters: { id: "film1" } }

describe("delete-film handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
  })

  it("should delete the film and update director, actor, year and top film data", async () => {
    const cast = [{ actor: "actor1", character: "Lead", order: 0 }]
    mockGetFilmById.mockResolvedValueOnce({
      _id: "film1",
      year: 2000,
      directors: [{ _id: "director1" }],
      cast,
    })

    await handler(deleteEvent)

    expect(mockDirectorFindByIdAndUpdate).toHaveBeenCalledWith("director1", {
      $pull: { films: "film1" },
    })
    expect(mockDeleteFilm).toHaveBeenCalledWith("film1")
    expect(mockUpdateDirectorStats).toHaveBeenCalledWith("director1")
    expect(mockUpdateCastActorStats).toHaveBeenCalledWith(cast)
    expect(mockUpdateYearStats).toHaveBeenCalledWith(2000)
    expect(mockRemoveFilmFromTop).toHaveBeenCalledWith("film1")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      message: "Successfully deleted film",
    })
  })

  it("should still update year and top film data when the actor stats update fails", async () => {
    mockGetFilmById.mockResolvedValueOnce({
      _id: "film1",
      year: 2000,
      directors: [],
      cast: [{ actor: "missing-actor", order: 0 }],
    })
    mockUpdateCastActorStats.mockRejectedValueOnce(new Error("Actor not found"))

    await handler(deleteEvent)

    expect(mockUpdateYearStats).toHaveBeenCalledWith(2000)
    expect(mockRemoveFilmFromTop).toHaveBeenCalledWith("film1")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not delete film",
    })
  })

  it("should recalculate actor stats only after the film is deleted", async () => {
    mockGetFilmById.mockResolvedValueOnce({
      _id: "film1",
      year: 2000,
      directors: [],
      cast: [{ actor: "actor1", order: 0 }],
    })

    await handler(deleteEvent)

    expect(mockDeleteFilm.mock.invocationCallOrder[0]).toBeLessThan(
      mockUpdateCastActorStats.mock.invocationCallOrder[0],
    )
  })

  it("should return 404 when the film does not exist", async () => {
    mockGetFilmById.mockResolvedValueOnce(null)

    await handler(deleteEvent)

    expect(mockDeleteFilm).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Film not found",
    })
  })

  it("should return 502 when the film ID is missing", async () => {
    await handler({ pathParameters: {} })

    expect(mockGetFilmById).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not delete film",
    })
  })

  it("should return 502 when the delete fails", async () => {
    mockGetFilmById.mockResolvedValueOnce({ _id: "film1", year: 2000, directors: [] })
    mockDeleteFilm.mockRejectedValueOnce(new Error("db down"))

    await handler(deleteEvent)

    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not delete film",
    })
  })
})
