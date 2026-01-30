import { handler } from "./get-albums"
import * as mongodb from "./mongodb"
import * as utils from "./utils"
import { createApiResponse } from "./utils/api"

jest.mock("./mongodb")
jest.mock("./utils")
jest.mock("./utils/api")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetAlbums = mongodb.getAlbums as jest.Mock
const mockLogger = utils.logger as any
const mockCreateApiResponse = createApiResponse as jest.Mock

describe("get-albums handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should retrieve albums successfully", async () => {
    const mockAlbums = [
      {
        id: "album1",
        title: "Album 1",
        displayTitle: "Album 1",
        year: 2020,
      },
      {
        id: "album2",
        title: "Album 2",
        displayTitle: "Album 2",
        year: 2021,
      },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(mockAlbums)

    await handler()

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetAlbums).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: mockAlbums,
      message: "Successfully retrieved albums",
    })
  })

  it("should return empty array when no albums exist", async () => {
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce([])

    await handler()

    expect(mockGetAlbums).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: [],
      message: "Successfully retrieved albums",
    })
  })

  it("should return 404 when albums is null", async () => {
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(null)

    await handler()

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not find albums",
    })
  })

  it("should return 404 when database connection fails", async () => {
    mockConnectToDatabase.mockRejectedValueOnce(
      new Error("Database connection failed"),
    )

    await handler()

    expect(mockLogger.error).toHaveBeenCalledWith("Error retrieving albums:", {
      error: expect.any(Error),
    })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: { message: "Could not find albums" },
    })
  })

  it("should return 404 when getAlbums fails", async () => {
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockRejectedValueOnce(new Error("Query failed"))

    await handler()

    expect(mockLogger.error).toHaveBeenCalledWith("Error retrieving albums:", {
      error: expect.any(Error),
    })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: { message: "Could not find albums" },
    })
  })
})
