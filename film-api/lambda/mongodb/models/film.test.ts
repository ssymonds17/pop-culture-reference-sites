import mongoose from "mongoose"
import Film from "./film"

const baseFilm = { title: "Film One", year: 2000, tmdbId: "1" }

describe("Film model", () => {
  it("should leave cast and production companies unset when not provided", () => {
    const film = new Film(baseFilm)

    expect(film.cast).toBeUndefined()
    expect(film.productionCompanies).toBeUndefined()
    expect(film.tmdbCollection).toBeUndefined()
    expect(film.validateSync()).toBeUndefined()
  })

  it("should keep an empty cast as an empty array", () => {
    const film = new Film({ ...baseFilm, cast: [], productionCompanies: [] })

    expect(film.toObject().cast).toEqual([])
    expect(film.toObject().productionCompanies).toEqual([])
  })

  it("should store cast, companies and collection without subdocument IDs", () => {
    const actorId = new mongoose.Types.ObjectId()
    const film = new Film({
      ...baseFilm,
      cast: [{ actor: actorId, character: "Lead", order: 0 }],
      productionCompanies: [{ tmdbId: "10", name: "Studio", originCountry: "GB" }],
      tmdbCollection: { tmdbId: "20", name: "Saga" },
    })

    const stored = film.toObject()
    expect(stored.cast).toEqual([{ actor: actorId, character: "Lead", order: 0 }])
    expect(stored.productionCompanies).toEqual([
      { tmdbId: "10", name: "Studio", originCountry: "GB" },
    ])
    expect(stored.tmdbCollection).toEqual({ tmdbId: "20", name: "Saga" })
    expect(film.validateSync()).toBeUndefined()
  })

  it("should require an actor and billing order on each cast member", () => {
    const film = new Film({ ...baseFilm, cast: [{ character: "Lead" }] })

    const errors = film.validateSync()?.errors ?? {}
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["cast.0.actor", "cast.0.order"]),
    )
  })

  describe("searchTitle", () => {
    it("should be derived from the title as lowercase without accents", async () => {
      const film = new Film({ ...baseFilm, title: "  Amélie " })

      await film.validate()

      expect(film.searchTitle).toBe("amelie")
    })

    it("should replace a searchTitle sent with the film", async () => {
      const film = new Film({ ...baseFilm, title: "Léon", searchTitle: "something else" })

      await film.validate()

      expect(film.searchTitle).toBe("leon")
    })

    it("should leave the search title alone when the title has not changed", async () => {
      const film = Film.hydrate({ _id: new mongoose.Types.ObjectId(), ...baseFilm, searchTitle: "stored" })

      film.rating = 8
      await film.validate()

      expect(film.searchTitle).toBe("stored")
    })

    it("should follow a change of title", async () => {
      const film = new Film({ ...baseFilm, title: "Old Title" })
      await film.validate()

      film.title = "Ça"
      await film.validate()

      expect(film.searchTitle).toBe("ca")
    })
  })
})
