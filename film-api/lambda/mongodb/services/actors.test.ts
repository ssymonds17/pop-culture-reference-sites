import {
  findActorsMissingImdbId,
  findOrCreateActor,
  getActors,
  getActorByTmdbPersonId,
  findActorsByName,
  updateActorStats,
  updateCastActorStats,
  SUPPORTING_ROLE_WEIGHT,
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

  describe("findOrCreateActor IMDb IDs", () => {
    const mockUpsert = () => {
      mockActor.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: "actor1" }),
      }) as any
    }

    it.each(["nm0000093", null])("should store an IMDb ID of %p", async (imdbPersonId) => {
      mockUpsert()

      await findOrCreateActor("287", "Brad Pitt", "/pitt.jpg", imdbPersonId)

      const [, update] = (mockActor.findOneAndUpdate as jest.Mock).mock.calls[0]
      expect(update.$set).toEqual({ profilePath: "/pitt.jpg", imdbPersonId })
    })

    it("should leave the IMDb ID alone when none is given", async () => {
      mockUpsert()

      await findOrCreateActor("287", "Brad Pitt", "/pitt.jpg")

      const [, update] = (mockActor.findOneAndUpdate as jest.Mock).mock.calls[0]
      expect(update.$set).toEqual({ profilePath: "/pitt.jpg" })
    })
  })

  describe("findActorsMissingImdbId", () => {
    it("should return the people with no IMDb ID field, keeping their order", async () => {
      mockActor.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ tmdbPersonId: "2" }]),
      }) as any

      const result = await findActorsMissingImdbId(["1", "2", "3"])

      expect(result).toEqual(["1", "3"])
      expect(mockActor.find).toHaveBeenCalledWith(
        { tmdbPersonId: { $in: ["1", "2", "3"] }, imdbPersonId: { $exists: true } },
        { tmdbPersonId: 1 },
      )
    })

    it("should not query for an empty list", async () => {
      mockActor.find = jest.fn() as any

      expect(await findActorsMissingImdbId([])).toEqual([])
      expect(mockActor.find).not.toHaveBeenCalled()
    })
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

    it("should only rank actors with at least two rated films by average rating", async () => {
      const exec = jest.fn().mockResolvedValue([])
      const limit = jest.fn().mockReturnValue({ exec })
      const sort = jest.fn().mockReturnValue({ limit })
      mockActor.find = jest.fn().mockReturnValue({ sort }) as any

      await getActors("averageRating")

      expect(mockActor.find).toHaveBeenCalledWith({
        totalFilms: { $gt: 0 },
        seenFilms: { $gte: 2 },
      })
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

    const mockActorFilms = (films: unknown[]) => {
      const actor = {
        _id: "actor1",
        toObject: () => ({ _id: "actor1", displayName: "Actor One" }),
      }
      mockActor.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(actor),
      }) as any

      const filmExec = jest.fn().mockResolvedValue(
        films.map((film) => ({ toObject: () => film })),
      )
      const populate = jest.fn().mockReturnValue({ exec: filmExec })
      const sort = jest.fn().mockReturnValue({ populate })
      const select = jest.fn().mockReturnValue({ sort })
      mockFilm.find = jest.fn().mockReturnValue({ select }) as any
      return { select, sort, populate }
    }

    it("should return the actor with their films, newest first", async () => {
      const { select, sort, populate } = mockActorFilms([{ _id: "film1", cast: [] }])

      const result = await getActorByTmdbPersonId("123")

      expect(mockActor.findOne).toHaveBeenCalledWith({ tmdbPersonId: "123" })
      expect(mockFilm.find).toHaveBeenCalledWith({ "cast.actor": "actor1" })
      expect(select).toHaveBeenCalledWith("-productionCompanies -tmdbCollection")
      expect(sort).toHaveBeenCalledWith({ year: -1, title: 1 })
      expect(populate).toHaveBeenCalledWith("directors")
      expect(result).toEqual({
        _id: "actor1",
        displayName: "Actor One",
        films: [{ _id: "film1", lead: false }],
      })
    })

    it("should mark each film as a lead or supporting role for the actor", async () => {
      mockActorFilms([
        { _id: "lead", cast: [{ actor: "actor1", lead: true }] },
        { _id: "support", cast: [{ actor: "actor1" }, { actor: "actor2", lead: true }] },
        { _id: "untagged", cast: [{ actor: "actor1", lead: false }] },
      ])

      const result = await getActorByTmdbPersonId("123")

      expect(result?.films.map((film: any) => [film._id, film.lead])).toEqual([
        ["lead", true],
        ["support", false],
        ["untagged", false],
      ])
    })

    it("should count the actor as the lead when any of their roles in a film is", async () => {
      mockActorFilms([
        {
          _id: "film1",
          cast: [
            { actor: "actor1", lead: false },
            { actor: "actor1", lead: true },
          ],
        },
      ])

      const result = await getActorByTmdbPersonId("123")

      expect(result?.films[0]).toMatchObject({ lead: true })
    })

    it("should leave the cast out of the films it returns", async () => {
      mockActorFilms([{ _id: "film1", cast: [{ actor: "actor1", lead: true }] }])

      const result = await getActorByTmdbPersonId("123")

      expect(result?.films[0]).not.toHaveProperty("cast")
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

    const mockActorWithFilms = (films: unknown[]) => {
      const save = jest.fn().mockResolvedValue(undefined)
      const actor: any = { _id: "actor1", averageRating: 5, save }
      mockActor.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(actor),
      }) as any
      mockFilm.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(films),
      }) as any
      return actor
    }

    it("should save stats calculated from the films the actor is cast in", async () => {
      const actor = mockActorWithFilms([
        { watched: true, rating: 9, cast: [{ actor: "actor1", lead: true }] },
        { watched: false, cast: [{ actor: "actor1" }] },
      ])

      await updateActorStats("actor1")

      expect(mockFilm.find).toHaveBeenCalledWith(
        { "cast.actor": "actor1" },
        "watched rating cast.actor cast.lead",
      )
      expect(actor.save).toHaveBeenCalledTimes(1)
      expect(actor).toMatchObject({
        totalFilms: 2,
        seenFilms: 1,
        averageRating: 9,
        totalScore: 9,
        totalPoints: 10,
      })
    })

    it("should give a supporting role a share of the points", async () => {
      const actor = mockActorWithFilms([
        {
          watched: true,
          rating: 9,
          cast: [
            { actor: "actor2", lead: true },
            { actor: "actor1" },
          ],
        },
      ])

      await updateActorStats("actor1")

      expect(actor.totalPoints).toBe(10 * SUPPORTING_ROLE_WEIGHT)
    })

    it("should give full points when any of the actor's roles in a film is a lead", async () => {
      const actor = mockActorWithFilms([
        {
          watched: true,
          rating: 9,
          cast: [
            { actor: "actor1", lead: false },
            { actor: "actor1", lead: true },
          ],
        },
      ])

      await updateActorStats("actor1")

      expect(actor.totalPoints).toBe(10)
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
