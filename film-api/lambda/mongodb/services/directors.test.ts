import { getDirectors, updateDirectorStats } from "./directors"
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
      expect(populate).toHaveBeenCalledWith("films")
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
