import {
  findOrCreateDirector,
  getDirectorById,
  getDirectorByTmdbPersonId,
  getDirectors,
  updateDirectorStats,
} from "./directors"
import Director from "../models/director"

jest.mock("../models/director")

const mockDirector = Director as jest.Mocked<typeof Director>

const mockFindByIdPopulated = (result: unknown) => {
  const exec = jest.fn().mockResolvedValue(result)
  const populate = jest.fn().mockReturnValue({ exec })
  mockDirector.findById = jest.fn().mockReturnValue({ populate }) as any
  return populate
}

describe("directors service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("findOrCreateDirector", () => {
    const mockUpsert = () => {
      const director = { _id: "director1" }
      mockDirector.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(director),
      }) as any
      return director
    }

    it("should upsert by TMDb person ID, setting names on insert and the photo every time", async () => {
      const director = mockUpsert()

      const result = await findOrCreateDirector("7467", "David Fincher", "/fincher.jpg")

      expect(result).toBe(director)
      expect(mockDirector.findOneAndUpdate).toHaveBeenCalledWith(
        { tmdbPersonId: "7467" },
        {
          $setOnInsert: {
            tmdbPersonId: "7467",
            name: "david fincher",
            displayName: "David Fincher",
          },
          $set: { profilePath: "/fincher.jpg" },
        },
        { upsert: true, new: true },
      )
    })

    it.each([undefined, ""])(
      "should keep the stored photo when TMDb gives %p",
      async (profilePath) => {
        mockUpsert()

        await findOrCreateDirector("7467", "David Fincher", profilePath)

        const [, update] = (mockDirector.findOneAndUpdate as jest.Mock).mock.calls[0]
        expect(update).toEqual({
          $setOnInsert: {
            tmdbPersonId: "7467",
            name: "david fincher",
            displayName: "David Fincher",
          },
        })
      },
    )
  })

  describe("getDirectors", () => {
    it("should return directors sorted by the requested stat and limited to 200", async () => {
      const directors = [{ _id: "director1" }]
      const exec = jest.fn().mockResolvedValue(directors)
      const limit = jest.fn().mockReturnValue({ exec })
      const sort = jest.fn().mockReturnValue({ limit })
      mockDirector.find = jest.fn().mockReturnValue({ sort }) as any

      const result = await getDirectors("averageRating")

      expect(result).toBe(directors)
      expect(mockDirector.find).toHaveBeenCalledWith({})
      expect(sort).toHaveBeenCalledWith({ averageRating: -1, seenFilms: -1 })
      expect(limit).toHaveBeenCalledWith(200)
    })
  })

  describe.each([
    ["getDirectorById", getDirectorById, "findById", "director1", "director1"],
    ["getDirectorByTmdbPersonId", getDirectorByTmdbPersonId, "findOne", "123", { tmdbPersonId: "123" }],
  ] as const)("%s", (_name, lookup, method, argument, expectedQuery) => {
    it("should populate the director's films without the detail-only fields", async () => {
      const director = { _id: "director1" }
      const exec = jest.fn().mockResolvedValue(director)
      const populate = jest.fn().mockReturnValue({ exec })
      ;(mockDirector as any)[method] = jest.fn().mockReturnValue({ populate })

      const result = await lookup(argument)

      expect(result).toBe(director)
      expect((mockDirector as any)[method]).toHaveBeenCalledWith(expectedQuery)
      expect(populate).toHaveBeenCalledWith({
        path: "films",
        select: "-cast -productionCompanies -tmdbCollection",
        options: { sort: { year: -1, title: 1 } },
      })
    })
  })

  describe("updateDirectorStats", () => {
    it("should throw when the director does not exist", async () => {
      mockFindByIdPopulated(null)

      await expect(updateDirectorStats("missing")).rejects.toThrow(
        "Director not found",
      )
    })

    it("should save stats calculated from the director's films", async () => {
      const save = jest.fn().mockResolvedValue(undefined)
      const director: any = {
        films: [
          { watched: true, rating: 8 },
          { watched: true, rating: 10 },
          { watched: false },
        ],
        save,
      }
      const populate = mockFindByIdPopulated(director)

      await updateDirectorStats("director1")

      expect(mockDirector.findById).toHaveBeenCalledWith("director1")
      expect(populate).toHaveBeenCalledWith({ path: "films", select: "watched rating" })
      expect(save).toHaveBeenCalledTimes(1)
      expect(director).toMatchObject({
        totalFilms: 3,
        seenFilms: 2,
        averageRating: 9,
        totalScore: 18,
        totalPoints: 21,
      })
      expect(director.ratingCounts.rating8).toBe(1)
      expect(director.ratingCounts.rating10).toBe(1)
    })

    it("should clear the average rating when no films have been seen", async () => {
      const save = jest.fn().mockResolvedValue(undefined)
      const director: any = {
        films: [{ watched: false }],
        averageRating: 8,
        save,
      }
      mockFindByIdPopulated(director)

      await updateDirectorStats("director1")

      expect(save).toHaveBeenCalledTimes(1)
      expect(director.averageRating).toBeUndefined()
      expect(director.seenFilms).toBe(0)
      expect(director.totalFilms).toBe(1)
    })
  })
})
