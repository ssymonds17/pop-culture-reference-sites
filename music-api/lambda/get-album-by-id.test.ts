import { handler } from "./get-album-by-id"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetAlbumByIdFull = mongodb.getAlbumByIdFull as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("get-album-by-id handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should retrieve album successfully", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
    }

    const mockAlbum = {
      id: "album1",
      title: "Test Album",
      displayTitle: "Test Album",
      year: 2020,
      songs: [
        { id: "song1", title: "Song 1" },
        { id: "song2", title: "Song 2" },
      ],
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumByIdFull.mockResolvedValueOnce(mockAlbum)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetAlbumByIdFull).toHaveBeenCalledWith("album1")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      album: mockAlbum,
      message: "Successfully retrieved album",
    })
  })

  it("should return 400 when album ID is missing", async () => {
    const event = {
      pathParameters: {},
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockGetAlbumByIdFull).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(400, {
      message: "Missing album ID",
    })
  })

  it("should return 400 when pathParameters is missing", async () => {
    const event = {}

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(400, {
      message: "Missing album ID",
    })
  })

  it("should return 404 when album not found", async () => {
    const event = {
      pathParameters: {
        id: "nonexistent",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumByIdFull.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockGetAlbumByIdFull).toHaveBeenCalledWith("nonexistent")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not find album",
    })
  })

  it("should return 404 when database connection fails", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
    }

    mockConnectToDatabase.mockRejectedValueOnce(
      new Error("Database connection failed"),
    )

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith("Error retrieving album:", {
      error: expect.any(Error),
    })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not find album",
    })
  })

  it("should return 404 when getAlbumByIdFull fails", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumByIdFull.mockRejectedValueOnce(new Error("Query failed"))

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith("Error retrieving album:", {
      error: expect.any(Error),
    })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not find album",
    })
  })
})
