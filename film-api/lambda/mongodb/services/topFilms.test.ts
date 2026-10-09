import { getTopFilms } from "./topFilms"
import TopFilms from "../models/topFilms"

jest.mock("../models/topFilms")

const mockTopFilms = TopFilms as jest.Mocked<typeof TopFilms>

describe("topFilms service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getTopFilms", () => {
    it("should populate the films without the detail-only fields, with their directors", async () => {
      const topFilms = { filmIds: [] }
      const exec = jest.fn().mockResolvedValue(topFilms)
      const populate = jest.fn().mockReturnValue({ exec })
      mockTopFilms.findOne = jest.fn().mockReturnValue({ populate }) as any

      const result = await getTopFilms()

      expect(result).toBe(topFilms)
      expect(populate).toHaveBeenCalledWith({
        path: "filmIds",
        select: "-cast -productionCompanies -tmdbCollection",
        populate: { path: "directors" },
      })
    })
  })
})
