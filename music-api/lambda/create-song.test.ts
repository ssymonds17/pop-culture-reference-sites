import { handler } from "./create-song"
import * as mongodb from "./mongodb"
import * as utils from "./utils"
import * as createSongUtils from "./utils/create-song"
import * as validateUtils from "./utils/validate-upstream-entities"

jest.mock("./mongodb")
jest.mock("./utils")
jest.mock("./utils/create-song")
jest.mock("./utils/validate-upstream-entities")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockCreateSong = mongodb.createSong as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any
const mockUpdateAssociatedAlbum =
  createSongUtils.updateAssociatedAlbum as jest.Mock
const mockUpdateAssociatedArtists =
  createSongUtils.updateAssociatedArtists as jest.Mock
const mockValidateAssociatedEntities =
  validateUtils.validateAssociatedEntities as jest.Mock

describe("create-song handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should create song with album successfully", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        album: "album1",
        albumDisplayTitle: "Test Album",
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist", songs: [] }]
    const mockAlbum = [
      { id: "album1", title: "Test Album", songs: [], totalSongs: 10 },
    ]
    const mockCreatedSong = {
      id: "song1",
      title: "test song",
      displayTitle: "Test Song",
      year: 2020,
      album: "album1",
      albumDisplayTitle: "Test Album",
      artists: ["artist1"],
      artistDisplayName: "Test Artist",
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities
      .mockResolvedValueOnce(mockArtists)
      .mockResolvedValueOnce(mockAlbum)
    mockCreateSong.mockResolvedValueOnce(mockCreatedSong)
    mockUpdateAssociatedAlbum.mockResolvedValueOnce(undefined)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["artist1"],
      "artist"
    )
    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["album1"],
      "album"
    )
    expect(mockCreateSong).toHaveBeenCalledWith({
      title: "test song",
      displayTitle: "Test Song",
      artists: ["artist1"],
      artistDisplayName: "Test Artist",
      year: 2020,
      album: "album1",
      albumDisplayTitle: "Test Album",
    })
    expect(mockUpdateAssociatedAlbum).toHaveBeenCalledWith(
      mockAlbum[0],
      "song1"
    )
    expect(mockUpdateAssociatedArtists).toHaveBeenCalledWith(
      mockArtists,
      "song1"
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
      id: "song1",
      year: 2020,
      title: "test song",
      displayTitle: "Test Song",
      album: "album1",
      albumDisplayTitle: "Test Album",
      artists: ["artist1"],
      artistDisplayName: "Test Artist",
      message: "Successfully created song",
    })
  })

  it("should create song without album successfully", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]
    const mockCreatedSong = {
      id: "song1",
      title: "test song",
      displayTitle: "Test Song",
      year: 2020,
      artists: ["artist1"],
      artistDisplayName: "Test Artist",
      album: undefined,
      albumDisplayTitle: undefined,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateSong.mockResolvedValueOnce(mockCreatedSong)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockValidateAssociatedEntities).toHaveBeenCalledTimes(1)
    expect(mockUpdateAssociatedAlbum).not.toHaveBeenCalled()
    expect(mockUpdateAssociatedArtists).toHaveBeenCalledWith(
      mockArtists,
      "song1"
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
      id: "song1",
      year: 2020,
      title: "test song",
      displayTitle: "Test Song",
      album: undefined,
      albumDisplayTitle: undefined,
      artists: ["artist1"],
      artistDisplayName: "Test Artist",
      message: "Successfully created song",
    })
  })

  it("should lowercase the song title", async () => {
    const event = {
      body: JSON.stringify({
        title: "UPPERCASE SONG",
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]
    const mockCreatedSong = {
      id: "song1",
      title: "uppercase song",
      displayTitle: "UPPERCASE SONG",
      year: 2020,
      artists: ["artist1"],
      artistDisplayName: "Test Artist",
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateSong.mockResolvedValueOnce(mockCreatedSong)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockCreateSong).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "uppercase song",
        displayTitle: "UPPERCASE SONG",
      })
    )
  })

  it("should return 502 when title is missing", async () => {
    const event = {
      body: JSON.stringify({
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Error creating song")
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create song",
    })
  })

  it("should return 502 when artistDisplayName is missing", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        year: 2020,
        artists: ["artist1"],
      }),
    }

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create song",
    })
  })

  it("should return 502 when year is missing", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create song",
    })
  })

  it("should return 502 when artists array is missing", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        year: 2020,
        artistDisplayName: "Test Artist",
      }),
    }

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create song",
    })
  })

  it("should return 404 when artist not found", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        year: 2020,
        artists: ["nonexistent"],
        artistDisplayName: "Test Artist",
      }),
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["nonexistent"],
      "artist"
    )
    expect(mockCreateSong).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Artist or album not found"
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not create song. Artist or album not found",
    })
  })

  it("should return 404 when album not found", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        album: "nonexistent",
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities
      .mockResolvedValueOnce(mockArtists)
      .mockResolvedValueOnce(null)

    await handler(event)

    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["nonexistent"],
      "album"
    )
    expect(mockCreateSong).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Artist or album not found"
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Could not create song. Artist or album not found",
    })
  })

  it("should return 502 when database connection fails", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    mockConnectToDatabase.mockRejectedValueOnce(
      new Error("Database connection failed")
    )

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Database connection failed")
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create song",
    })
  })

  it("should return 502 when song creation fails", async () => {
    const event = {
      body: JSON.stringify({
        title: "Test Song",
        year: 2020,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }),
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockCreateSong.mockRejectedValueOnce(new Error("Creation failed"))

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Creation failed")
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not create song",
    })
  })
})
