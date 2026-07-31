import { createSong, getSongById, findSongsByTitle } from "./songs"
import Song from "../models/song"

jest.mock("../models/song")

const mockSong = Song as jest.Mocked<typeof Song>

describe("songs service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createSong", () => {
    it("should create a new song", async () => {
      const songData = {
        title: "test-song",
        displayTitle: "Test Song",
        year: 2023,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
      }

      const mockCreatedSong = { id: "song1", ...songData }
      mockSong.create.mockResolvedValueOnce(mockCreatedSong as any)

      const result = await createSong(songData)

      expect(result).toEqual(mockCreatedSong)
      expect(mockSong.create).toHaveBeenCalledWith(songData)
      expect(mockSong.create).toHaveBeenCalledTimes(1)
    })

    it("should create a song with album information", async () => {
      const songData = {
        title: "test-song",
        displayTitle: "Test Song",
        year: 2023,
        artists: ["artist1"],
        artistDisplayName: "Test Artist",
        album: "album1",
        albumDisplayTitle: "Test Album",
      }

      const mockCreatedSong = { id: "song1", ...songData }
      mockSong.create.mockResolvedValueOnce(mockCreatedSong as any)

      const result = await createSong(songData)

      expect(result).toEqual(mockCreatedSong)
      expect(mockSong.create).toHaveBeenCalledWith(songData)
    })
  })

  describe("getSongById", () => {
    it("should return song by ID", async () => {
      const mockSongData = { id: "song1", title: "Test Song" }
      mockSong.findById = jest.fn().mockResolvedValueOnce(mockSongData) as any

      const result = await getSongById("song1")

      expect(result).toEqual(mockSongData)
      expect(mockSong.findById).toHaveBeenCalledWith("song1", null)
    })

    it("should return null when song not found", async () => {
      mockSong.findById = jest.fn().mockResolvedValueOnce(null) as any

      const result = await getSongById("nonexistent")

      expect(result).toBeNull()
      expect(mockSong.findById).toHaveBeenCalledWith("nonexistent", null)
    })
  })

  describe("findSongsByTitle", () => {
    it("should query songs with a case-insensitive regex on the title field", async () => {
      const mockSongs = [
        { id: "1", title: "hey jude" },
        { id: "2", title: "hey jude live" },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockSongs)
      mockSong.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      const result = await findSongsByTitle("Hey Jude")

      expect(result).toEqual(mockSongs)
      expect(mockSong.find).toHaveBeenCalledWith(
        { title: expect.any(RegExp) },
        null,
        { sort: { title: 1 } }
      )
      expect(mockExec).toHaveBeenCalled()
    })

    it("should fold accents and lowercase when building the query regex", async () => {
      const mockExec = jest.fn().mockResolvedValueOnce([])
      mockSong.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      // Stored title is folded at write time, so the query folds to match it:
      // "Voilà" -> "voila".
      await findSongsByTitle("Voilà")

      const [filter] = (mockSong.find as jest.Mock).mock.calls[0]
      expect(filter.title.source).toBe("voila")
      expect(filter.title.flags).toContain("i")
    })

    it("should escape regex metacharacters in the query", async () => {
      const mockExec = jest.fn().mockResolvedValueOnce([])
      mockSong.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      // Parentheses must be escaped so they are matched literally, not treated
      // as a regex group (and so an unbalanced bracket cannot throw).
      await findSongsByTitle("Intro (Live)")

      const [filter] = (mockSong.find as jest.Mock).mock.calls[0]
      expect(filter.title.source).toBe("intro \\(live\\)")
    })

    it("should return empty array when no songs match", async () => {
      const mockExec = jest.fn().mockResolvedValueOnce([])
      mockSong.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      const result = await findSongsByTitle("nonexistent")

      expect(result).toEqual([])
      expect(mockExec).toHaveBeenCalled()
    })

    it("should return empty array for a blank query without hitting the database", async () => {
      mockSong.find = jest.fn() as any

      const result = await findSongsByTitle("   ")

      expect(result).toEqual([])
      expect(mockSong.find).not.toHaveBeenCalled()
    })
  })
})
