import { handler } from "./create-song"
import * as mongodb from "./mongodb"
import * as utils from "./utils"
import * as validateUtils from "./utils/validate-upstream-entities"

jest.mock("./mongodb")
jest.mock("./utils", () => ({
  ...jest.createMockFromModule<typeof import("./utils")>("./utils"),
  normalizeForSearch: jest.requireActual("./utils").normalizeForSearch,
}))
jest.mock("./utils/validate-upstream-entities")
jest.mock("./auth", () => ({
  requireAuth:
    (handler: (event: any, userId: string) => Promise<any>) => (event: any) =>
      handler(event, "user1"),
}))

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockCreateSong = mongodb.createSong as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any
const mockAddSongToAlbum = mongodb.addSongToAlbum as jest.Mock
const mockAddSongToArtist = mongodb.addSongToArtist as jest.Mock
const mockUpdateArtistStats = mongodb.updateArtistStats as jest.Mock
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
    expect(mockAddSongToAlbum).toHaveBeenCalledWith("album1", "song1")
    expect(mockAddSongToArtist).toHaveBeenCalledWith("artist1", "song1")
    expect(mockUpdateArtistStats).toHaveBeenCalledWith("artist1")
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

    await handler(event)

    expect(mockValidateAssociatedEntities).toHaveBeenCalledTimes(1)
    expect(mockAddSongToAlbum).not.toHaveBeenCalled()
    expect(mockAddSongToArtist).toHaveBeenCalledWith("artist1", "song1")
    expect(mockUpdateArtistStats).toHaveBeenCalledWith("artist1")
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
