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

    const event = {}

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetAlbums).toHaveBeenCalledWith(undefined)
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: mockAlbums,
      message: "Successfully retrieved albums",
    })
  })

  it("should return empty array when no albums exist", async () => {
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce([])

    const event = {}

    await handler(event)

    expect(mockGetAlbums).toHaveBeenCalledWith(undefined)
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: [],
      message: "Successfully retrieved albums",
    })
  })

  it("should filter by GOLD rating", async () => {
    const mockGoldAlbums = [
      { id: "album1", title: "Album 1", rating: "GOLD" },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(mockGoldAlbums)

    const event = {
      queryStringParameters: {
        rating: "GOLD",
      },
    }

    await handler(event)

    expect(mockGetAlbums).toHaveBeenCalledWith({ rating: "GOLD" })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: mockGoldAlbums,
      message: "Successfully retrieved albums",
    })
  })

  it("should filter by SILVER rating", async () => {
    const mockSilverAlbums = [
      { id: "album2", title: "Album 2", rating: "SILVER" },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(mockSilverAlbums)

    const event = {
      queryStringParameters: {
        rating: "SILVER",
      },
    }

    await handler(event)

    expect(mockGetAlbums).toHaveBeenCalledWith({ rating: "SILVER" })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: mockSilverAlbums,
      message: "Successfully retrieved albums",
    })
  })

  it("should filter by year", async () => {
    const mock2020Albums = [
      { id: "album1", title: "Album 1", year: 2020 },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(mock2020Albums)

    const event = {
      queryStringParameters: {
        year: "2020",
      },
    }

    await handler(event)

    expect(mockGetAlbums).toHaveBeenCalledWith({ year: 2020 })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: mock2020Albums,
      message: "Successfully retrieved albums",
    })
  })

  it("should filter by both rating and year", async () => {
    const mockFilteredAlbums = [
      { id: "album1", title: "Album 1", rating: "GOLD", year: 2020 },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(mockFilteredAlbums)

    const event = {
      queryStringParameters: {
        rating: "GOLD",
        year: "2020",
      },
    }

    await handler(event)

    expect(mockGetAlbums).toHaveBeenCalledWith({ rating: "GOLD", year: 2020 })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      albums: mockFilteredAlbums,
      message: "Successfully retrieved albums",
    })
  })

  it("should handle case-insensitive rating parameter", async () => {
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce([])

    const event = {
      queryStringParameters: {
        rating: "gold",
      },
    }

    await handler(event)

    expect(mockGetAlbums).toHaveBeenCalledWith({ rating: "GOLD" })
  })

  it("should return 400 for invalid rating", async () => {
    const event = {
      queryStringParameters: {
        rating: "INVALID",
      },
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(400, {
      message: 'Invalid rating. Must be "GOLD" or "SILVER"',
    })
  })

  it("should return 400 for invalid year", async () => {
    const event = {
      queryStringParameters: {
        year: "invalid",
      },
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(400, {
      message: "Invalid year parameter",
    })
  })

  it("should return 404 when albums is null", async () => {
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbums.mockResolvedValueOnce(null)

    const event = {}

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not find albums",
    })
  })

  it("should return 404 when database connection fails", async () => {
    mockConnectToDatabase.mockRejectedValueOnce(
      new Error("Database connection failed"),
    )

    const event = {}

    await handler(event)

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

    const event = {}

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith("Error retrieving albums:", {
      error: expect.any(Error),
    })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: { message: "Could not find albums" },
    })
  })
})
