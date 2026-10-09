import {
  findFilmsByTitle,
  getFilmById,
  getFilmDetailsById,
  getFilms,
  getRandomFilms,
} from "./films"
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
      const select = jest.fn().mockReturnValue({ populate })
      mockFilm.find = jest.fn().mockReturnValue({ select }) as any
      return { select, populate }
    }

    it("should return no results for a blank query without querying", async () => {
      mockFind()

      const result = await findFilmsByTitle("   ")

      expect(result).toEqual([])
      expect(mockFilm.find).not.toHaveBeenCalled()
    })

    it("should match the accent-folded query against the stored search title", async () => {
      const films = [{ _id: "film1" }]
      const { select, populate } = mockFind(films)

      const result = await findFilmsByTitle("Amélie")

      const [filter, , options] = (mockFilm.find as jest.Mock).mock.calls[0]
      expect(filter.searchTitle.test("le fabuleux destin d'amelie poulain")).toBe(true)
      expect(options).toEqual({ sort: { year: -1, title: 1 } })
      expect(select).toHaveBeenCalledWith("-cast -productionCompanies -tmdbCollection")
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

  describe("getFilms", () => {
    const mockFindChain = (films: unknown[] = []) => {
      const exec = jest.fn().mockResolvedValue(films)
      const limit = jest.fn().mockReturnValue({ exec })
      const sort = jest.fn().mockReturnValue({ limit })
      const populate = jest.fn().mockReturnValue({ sort })
      const select = jest.fn().mockReturnValue({ populate })
      mockFilm.find = jest.fn().mockReturnValue({ select }) as any
      return { select, populate, sort, limit }
    }

    it("should return films without the detail-only fields", async () => {
      const films = [{ _id: "film1" }]
      const { select, populate, sort, limit } = mockFindChain(films)

      const result = await getFilms()

      expect(result).toBe(films)
      expect(mockFilm.find).toHaveBeenCalledWith({})
      expect(select).toHaveBeenCalledWith("-cast -productionCompanies -tmdbCollection")
      expect(populate).toHaveBeenCalledWith("directors")
      expect(sort).toHaveBeenCalledWith({ rating: -1, year: -1, title: 1 })
      expect(limit).toHaveBeenCalledWith(500)
    })

    it("should pass the filters through to the query", async () => {
      mockFindChain()

      await getFilms({ watched: true, minRating: 7, genres: ["Drama"], directorId: "director1" })

      expect(mockFilm.find).toHaveBeenCalledWith({
        watched: true,
        rating: { $gte: 7 },
        genres: { $in: ["Drama"] },
        directors: "director1",
      })
    })
  })

  describe("getRandomFilms", () => {
    it("should sample owned films and leave out the detail-only fields", async () => {
      const films = [{ _id: "film1" }]
      const exec = jest.fn().mockResolvedValue(films)
      mockFilm.aggregate = jest.fn().mockReturnValue({ exec }) as any

      const result = await getRandomFilms({ count: 3 })

      expect(result).toBe(films)
      const [pipeline] = (mockFilm.aggregate as jest.Mock).mock.calls[0]
      expect(pipeline.slice(0, 3)).toEqual([
        { $match: { owned: true } },
        { $sample: { size: 3 } },
        { $project: { cast: 0, productionCompanies: 0, tmdbCollection: 0 } },
      ])
    })
  })
})
