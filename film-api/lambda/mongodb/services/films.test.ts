import { findFilmsByTitle, getFilmById, getFilmDetailsById } from "./films"
import Film from "../models/film"

jest.mock("../models/film")

const mockFilm = Film as jest.Mocked<typeof Film>

describe("films service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getFilmById", () => {
    it("should return the film with only directors populated", async () => {
      const film = { _id: "film1" }
      const exec = jest.fn().mockResolvedValue(film)
      const populate = jest.fn().mockReturnValue({ exec })
      mockFilm.findById = jest.fn().mockReturnValue({ populate }) as any

      const result = await getFilmById("film1")

      expect(result).toBe(film)
      expect(mockFilm.findById).toHaveBeenCalledWith("film1")
      expect(populate).toHaveBeenCalledTimes(1)
      expect(populate).toHaveBeenCalledWith("directors")
    })
  })

  describe("getFilmDetailsById", () => {
    it("should return the film with directors and cast actors populated", async () => {
      const film = { _id: "film1" }
      const exec = jest.fn().mockResolvedValue(film)
      const populateCast = jest.fn().mockReturnValue({ exec })
      const populateDirectors = jest.fn().mockReturnValue({ populate: populateCast })
      mockFilm.findById = jest.fn().mockReturnValue({ populate: populateDirectors }) as any

      const result = await getFilmDetailsById("film1")

      expect(result).toBe(film)
      expect(mockFilm.findById).toHaveBeenCalledWith("film1")
      expect(populateDirectors).toHaveBeenCalledWith("directors")
      expect(populateCast).toHaveBeenCalledWith("cast.actor")
    })
  })

  describe("findFilmsByTitle", () => {
    const mockFind = (films: unknown[] = []) => {
      const exec = jest.fn().mockResolvedValue(films)
      const populate = jest.fn().mockReturnValue({ exec })
      mockFilm.find = jest.fn().mockReturnValue({ populate }) as any
      return populate
    }

    it("should return no results for a blank query without querying", async () => {
      mockFind()

      const result = await findFilmsByTitle("   ")

      expect(result).toEqual([])
      expect(mockFilm.find).not.toHaveBeenCalled()
    })

    it("should match the accent-folded query against the stored search title", async () => {
      const films = [{ _id: "film1" }]
      const populate = mockFind(films)

      const result = await findFilmsByTitle("Amélie")

      const [filter, , options] = (mockFilm.find as jest.Mock).mock.calls[0]
      expect(filter.searchTitle.test("le fabuleux destin d'amelie poulain")).toBe(true)
      expect(options).toEqual({ sort: { year: -1, title: 1 } })
      expect(populate).toHaveBeenCalledWith("directors")
      expect(result).toBe(films)
    })

    it("should escape regex characters in the query", async () => {
      mockFind()

      await findFilmsByTitle("9.5")

      const [filter] = (mockFilm.find as jest.Mock).mock.calls[0]
      expect(filter.searchTitle.test("9.5 weeks")).toBe(true)
      expect(filter.searchTitle.test("9 and 5")).toBe(false)
    })
  })
})
