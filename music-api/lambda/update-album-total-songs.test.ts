import { handler } from "./update-album-total-songs"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetAlbumById = mongodb.getAlbumById as jest.Mock
const mockUpdateAlbumTotalSongsById =
  mongodb.updateAlbumTotalSongsById as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("update-album-total-songs handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should update album totalSongs successfully", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        totalSongs: 12,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      title: "Test Album",
      totalSongs: 0,
    }

    const mockUpdatedAlbum = {
      id: "album1",
      title: "test album",
      displayTitle: "Test Album",
      year: 2020,
      artistDisplayName: "Test Artist",
      rating: "NONE",
      totalSongs: 12,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockUpdateAlbumTotalSongsById.mockResolvedValueOnce(mockUpdatedAlbum)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetAlbumById).toHaveBeenCalledWith("album1")
    expect(mockUpdateAlbumTotalSongsById).toHaveBeenCalledWith("album1", 12)
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      id: "album1",
      year: 2020,
      title: "test album",
      displayTitle: "Test Album",
      artistDisplayName: "Test Artist",
      rating: "NONE",
      totalSongs: 12,
      message: "Successfully updated album",
    })
  })

  it("should update album totalSongs to 0", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        totalSongs: 0,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      totalSongs: 10,
    }

    const mockUpdatedAlbum = {
      id: "album1",
      title: "test album",
      displayTitle: "Test Album",
      year: 2020,
      artistDisplayName: "Test Artist",
      rating: "NONE",
      totalSongs: 0,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockUpdateAlbumTotalSongsById.mockResolvedValueOnce(mockUpdatedAlbum)

    await handler(event)

    expect(mockUpdateAlbumTotalSongsById).toHaveBeenCalledWith("album1", 0)
  })

  it("should return 502 when album ID is missing", async () => {
    const event = {
      pathParameters: {},
      body: JSON.stringify({
        totalSongs: 12,
      }),
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Album ID is missing"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update album",
    })
  })

  it("should return 502 when totalSongs is missing", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({}),
    }

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("totalSongs is missing"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update album",
    })
  })

  it("should return 502 when album not found", async () => {
    const event = {
      pathParameters: {
        id: "nonexistent",
      },
      body: JSON.stringify({
        totalSongs: 12,
      }),
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Album not found"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update album",
    })
  })

  it("should return 502 when update fails", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        totalSongs: 12,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      totalSongs: 0,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockUpdateAlbumTotalSongsById.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update album"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update album",
    })
  })

  it("should return 502 when database connection fails", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        totalSongs: 12,
      }),
    }

    mockConnectToDatabase.mockRejectedValueOnce(
      new Error("Database connection failed"),
    )

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Database connection failed"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update album",
    })
  })
})
