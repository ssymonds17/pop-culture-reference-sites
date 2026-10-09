import { handler } from "./get-actors"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetActors = mongodb.getActors as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("get-actors handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
  })

  it("should return actors sorted by the requested stat", async () => {
    const actors = [{ _id: "actor1" }, { _id: "actor2" }]
    mockGetActors.mockResolvedValueOnce(actors)

    await handler({ queryStringParameters: { sortBy: "seenFilms" } })

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetActors).toHaveBeenCalledWith("seenFilms")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      data: actors,
      count: 2,
    })
  })

  it("should sort by total points when no sort is given", async () => {
    mockGetActors.mockResolvedValueOnce([])

    await handler({ queryStringParameters: null })

    expect(mockGetActors).toHaveBeenCalledWith("totalPoints")
  })

  it("should return 502 when the lookup fails", async () => {
    mockGetActors.mockRejectedValueOnce(new Error("db down"))

    await handler({})

    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not get actors",
    })
  })
})
