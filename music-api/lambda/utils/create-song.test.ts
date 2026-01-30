import {
  updateAssociatedAlbum,
  updateAssociatedArtists,
} from "./create-song"
import { AlbumDocument } from "../mongodb/models/album"
import { ArtistDocument } from "../mongodb/models/artist"

// Mock mongoose save method
const mockSave = jest.fn()

describe("create-song utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("updateAssociatedAlbum", () => {
    it("should add song to album songs array", async () => {
      const mockAlbum = {
        songs: ["song1", "song2"],
        save: mockSave,
      } as unknown as AlbumDocument

      await updateAssociatedAlbum(mockAlbum, "song3")

      expect(mockAlbum.songs).toEqual(["song1", "song2", "song3"])
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should handle empty songs array", async () => {
      const mockAlbum = {
        songs: [],
        save: mockSave,
      } as unknown as AlbumDocument

      await updateAssociatedAlbum(mockAlbum, "song1")

      expect(mockAlbum.songs).toEqual(["song1"])
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should not mutate original songs array", async () => {
      const originalSongs = ["song1"]
      const mockAlbum = {
        songs: originalSongs,
        save: mockSave,
      } as unknown as AlbumDocument

      await updateAssociatedAlbum(mockAlbum, "song2")

      expect(originalSongs).toEqual(["song1"]) // original unchanged
      expect(mockAlbum.songs).toEqual(["song1", "song2"])
    })
  })

  describe("updateAssociatedArtists", () => {
    it("should update single artist with new song", async () => {
      const mockArtist = {
        songs: ["song1"],
        totalSongs: 1,
        totalScore: 10,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "song2")

      expect(mockArtist.songs).toEqual(["song1", "song2"])
      expect(mockArtist.totalSongs).toBe(2)
      expect(mockArtist.totalScore).toBe(11)
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should update multiple artists with new song", async () => {
      const mockArtist1 = {
        songs: ["song1"],
        totalSongs: 1,
        totalScore: 5,
        save: mockSave,
      } as unknown as ArtistDocument

      const mockArtist2 = {
        songs: ["song2"],
        totalSongs: 1,
        totalScore: 8,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist1, mockArtist2], "song3")

      expect(mockArtist1.songs).toEqual(["song1", "song3"])
      expect(mockArtist1.totalSongs).toBe(2)
      expect(mockArtist1.totalScore).toBe(6)

      expect(mockArtist2.songs).toEqual(["song2", "song3"])
      expect(mockArtist2.totalSongs).toBe(2)
      expect(mockArtist2.totalScore).toBe(9)

      expect(mockSave).toHaveBeenCalledTimes(2)
    })

    it("should handle artist with no existing songs", async () => {
      const mockArtist = {
        songs: [],
        totalSongs: 0,
        totalScore: 0,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "song1")

      expect(mockArtist.songs).toEqual(["song1"])
      expect(mockArtist.totalSongs).toBe(1)
      expect(mockArtist.totalScore).toBe(1)
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it("should add exactly 1 point to totalScore per song", async () => {
      const mockArtist = {
        songs: [],
        totalSongs: 0,
        totalScore: 100,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "newSong")

      expect(mockArtist.totalScore).toBe(101)
    })

    it("should handle empty artists array", async () => {
      await updateAssociatedArtists([], "song1")
      expect(mockSave).not.toHaveBeenCalled()
    })

    it("should not mutate original songs array", async () => {
      const originalSongs = ["song1"]
      const mockArtist = {
        songs: originalSongs,
        totalSongs: 1,
        totalScore: 5,
        save: mockSave,
      } as unknown as ArtistDocument

      await updateAssociatedArtists([mockArtist], "song2")

      expect(originalSongs).toEqual(["song1"]) // original unchanged
      expect(mockArtist.songs).toEqual(["song1", "song2"])
    })
  })
})
