import { handler } from "./search"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockFindFilmsByTitle = mongodb.findFilmsByTitle as jest.Mock
const mockFindDirectorsByName = mongodb.findDirectorsByName as jest.Mock
const mockFindActorsByName = mongodb.findActorsByName as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

const doc = (fields: Record<string, unknown>) => ({ toObject: () => fields })

const searchEvent = (searchString: string, itemType?: string) => ({
  queryStringParameters: { searchString, ...(itemType && { itemType }) },
})

describe("search handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockConnectToDatabase.mockResolvedValue(undefined)
    mockFindFilmsByTitle.mockResolvedValue([doc({ _id: "film1" })])
    mockFindDirectorsByName.mockResolvedValue([doc({ _id: "director1" })])
    mockFindActorsByName.mockResolvedValue([doc({ _id: "actor1" })])
  })

  it("should search films and directors, but not actors, when no type is given", async () => {
    await handler(searchEvent("kubrick"))

    expect(mockFindFilmsByTitle).toHaveBeenCalledWith("kubrick")
    expect(mockFindDirectorsByName).toHaveBeenCalledWith("kubrick")
    expect(mockFindActorsByName).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      data: [
        { _id: "film1", type: "film" },
        { _id: "director1", type: "director" },
      ],
      count: 2,
    })
  })

  it("should search only films for the film type", async () => {
    await handler(searchEvent("alien", "film"))

    expect(mockFindDirectorsByName).not.toHaveBeenCalled()
    expect(mockFindActorsByName).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      data: [{ _id: "film1", type: "film" }],
      count: 1,
    })
  })

  it("should search only directors for the director type", async () => {
    await handler(searchEvent("scott", "director"))

    expect(mockFindFilmsByTitle).not.toHaveBeenCalled()
    expect(mockFindActorsByName).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      data: [{ _id: "director1", type: "director" }],
      count: 1,
    })
  })

  it("should search only actors for the actor type", async () => {
    await handler(searchEvent("weaver", "actor"))

    expect(mockFindActorsByName).toHaveBeenCalledWith("weaver")
    expect(mockFindFilmsByTitle).not.toHaveBeenCalled()
    expect(mockFindDirectorsByName).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      data: [{ _id: "actor1", type: "actor" }],
      count: 1,
    })
  })

  it("should return 502 when the search string is missing", async () => {
    await handler({ queryStringParameters: {} })

    expect(mockFindFilmsByTitle).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not perform search",
    })
  })

  it("should return 502 when a lookup fails", async () => {
    mockFindActorsByName.mockRejectedValueOnce(new Error("db down"))

    await handler(searchEvent("weaver", "actor"))

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not perform search",
    })
  })
})
