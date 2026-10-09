import {
  findOrCreateActor,
  getActors,
  getActorByTmdbPersonId,
  findActorsByName,
  updateActorStats,
  updateCastActorStats,
} from "./actors"
import Actor from "../models/actor"
import Film from "../models/film"

jest.mock("../models/actor")
jest.mock("../models/film")

const mockActor = Actor as jest.Mocked<typeof Actor>
const mockFilm = Film as jest.Mocked<typeof Film>

describe("actors service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("findOrCreateActor", () => {
    it("should upsert by TMDb person ID, setting names on insert and the photo every time", async () => {
      const actor = { _id: "actor1" }
      const exec = jest.fn().mockResolvedValue(actor)
      mockActor.findOneAndUpdate = jest.fn().mockReturnValue({ exec }) as any

      const result = await findOrCreateActor("123", "Penélope Cruz", "/p.jpg")

      expect(result).toBe(actor)
      expect(mockActor.findOneAndUpdate).toHaveBeenCalledWith(
        { tmdbPersonId: "123" },
        {
          $setOnInsert: {
            tmdbPersonId: "123",
            name: "penelope cruz",
            displayName: "Penélope Cruz",
          },
          $set: { profilePath: "/p.jpg" },
        },
        { upsert: true, new: true },
      )
    })

    it.each([undefined, ""])(
      "should keep the stored photo when TMDb gives %p",
      async (profilePath) => {
        mockActor.findOneAndUpdate = jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: "actor1" }),
        }) as any

        await findOrCreateActor("123", "Actor One", profilePath)

        const [, update] = (mockActor.findOneAndUpdate as jest.Mock).mock.calls[0]
        expect(update).toEqual({
          $setOnInsert: {
            tmdbPersonId: "123",
            name: "actor one",
            displayName: "Actor One",
          },
        })
      },
    )
  })

  describe("getActors", () => {
    it("should return actors with films, sorted and limited to 200", async () => {
      const actors = [{ _id: "actor1" }]
      const exec = jest.fn().mockResolvedValue(actors)
      const limit = jest.fn().mockReturnValue({ exec })
      const sort = jest.fn().mockReturnValue({ limit })
      mockActor.find = jest.fn().mockReturnValue({ sort }) as any

      const result = await getActors("seenFilms")

      expect(result).toBe(actors)
      expect(mockActor.find).toHaveBeenCalledWith({ totalFilms: { $gt: 0 } })
      expect(sort).toHaveBeenCalledWith({ seenFilms: -1, totalPoints: -1 })
      expect(limit).toHaveBeenCalledWith(200)
    })
  })

  describe("getActorByTmdbPersonId", () => {
    it("should return null when the actor does not exist", async () => {
      const exec = jest.fn().mockResolvedValue(null)
      mockActor.findOne = jest.fn().mockReturnValue({ exec }) as any
      mockFilm.find = jest.fn() as any

      const result = await getActorByTmdbPersonId("missing")

      expect(result).toBeNull()
      expect(mockFilm.find).not.toHaveBeenCalled()
    })

    it("should return the actor with their films, newest first", async () => {
      const actor = {
        _id: "actor1",
        toObject: () => ({ _id: "actor1", displayName: "Actor One" }),
      }
      mockActor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(actor),
      }) as any

      const films = [{ _id: "film1" }]
      const filmExec = jest.fn().mockResolvedValue(films)
      const populate = jest.fn().mockReturnValue({ exec: filmExec })
      const sort = jest.fn().mockReturnValue({ populate })
      const select = jest.fn().mockReturnValue({ sort })
      mockFilm.find = jest.fn().mockReturnValue({ select }) as any

      const result = await getActorByTmdbPersonId("123")

      expect(mockActor.findOne).toHaveBeenCalledWith({ tmdbPersonId: "123" })
      expect(mockFilm.find).toHaveBeenCalledWith({ "cast.actor": "actor1" })
      expect(select).toHaveBeenCalledWith("-cast -productionCompanies -tmdbCollection")
      expect(sort).toHaveBeenCalledWith({ year: -1, title: 1 })
      expect(populate).toHaveBeenCalledWith("directors")
      expect(result).toEqual({ _id: "actor1", displayName: "Actor One", films })
    })
  })

  describe("findActorsByName", () => {
    const mockFind = () => {
      const exec = jest.fn().mockResolvedValue([])
      mockActor.find = jest.fn().mockReturnValue({ exec }) as any
    }

    it("should return no results for a blank query without querying", async () => {
      mockFind()

      const result = await findActorsByName("   ")

      expect(result).toEqual([])
      expect(mockActor.find).not.toHaveBeenCalled()
    })

    it("should match the accent-folded query against the stored name", async () => {
      mockFind()

      await findActorsByName("Penélope")

      const [filter, , options] = (mockActor.find as jest.Mock).mock.calls[0]
      expect(filter.name.test("penelope cruz")).toBe(true)
      expect(filter.totalFilms).toEqual({ $gt: 0 })
      expect(options).toEqual({ sort: { totalPoints: -1 }, limit: 200 })
    })

    it("should escape regex characters in the query", async () => {
      mockFind()

      await findActorsByName("a.b")

      const [filter] = (mockActor.find as jest.Mock).mock.calls[0]
      expect(filter.name.test("a.b")).toBe(true)
      expect(filter.name.test("axb")).toBe(false)
    })
  })

  describe("updateActorStats", () => {
    it("should throw when the actor does not exist", async () => {
      mockActor.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }) as any

      await expect(updateActorStats("missing")).rejects.toThrow(
        "Actor not found",
      )
    })

    it("should save stats calculated from the films the actor is cast in", async () => {
      const save = jest.fn().mockResolvedValue(undefined)
      const actor: any = { _id: "actor1", averageRating: 5, save }
      mockActor.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(actor),
      }) as any
      mockFilm.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { watched: true, rating: 9 },
          { watched: false },
        ]),
      }) as any

      await updateActorStats("actor1")

      expect(mockFilm.find).toHaveBeenCalledWith(
        { "cast.actor": "actor1" },
        "watched rating",
      )
      expect(save).toHaveBeenCalledTimes(1)
      expect(actor).toMatchObject({
        totalFilms: 2,
        seenFilms: 1,
        averageRating: 9,
        totalScore: 9,
        totalPoints: 10,
      })
    })
  })

  describe("updateCastActorStats", () => {
    const mockActorLookups = () => {
      mockActor.findById = jest.fn().mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue({ _id: id, save: jest.fn() }),
      })) as any
      mockFilm.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }) as any
    }

    it("should recalculate each actor once, even when they play several roles", async () => {
      mockActorLookups()

      await updateCastActorStats([
        { actor: "actor1", character: "Role A", order: 0 },
        { actor: "actor2", character: "Role B", order: 1 },
        { actor: "actor1", character: "Role C", order: 2 },
      ] as any)

      expect(mockActor.findById).toHaveBeenCalledTimes(2)
      expect(mockActor.findById).toHaveBeenCalledWith("actor1")
      expect(mockActor.findById).toHaveBeenCalledWith("actor2")
    })

    it("should do nothing for a film with no cast", async () => {
      mockActorLookups()

      await updateCastActorStats(undefined)

      expect(mockActor.findById).not.toHaveBeenCalled()
    })
  })
})
