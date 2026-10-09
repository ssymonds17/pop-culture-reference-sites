import { handler } from "./get-actor-by-person-id"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetActorByTmdbPersonId = mongodb.getActorByTmdbPersonId as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("get-actor-by-person-id handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
  })

  it("should return the actor with their films", async () => {
    const actor = { _id: "actor1", displayName: "Actor One", films: [{ _id: "film1" }] }
    mockGetActorByTmdbPersonId.mockResolvedValueOnce(actor)

    await handler({ pathParameters: { tmdbPersonId: "123" } })

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetActorByTmdbPersonId).toHaveBeenCalledWith("123")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, { data: actor })
  })

  it("should return 404 when the actor does not exist", async () => {
    mockGetActorByTmdbPersonId.mockResolvedValueOnce(null)

    await handler({ pathParameters: { tmdbPersonId: "missing" } })

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Actor not found",
    })
  })

  it("should return 502 when the TMDb person ID is missing", async () => {
    await handler({ pathParameters: {} })

    expect(mockGetActorByTmdbPersonId).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not get actor",
    })
  })

  it("should return 502 when the lookup fails", async () => {
    mockGetActorByTmdbPersonId.mockRejectedValueOnce(new Error("db down"))

    await handler({ pathParameters: { tmdbPersonId: "123" } })

    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not get actor",
    })
  })
})
