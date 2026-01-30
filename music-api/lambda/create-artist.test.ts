import { handler } from "./create-artist"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockCreateArtist = mongodb.createArtist as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("create-artist handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should create artist successfully", async () => {
    const event = {
      body: JSON.stringify({
        name: "Test Artist",
      }),
    }

    const mockCreatedArtist = {
      _id: "artist1",
      name: "test artist",
      displayName: "Test Artist",
      albums: [],
      songs: [],
      silverAlbums: 0,
      goldAlbums: 0,
      totalSongs: 0,
      totalScore: 0,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockCreateArtist.mockResolvedValueOnce(mockCreatedArtist)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockCreateArtist).toHaveBeenCalledWith({
      name: "test artist",
      displayName: "Test Artist",
      albums: [],
      songs: [],
      silverAlbums: 0,
      goldAlbums: 0,
      totalSongs: 0,
      totalScore: 0,
    })
    expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
      id: "artist1",
      artistName: "Test Artist",
      message: "Successfully created artist",
    })
  })

  it("should lowercase the artist name", async () => {
    const event = {
      body: JSON.stringify({
        name: "UPPERCASE ARTIST",
      }),
    }

    const mockCreatedArtist = {
      _id: "artist1",
      name: "uppercase artist",
      displayName: "UPPERCASE ARTIST",
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockCreateArtist.mockResolvedValueOnce(mockCreatedArtist)

    await handler(event)

    expect(mockCreateArtist).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "uppercase artist",
        displayName: "UPPERCASE ARTIST",
      }),
    )
  })

  it("should return 502 when artist name is missing", async () => {
    const event = {
      body: JSON.stringify({}),
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockCreateArtist).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Artist name is required"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create artist",
    })
  })

  it("should return 502 when database connection fails", async () => {
    const event = {
      body: JSON.stringify({
        name: "Test Artist",
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
      message: "Could not create artist",
    })
  })

  it("should return 502 when artist creation fails", async () => {
    const event = {
      body: JSON.stringify({
        name: "Test Artist",
      }),
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockCreateArtist.mockRejectedValueOnce(new Error("Creation failed"))

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Creation failed"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create artist",
    })
  })

  it("should initialize artist with default values", async () => {
    const event = {
      body: JSON.stringify({
        name: "New Artist",
      }),
    }

    const mockCreatedArtist = {
      _id: "artist1",
      name: "new artist",
      displayName: "New Artist",
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockCreateArtist.mockResolvedValueOnce(mockCreatedArtist)

    await handler(event)

    expect(mockCreateArtist).toHaveBeenCalledWith({
      name: "new artist",
      displayName: "New Artist",
      albums: [],
      songs: [],
      silverAlbums: 0,
      goldAlbums: 0,
      totalSongs: 0,
      totalScore: 0,
    })
  })
})
