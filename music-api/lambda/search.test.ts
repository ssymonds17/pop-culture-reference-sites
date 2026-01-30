import { handler } from "./search"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockFindArtistsByName = mongodb.findArtistsByName as jest.Mock
const mockFindAlbumsByTitle = mongodb.findAlbumsByTitle as jest.Mock
const mockFindSongsByTitle = mongodb.findSongsByTitle as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any
const mockEscapeRegex = utils.escapeRegex as jest.Mock

describe("search handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.info = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
    mockEscapeRegex.mockImplementation((str) => str)
  })

  it("should search for artists successfully", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test Artist",
        itemType: "artist",
      },
    }

    const mockArtists = [
      { id: "artist1", name: "test artist", displayName: "Test Artist" },
      { id: "artist2", name: "test artist 2", displayName: "Test Artist 2" },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindArtistsByName.mockResolvedValueOnce(mockArtists)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockEscapeRegex).toHaveBeenCalledWith("Test Artist")
    expect(mockFindArtistsByName).toHaveBeenCalledWith("test artist")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      result: mockArtists,
      message: "Successfully retrieved matches",
    })
  })

  it("should search for albums successfully", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test Album",
        itemType: "album",
      },
    }

    const mockAlbums = [
      {
        id: "album1",
        title: "test album",
        displayTitle: "Test Album",
        year: 2020,
      },
      {
        id: "album2",
        title: "test album 2",
        displayTitle: "Test Album 2",
        year: 2021,
      },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindAlbumsByTitle.mockResolvedValueOnce(mockAlbums)

    await handler(event)

    expect(mockEscapeRegex).toHaveBeenCalledWith("Test Album")
    expect(mockFindAlbumsByTitle).toHaveBeenCalledWith("test album")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      result: mockAlbums,
      message: "Successfully retrieved matches",
    })
  })

  it("should search for songs successfully", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test Song",
        itemType: "song",
      },
    }

    const mockSongs = [
      {
        id: "song1",
        title: "test song",
        displayTitle: "Test Song",
        year: 2020,
      },
      {
        id: "song2",
        title: "test song 2",
        displayTitle: "Test Song 2",
        year: 2021,
      },
    ]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindSongsByTitle.mockResolvedValueOnce(mockSongs)

    await handler(event)

    expect(mockEscapeRegex).toHaveBeenCalledWith("Test Song")
    expect(mockFindSongsByTitle).toHaveBeenCalledWith("test song")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      result: mockSongs,
      message: "Successfully retrieved matches",
    })
  })

  it("should return 404 when searchString is missing", async () => {
    const event = {
      queryStringParameters: {
        itemType: "artist",
      },
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "Missing a searchString parameter",
    })
  })

  it("should return 404 when itemType is missing", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test",
      },
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "Missing an itemType parameter",
    })
  })

  it("should return 404 when no results found for artist", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Nonexistent",
        itemType: "artist",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindArtistsByName.mockResolvedValueOnce([])

    await handler(event)

    expect(mockFindArtistsByName).toHaveBeenCalledWith("nonexistent")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "No items found",
    })
  })

  it("should return 404 when no results found for album", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Nonexistent",
        itemType: "album",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindAlbumsByTitle.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockFindAlbumsByTitle).toHaveBeenCalledWith("nonexistent")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "No items found",
    })
  })

  it("should return 404 when no results found for song", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Nonexistent",
        itemType: "song",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindSongsByTitle.mockResolvedValueOnce([])

    await handler(event)

    expect(mockFindSongsByTitle).toHaveBeenCalledWith("nonexistent")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "No items found",
    })
  })

  it("should return 404 when artist search fails", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test",
        itemType: "artist",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindArtistsByName.mockRejectedValueOnce(new Error("Query failed"))

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "Query failed",
    })
  })

  it("should return 404 when album search fails", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test",
        itemType: "album",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindAlbumsByTitle.mockRejectedValueOnce(
      new Error("Database error")
    )

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "Database error",
    })
  })

  it("should return 404 when song search fails", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test",
        itemType: "song",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindSongsByTitle.mockRejectedValueOnce(
      new Error("Connection lost")
    )

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      error: "Connection lost",
    })
  })

  it("should lowercase the search string", async () => {
    const event = {
      queryStringParameters: {
        searchString: "UPPERCASE SEARCH",
        itemType: "artist",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindArtistsByName.mockResolvedValueOnce([
      { id: "artist1", name: "uppercase search" },
    ])

    await handler(event)

    expect(mockFindArtistsByName).toHaveBeenCalledWith("uppercase search")
  })

  it("should escape regex characters in search string", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test.*",
        itemType: "artist",
      },
    }

    mockEscapeRegex.mockReturnValueOnce("Test\\.\\*")
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindArtistsByName.mockResolvedValueOnce([
      { id: "artist1", name: "test.*" },
    ])

    await handler(event)

    expect(mockEscapeRegex).toHaveBeenCalledWith("Test.*")
    expect(mockFindArtistsByName).toHaveBeenCalledWith("test\\.\\*")
  })

  it("should return 502 for non-Error exceptions", async () => {
    const event = {
      queryStringParameters: {
        searchString: "Test",
        itemType: "artist",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockFindArtistsByName.mockRejectedValueOnce("String error")

    await handler(event)

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      error: "An unknown error occurred",
    })
  })
})
