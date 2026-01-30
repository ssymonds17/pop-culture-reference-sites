import { handler } from "./update-album-rating"
import * as mongodb from "./mongodb"
import * as utils from "./utils"
import * as updateAlbumUtils from "./utils/update-album"
import * as validateUtils from "./utils/validate-upstream-entities"
import { Rating } from "./mongodb/models/album"

jest.mock("./mongodb")
jest.mock("./utils")
jest.mock("./utils/update-album")
jest.mock("./utils/validate-upstream-entities")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetAlbumById = mongodb.getAlbumById as jest.Mock
const mockUpdateAlbumRatingById = mongodb.updateAlbumRatingById as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any
const mockUpdateAssociatedArtists =
  updateAlbumUtils.updateAssociatedArtists as jest.Mock
const mockValidateAssociatedEntities =
  validateUtils.validateAssociatedEntities as jest.Mock

describe("update-album-rating handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should update album rating successfully", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        rating: Rating.GOLD,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      title: "Test Album",
      rating: Rating.NONE,
      artists: ["artist1"],
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]

    const mockUpdatedAlbum = {
      id: "album1",
      title: "Test Album",
      year: 2020,
      artistDisplayName: "Test Artist",
      rating: Rating.GOLD,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockUpdateAlbumRatingById.mockResolvedValueOnce(mockUpdatedAlbum)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetAlbumById).toHaveBeenCalledWith("album1")
    expect(mockValidateAssociatedEntities).toHaveBeenCalledWith(
      ["artist1"],
      "artist",
    )
    expect(mockUpdateAlbumRatingById).toHaveBeenCalledWith(
      "album1",
      Rating.GOLD,
    )
    expect(mockUpdateAssociatedArtists).toHaveBeenCalledWith(
      mockArtists,
      Rating.NONE,
      Rating.GOLD,
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(201, {
      id: "album1",
      year: 2020,
      title: "Test Album",
      artistDisplayName: "Test Artist",
      rating: Rating.GOLD,
      message: "Successfully updated album",
    })
  })

  it("should downgrade album rating", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        rating: Rating.SILVER,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      rating: Rating.GOLD,
      artists: ["artist1"],
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]

    const mockUpdatedAlbum = {
      id: "album1",
      title: "Test Album",
      rating: Rating.SILVER,
      year: 2020,
      artistDisplayName: "Test Artist",
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockUpdateAlbumRatingById.mockResolvedValueOnce(mockUpdatedAlbum)
    mockUpdateAssociatedArtists.mockResolvedValueOnce(undefined)

    await handler(event)

    expect(mockUpdateAssociatedArtists).toHaveBeenCalledWith(
      mockArtists,
      Rating.GOLD,
      Rating.SILVER,
    )
  })

  it("should return 502 when album ID is missing", async () => {
    const event = {
      pathParameters: {},
      body: JSON.stringify({
        rating: Rating.GOLD,
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

  it("should return 502 when rating is missing", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({}),
    }

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Rating is missing"),
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
        rating: Rating.GOLD,
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

  it("should return 502 when artists validation fails", async () => {
    const event = {
      pathParameters: {
        id: "album1",
      },
      body: JSON.stringify({
        rating: Rating.GOLD,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      rating: Rating.NONE,
      artists: ["artist1"],
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockValidateAssociatedEntities.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to validate artists"),
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
        rating: Rating.GOLD,
      }),
    }

    const mockCurrentAlbum = {
      id: "album1",
      rating: Rating.NONE,
      artists: ["artist1"],
    }

    const mockArtists = [{ id: "artist1", name: "Test Artist" }]

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetAlbumById.mockResolvedValueOnce(mockCurrentAlbum)
    mockValidateAssociatedEntities.mockResolvedValueOnce(mockArtists)
    mockUpdateAlbumRatingById.mockResolvedValueOnce(null)

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
        rating: Rating.GOLD,
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
