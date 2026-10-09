import { getFilmById, getFilmDetailsById } from "./films"
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
})
