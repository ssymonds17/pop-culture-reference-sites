import { handler } from "./update-year-stats"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockUpdateYearStats = mongodb.updateYearStats as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("update-year-stats handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should update year stats successfully", async () => {
    const event = {
      pathParameters: {
        year: "2020",
      },
    }

    const mockUpdatedYearStats = {
      year: 2020,
      songs: 10,
      goldAlbums: 2,
      silverAlbums: 3,
      totalScore: 55,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockUpdateYearStats.mockResolvedValueOnce(mockUpdatedYearStats)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockUpdateYearStats).toHaveBeenCalledWith(2020)
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      year: 2020,
      songs: 10,
      goldAlbums: 2,
      silverAlbums: 3,
      totalScore: 55,
      message: "Successfully updated year stats",
    })
  })

  it("should handle year with no data", async () => {
    const event = {
      pathParameters: {
        year: "1999",
      },
    }

    const mockUpdatedYearStats = {
      year: 1999,
      songs: 0,
      goldAlbums: 0,
      silverAlbums: 0,
      totalScore: 0,
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockUpdateYearStats.mockResolvedValueOnce(mockUpdatedYearStats)

    await handler(event)

    expect(mockUpdateYearStats).toHaveBeenCalledWith(1999)
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, {
      year: 1999,
      songs: 0,
      goldAlbums: 0,
      silverAlbums: 0,
      totalScore: 0,
      message: "Successfully updated year stats",
    })
  })

  it("should return 502 when year parameter is missing", async () => {
    const event = {
      pathParameters: {},
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Year parameter is missing"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update year stats",
    })
  })

  it("should return 502 when year parameter is invalid", async () => {
    const event = {
      pathParameters: {
        year: "invalid",
      },
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Invalid year parameter"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update year stats",
    })
  })

  it("should return 502 when pathParameters is null", async () => {
    const event = {
      pathParameters: null,
    }

    await handler(event)

    expect(mockConnectToDatabase).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Year parameter is missing"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update year stats",
    })
  })

  it("should return 502 when update fails", async () => {
    const event = {
      pathParameters: {
        year: "2020",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockUpdateYearStats.mockResolvedValueOnce(null)

    await handler(event)

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockUpdateYearStats).toHaveBeenCalledWith(2020)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update year stats"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update year stats",
    })
  })

  it("should return 502 when database connection fails", async () => {
    const event = {
      pathParameters: {
        year: "2020",
      },
    }

    mockConnectToDatabase.mockRejectedValueOnce(
      new Error("Database connection failed"),
    )

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Database connection failed"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update year stats",
    })
  })

  it("should handle edge case years correctly", async () => {
    const testCases = [
      { year: "1900", expected: 1900 },
      { year: "2100", expected: 2100 },
      { year: "2023", expected: 2023 },
    ]

    for (const { year, expected } of testCases) {
      jest.clearAllMocks()

      const event = {
        pathParameters: { year },
      }

      const mockUpdatedYearStats = {
        year: expected,
        songs: 5,
        goldAlbums: 1,
        silverAlbums: 1,
        totalScore: 25,
      }

      mockConnectToDatabase.mockResolvedValueOnce(undefined)
      mockUpdateYearStats.mockResolvedValueOnce(mockUpdatedYearStats)

      await handler(event)

      expect(mockUpdateYearStats).toHaveBeenCalledWith(expected)
    }
  })

  it("should return 502 when updateYearStats throws an error", async () => {
    const event = {
      pathParameters: {
        year: "2020",
      },
    }

    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockUpdateYearStats.mockRejectedValueOnce(
      new Error("Failed to calculate stats"),
    )

    await handler(event)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to calculate stats"),
    )
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not update year stats",
    })
  })
})
