import { Rating } from "../mongodb/models/album"
import { updateAssociatedArtists } from "./create-album"
import { ArtistDocument } from "../mongodb/models/artist"

// Mock mongoose save method
const mockSave = jest.fn()

describe("create-album utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("updateAssociatedArtists", () => {
    it("should add album to artist with NONE rating", async () => {
      const mockArtist = {
        albums: ["album1"],
        silverAlbums: 2,
        goldAlbums: 1,
        totalScore: 30,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "album2", Rating.NONE)

      expect(mockArtist.albums).toEqual(["album1", "album2"])
      expect(mockArtist.silverAlbums).toBe(2)
      expect(mockArtist.goldAlbums).toBe(1)
      expect(mockArtist.totalScore).toBe(30) // no change for NONE
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should add album to artist with SILVER rating", async () => {
      const mockArtist = {
        albums: ["album1"],
        silverAlbums: 2,
        goldAlbums: 1,
        totalScore: 30,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "album2", Rating.SILVER)

      expect(mockArtist.albums).toEqual(["album1", "album2"])
      expect(mockArtist.silverAlbums).toBe(3)
      expect(mockArtist.goldAlbums).toBe(1)
      expect(mockArtist.totalScore).toBe(35) // +5 for SILVER
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should add album to artist with GOLD rating", async () => {
      const mockArtist = {
        albums: ["album1"],
        silverAlbums: 2,
        goldAlbums: 1,
        totalScore: 30,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "album2", Rating.GOLD)

      expect(mockArtist.albums).toEqual(["album1", "album2"])
      expect(mockArtist.silverAlbums).toBe(2)
      expect(mockArtist.goldAlbums).toBe(2)
      expect(mockArtist.totalScore).toBe(45) // +15 for GOLD
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should handle multiple artists", async () => {
      const mockArtist1 = {
        albums: [],
        silverAlbums: 0,
        goldAlbums: 0,
        totalScore: 0,
        save: mockSave,
      } as unknown as ArtistDocument

      const mockArtist2 = {
        albums: ["album1"],
        silverAlbums: 1,
        goldAlbums: 0,
        totalScore: 10,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists(
        [mockArtist1, mockArtist2],
        "album2",
        Rating.GOLD
      )

      expect(mockArtist1.albums).toEqual(["album2"])
      expect(mockArtist1.goldAlbums).toBe(1)
      expect(mockArtist1.totalScore).toBe(15)

      expect(mockArtist2.albums).toEqual(["album1", "album2"])
      expect(mockArtist2.goldAlbums).toBe(1)
      expect(mockArtist2.totalScore).toBe(25)

      expect(mockSave).toHaveBeenCalledTimes(2)
    })

    it("should handle artist with no existing albums", async () => {
      const mockArtist = {
        albums: [],
        silverAlbums: 0,
        goldAlbums: 0,
        totalScore: 0,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "album1", Rating.SILVER)

      expect(mockArtist.albums).toEqual(["album1"])
      expect(mockArtist.silverAlbums).toBe(1)
      expect(mockArtist.goldAlbums).toBe(0)
      expect(mockArtist.totalScore).toBe(5)
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should not mutate original albums array", async () => {
      const originalAlbums = ["album1"]
      const mockArtist = {
        albums: originalAlbums,
        silverAlbums: 0,
        goldAlbums: 0,
        totalScore: 0,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "album2", Rating.NONE)

      expect(originalAlbums).toEqual(["album1"]) // original unchanged
      expect(mockArtist.albums).toEqual(["album1", "album2"])
    })

    it("should handle empty artists array", async () => {
      await updateAssociatedArtists([], "album1", Rating.GOLD)
      expect(mockSave).not.toHaveBeenCalled()
    })
  })
})
