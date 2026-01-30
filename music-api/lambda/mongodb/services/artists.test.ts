import {
  createArtist,
  getArtists,
  getArtistById,
  getArtistByIdFull,
  findArtistsByName,
} from "./artists"
import Artist from "../models/artist"

jest.mock("../models/artist")

const mockArtist = Artist as jest.Mocked<typeof Artist>

describe("artists service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createArtist", () => {
    it("should create a new artist", async () => {
      const artistData = {
        name: "test-artist",
        displayName: "Test Artist",
        albums: [],
        songs: [],
        silverAlbums: 0,
        goldAlbums: 0,
        totalSongs: 0,
        totalScore: 0,
      }

      const mockCreatedArtist = { id: "artist1", ...artistData }
      mockArtist.create.mockResolvedValueOnce(mockCreatedArtist as any)

      const result = await createArtist(artistData)

      expect(result).toEqual(mockCreatedArtist)
      expect(mockArtist.create).toHaveBeenCalledWith(artistData)
      expect(mockArtist.create).toHaveBeenCalledTimes(1)
    })
  })

  describe("getArtists", () => {
    it("should return sorted list of artists", async () => {
      const mockArtists = [
        { id: "1", name: "Artist A", totalScore: 100 },
        { id: "2", name: "Artist B", totalScore: 80 },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockArtists)
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec })
      const mockSort = jest.fn().mockReturnValue({ limit: mockLimit })
      mockArtist.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getArtists()

      expect(result).toEqual(mockArtists)
      expect(mockArtist.find).toHaveBeenCalledWith({}, null)
      expect(mockSort).toHaveBeenCalledWith({
        totalScore: -1,
        goldAlbums: -1,
        silverAlbums: -1,
        name: 1,
      })
      expect(mockLimit).toHaveBeenCalledWith(100)
      expect(mockExec).toHaveBeenCalled()
    })
  })

  describe("getArtistById", () => {
    it("should return artist by ID", async () => {
      const mockArtistData = { id: "artist1", name: "Test Artist" }
      mockArtist.findById = jest.fn().mockResolvedValueOnce(mockArtistData) as any

      const result = await getArtistById("artist1")

      expect(result).toEqual(mockArtistData)
      expect(mockArtist.findById).toHaveBeenCalledWith("artist1", null)
    })

    it("should return null when artist not found", async () => {
      mockArtist.findById = jest.fn().mockResolvedValueOnce(null) as any

      const result = await getArtistById("nonexistent")

      expect(result).toBeNull()
      expect(mockArtist.findById).toHaveBeenCalledWith("nonexistent", null)
    })
  })

  describe("getArtistByIdFull", () => {
    it("should return artist with populated albums and songs", async () => {
      const mockArtistData = {
        id: "artist1",
        name: "Test Artist",
        albums: [{ id: "album1", title: "Album 1" }],
        songs: [{ id: "song1", title: "Song 1" }],
      }

      const mockExec = jest.fn().mockResolvedValueOnce(mockArtistData)
      const mockPopulate2 = jest.fn().mockReturnValue({ exec: mockExec })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      mockArtist.findById = jest.fn().mockReturnValue({ populate: mockPopulate1 }) as any

      const result = await getArtistByIdFull("artist1")

      expect(result).toEqual(mockArtistData)
      expect(mockArtist.findById).toHaveBeenCalledWith("artist1", null)
      expect(mockPopulate1).toHaveBeenCalledWith({
        path: "albums",
        options: { sort: { year: 1, title: 1 } },
      })
      expect(mockPopulate2).toHaveBeenCalledWith({
        path: "songs",
        options: { sort: { year: 1, albumDisplayTitle: 1, title: 1 } },
      })
      expect(mockExec).toHaveBeenCalled()
    })
  })

  describe("findArtistsByName", () => {
    it("should find artists by name with case-insensitive search", async () => {
      const mockArtists = [
        { id: "1", name: "Beatles" },
        { id: "2", name: "The Beatles" },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockArtists)
      mockArtist.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      const result = await findArtistsByName("beatles")

      expect(result).toEqual(mockArtists)
      expect(mockArtist.find).toHaveBeenCalledWith(
        { name: expect.any(RegExp) },
        null,
        { sort: { name: 1 } }
      )
      expect(mockExec).toHaveBeenCalled()
    })

    it("should return empty array when no artists match", async () => {
      const mockExec = jest.fn().mockResolvedValueOnce([])
      mockArtist.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      const result = await findArtistsByName("nonexistent")

      expect(result).toEqual([])
      expect(mockExec).toHaveBeenCalled()
    })
  })
})
