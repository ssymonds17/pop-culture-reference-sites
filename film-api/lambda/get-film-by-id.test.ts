import { handler } from "./get-film-by-id"
import * as mongodb from "./mongodb"
import * as utils from "./utils"

jest.mock("./mongodb")
jest.mock("./utils")

const mockConnectToDatabase = mongodb.connectToDatabase as jest.Mock
const mockGetFilmDetailsById = mongodb.getFilmDetailsById as jest.Mock
const mockCreateApiResponse = utils.createApiResponse as jest.Mock
const mockLogger = utils.logger as any

describe("get-film-by-id handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.error = jest.fn()
    mockCreateApiResponse.mockImplementation((status, body) => ({
      statusCode: status,
      body: JSON.stringify(body),
    }))
  })

  it("should return the film with its details", async () => {
    const film = { _id: "film1", title: "Film One", cast: [] }
    mockConnectToDatabase.mockResolvedValueOnce(undefined)
    mockGetFilmDetailsById.mockResolvedValueOnce(film)

    await handler({ pathParameters: { id: "film1" } })

    expect(mockConnectToDatabase).toHaveBeenCalled()
    expect(mockGetFilmDetailsById).toHaveBeenCalledWith("film1")
    expect(mockCreateApiResponse).toHaveBeenCalledWith(200, { data: film })
  })

  it("should return 404 when the film does not exist", async () => {
    mockGetFilmDetailsById.mockResolvedValueOnce(null)

    await handler({ pathParameters: { id: "missing" } })

    expect(mockCreateApiResponse).toHaveBeenCalledWith(404, {
      message: "Film not found",
    })
  })

  it("should return 502 when the film ID is missing", async () => {
    await handler({ pathParameters: {} })

    expect(mockGetFilmDetailsById).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalled()
    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not get film",
    })
  })

  it("should return 502 when the lookup fails", async () => {
    mockGetFilmDetailsById.mockRejectedValueOnce(new Error("db down"))

    await handler({ pathParameters: { id: "film1" } })

    expect(mockCreateApiResponse).toHaveBeenCalledWith(502, {
      message: "Could not get film",
    })
  })
})
