import { handler } from "./create-album"
import * as mongodb from "./mongodb"
import * as utils from "./utils"
import * as createAlbumUtils from "./utils/create-album"
import * as validateUtils from "./utils/validate-upstream-entities"
import { Rating } from "./mongodb/models/album"

jest.mock("./mongodb")
jest.mock("./utils")
jest.mock("./utils/create-album")
jest.mock("./utils/validate-upstream-entities")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockCreateAlbum = mongodb.createAlbum as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any
const mockUpdateAssociatedArtists =
  createAlbumUtils.updateAssociatedArtists as jest.Mock
const mockValidateAssociatedEntities =
  validateUtils.validateAssociatedEntities as jest.Mock

describe("create-album handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should create album successfully", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["artist1"],
        rating: Rating.GOLD,
        totalSongs: 10,
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist", albums: [] }]
    const mockCreatedAlbum = {
      id: "album1",
      title: "test album",
      displayTitle: "Test Album",
      year: 2020,
      artistDisplayName: "Test Artist",
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateAlbum.mockResolvedValueOnce(mockCreatedAlbum)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["artist1"],
      "artist",
    )
    expect(mockCreateAlbum).toHaveBeenCalledWith({
      title: "test album",
      displayTitle: "Test Album",
      artistDisplayName: "Test Artist",
      songs: [],
      totalSongs: 10,
      rating: Rating.GOLD,
      artists: ["artist1"],
      year: 2020,
    })
    expect(mockUpdateAssociatedArtists).toHaveBeenCalledWith(
      mockArtists,
      "album1",
      Rating.GOLD,
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
      id: "album1",
      year: 2020,
      title: "test album",
      artistDisplayName: "Test Artist",
      message: "Successfully created album",
    })
  })

  it("should default to NONE rating and 0 totalSongs when not provided", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["artist1"],
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]
    const mockCreatedAlbum = { id: "album1", title: "test album", year: 2020 }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateAlbum.mockResolvedValueOnce(mockCreatedAlbum)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockCreateAlbum).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: Rating.NONE,
        totalSongs: 0,
      }),
    )
  })

  it("should return 404 when artist not found", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["nonexistent"],
      }),
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["nonexistent"],
      "artist",
    )
    expect(mockCreateAlbum).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith("Artist not found")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not create album. Artist not found",
    })
  })

  it("should return 502 when title is missing", async () => {
    const event = {
      body: JSON.stringify({
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["artist1"],
      }),
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Error creating album"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create album",
    })
  })

  it("should return 502 when artistDisplayName is missing", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        year: 2020,
        artists: ["artist1"],
      }),
    }

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create album",
    })
  })

  it("should return 502 when year is missing", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        artists: ["artist1"],
      }),
    }

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create album",
    })
  })

  it("should return 502 when artists array is missing", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        year: 2020,
      }),
    }

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create album",
    })
  })

  it("should return 502 when database connection fails", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["artist1"],
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
      message: "Could not create album",
    })
  })

  it("should return 502 when album creation fails", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Album",
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["artist1"],
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateAlbum.mockRejectedValueOnce(new Error("Creation failed"))

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Creation failed"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create album",
    })
  })

  it("should lowercase the album title", async () => {
    const event = {
      body: JSON.stringify({
        title: "UPPERCASE ALBUM",
        artistDisplayName: "Test Artist",
        year: 2020,
        artists: ["artist1"],
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]
    const mockCreatedAlbum = { id: "album1", title: "uppercase album" }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateAlbum.mockResolvedValueOnce(mockCreatedAlbum)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockCreateAlbum).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "uppercase album",
        displayTitle: "UPPERCASE ALBUM",
      }),
    )
  })
})
