import { updateYearStats } from "./years"
import Film from "../models/film"
import YearStats from "../models/yearStats"

jest.mock("../models/film")
jest.mock("../models/yearStats")

const mockFilm = Film as jest.Mocked<typeof Film>
const mockYearStats = YearStats as jest.Mocked<typeof YearStats>

describe("years service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("updateYearStats", () => {
    it("should load only the fields it needs and save the calculated stats", async () => {
      const select = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { watched: true, rating: 8, genres: ["Drama", "Crime"] },
          { watched: true, rating: 5, genres: ["Drama"] },
          { watched: false, genres: ["Comedy"] },
        ]),
      })
      mockFilm.find = jest.fn().mockReturnValue({ select }) as any
      const saved = { year: 1998 }
      mockYearStats.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(saved),
      }) as any

      const result = await updateYearStats(1998)

      expect(result).toBe(saved)
      expect(mockFilm.find).toHaveBeenCalledWith({ year: 1998 })
      expect(select).toHaveBeenCalledWith("watched rating genres")
      expect(mockYearStats.findOneAndUpdate).toHaveBeenCalledWith(
        { year: 1998 },
        expect.objectContaining({
          year: 1998,
          totalFilms: 3,
          watchedFilms: 2,
          averageRating: 6.5,
          totalScore: 6,
          filmsRated6Plus: 1,
          percentRated6Plus: 50,
          yearScore: 3,
          topGenres: [
            { genre: "Drama", count: 2 },
            { genre: "Crime", count: 1 },
            { genre: "Comedy", count: 1 },
          ],
        }),
        { upsert: true, new: true },
      )
    })
  })
})
