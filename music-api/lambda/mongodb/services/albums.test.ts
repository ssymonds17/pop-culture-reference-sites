import {
  createAlbum,
  getAlbums,
  getAlbumById,
  getAlbumByIdFull,
  findAlbumsByTitle,
  updateAlbumRatingById,
  updateAlbumTotalSongsById,
} from "./albums"
import Album, { Rating } from "../models/album"

jest.mock("../models/album")

const mockAlbum = Album as jest.Mocked<typeof Album>

describe("albums service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createAlbum", () => {
    it("should create a new album", async () => {
      const albumData = {
        title: "test-album",
        displayTitle: "Test Album",
        year: 2023,
        artistDisplayName: "Test Artist",
        artists: ["artist1"],
        songs: [],
        rating: Rating.NONE,
      }

      const mockCreatedAlbum = { id: "album1", ...albumData }
      mockAlbum.create.mockResolvedValueOnce(mockCreatedAlbum as any)

      const result = await createAlbum(albumData)

      expect(result).toEqual(mockCreatedAlbum)
      expect(mockAlbum.create).toHaveBeenCalledWith(albumData)
      expect(mockAlbum.create).toHaveBeenCalledTimes(1)
    })
  })

  describe("getAlbums", () => {
    it("should return gold and silver albums by default (no filter)", async () => {
      const mockAlbums = [
        { id: "1", title: "Gold Album", rating: Rating.GOLD, year: 2020 },
        { id: "2", title: "Silver Album", rating: Rating.SILVER, year: 2021 },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockAlbums)
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums()

      expect(result).toEqual(mockAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith({
        rating: { $in: [Rating.GOLD, Rating.SILVER] },
      })
      expect(mockSort).toHaveBeenCalledWith({
        year: 1,
        displayTitle: 1,
        artistDisplayName: 1,
      })
    })

    it("should filter by GOLD rating only", async () => {
      const mockGoldAlbums = [
        { id: "1", title: "Gold Album", rating: Rating.GOLD, year: 2020 },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockGoldAlbums)
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums({ rating: Rating.GOLD })

      expect(result).toEqual(mockGoldAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith({ rating: Rating.GOLD })
    })

    it("should filter by SILVER rating only", async () => {
      const mockSilverAlbums = [
        { id: "2", title: "Silver Album", rating: Rating.SILVER, year: 2021 },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockSilverAlbums)
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums({ rating: Rating.SILVER })

      expect(result).toEqual(mockSilverAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith({ rating: Rating.SILVER })
    })

    it("should filter by year", async () => {
      const mock2020Albums = [
        { id: "1", title: "Album 1", year: 2020, rating: Rating.GOLD },
        { id: "2", title: "Album 2", year: 2020, rating: Rating.SILVER },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mock2020Albums)
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums({ year: 2020 })

      expect(result).toEqual(mock2020Albums)
      expect(mockAlbum.find).toHaveBeenCalledWith({
        rating: { $in: [Rating.GOLD, Rating.SILVER] },
        year: 2020,
      })
    })

    it("should filter by both rating and year", async () => {
      const mockFiltered = [
        { id: "1", title: "Gold 2020", rating: Rating.GOLD, year: 2020 },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockFiltered)
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums({ rating: Rating.GOLD, year: 2020 })

      expect(result).toEqual(mockFiltered)
      expect(mockAlbum.find).toHaveBeenCalledWith({
        rating: Rating.GOLD,
        year: 2020,
      })
    })

    it("should filter by array of ratings", async () => {
      const mockAlbums = [
        { id: "1", title: "Gold", rating: Rating.GOLD },
        { id: "2", title: "Silver", rating: Rating.SILVER },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockAlbums)
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums({
        rating: [Rating.GOLD, Rating.SILVER],
      })

      expect(result).toEqual(mockAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith({
        rating: { $in: [Rating.GOLD, Rating.SILVER] },
      })
    })

    it("should return empty array when no albums match filters", async () => {
      const mockExec = jest.fn().mockResolvedValue([])
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.find = jest.fn().mockReturnValue({ sort: mockSort }) as any

      const result = await getAlbums({ rating: Rating.GOLD, year: 1999 })

      expect(result).toEqual([])
    })
  })

  describe("getAlbumById", () => {
    it("should return album by ID", async () => {
      const mockAlbumData = { id: "album1", title: "Test Album" }
      mockAlbum.findById = jest.fn().mockResolvedValueOnce(mockAlbumData) as any

      const result = await getAlbumById("album1")

      expect(result).toEqual(mockAlbumData)
      expect(mockAlbum.findById).toHaveBeenCalledWith("album1", null)
    })

    it("should return null when album not found", async () => {
      mockAlbum.findById = jest.fn().mockResolvedValueOnce(null) as any

      const result = await getAlbumById("nonexistent")

      expect(result).toBeNull()
      expect(mockAlbum.findById).toHaveBeenCalledWith("nonexistent", null)
    })
  })

  describe("getAlbumByIdFull", () => {
    it("should return album with populated songs", async () => {
      const mockAlbumData = {
        id: "album1",
        title: "Test Album",
        songs: [
          { id: "song1", title: "Song 1" },
          { id: "song2", title: "Song 2" },
        ],
      }

      const mockExec = jest.fn().mockResolvedValueOnce(mockAlbumData)
      const mockPopulate = jest.fn().mockReturnValue({ exec: mockExec })
      mockAlbum.findById = jest.fn().mockReturnValue({ populate: mockPopulate }) as any

      const result = await getAlbumByIdFull("album1")

      expect(result).toEqual(mockAlbumData)
      expect(mockAlbum.findById).toHaveBeenCalledWith("album1", null)
      expect(mockPopulate).toHaveBeenCalledWith({
        path: "songs",
        options: { sort: { year: 1, albumDisplayTitle: 1, title: 1 } },
      })
      expect(mockExec).toHaveBeenCalled()
    })
  })

  describe("findAlbumsByTitle", () => {
    it("should find albums by title with case-insensitive search", async () => {
      const mockAlbums = [
        { id: "1", title: "Abbey Road" },
        { id: "2", title: "abbey road deluxe" },
      ]

      const mockExec = jest.fn().mockResolvedValueOnce(mockAlbums)
      mockAlbum.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      const result = await findAlbumsByTitle("abbey road")

      expect(result).toEqual(mockAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith(
        { title: expect.any(RegExp) },
        null,
        { sort: { title: 1 } }
      )
      expect(mockExec).toHaveBeenCalled()
    })

    it("should return empty array when no albums match", async () => {
      const mockExec = jest.fn().mockResolvedValueOnce([])
      mockAlbum.find = jest.fn().mockReturnValue({ exec: mockExec }) as any

      const result = await findAlbumsByTitle("nonexistent")

      expect(result).toEqual([])
      expect(mockExec).toHaveBeenCalled()
    })
  })

  describe("updateAlbumRatingById", () => {
    it("should update album rating and return updated album", async () => {
      const mockUpdatedAlbum = {
        id: "album1",
        title: "Test Album",
        rating: Rating.GOLD,
      }

      mockAlbum.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedAlbum) as any

      const result = await updateAlbumRatingById("album1", Rating.GOLD)

      expect(result).toEqual(mockUpdatedAlbum)
      expect(mockAlbum.findByIdAndUpdate).toHaveBeenCalledWith(
        "album1",
        { rating: Rating.GOLD },
        { new: true }
      )
    })

    it("should update album rating to SILVER", async () => {
      const mockUpdatedAlbum = {
        id: "album2",
        title: "Another Album",
        rating: Rating.SILVER,
      }

      mockAlbum.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedAlbum) as any

      const result = await updateAlbumRatingById("album2", Rating.SILVER)

      expect(result).toEqual(mockUpdatedAlbum)
      expect(mockAlbum.findByIdAndUpdate).toHaveBeenCalledWith(
        "album2",
        { rating: Rating.SILVER },
        { new: true }
      )
    })

    it("should return null when album not found", async () => {
      mockAlbum.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null) as any

      const result = await updateAlbumRatingById("nonexistent", Rating.GOLD)

      expect(result).toBeNull()
    })
  })

  describe("updateAlbumTotalSongsById", () => {
    it("should update album totalSongs and return updated album", async () => {
      const mockUpdatedAlbum = {
        id: "album1",
        title: "Test Album",
        totalSongs: 12,
      }

      mockAlbum.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedAlbum) as any

      const result = await updateAlbumTotalSongsById("album1", 12)

      expect(result).toEqual(mockUpdatedAlbum)
      expect(mockAlbum.findByIdAndUpdate).toHaveBeenCalledWith(
        "album1",
        { totalSongs: 12 },
        { new: true }
      )
    })

    it("should update album totalSongs to 0", async () => {
      const mockUpdatedAlbum = {
        id: "album2",
        title: "Another Album",
        totalSongs: 0,
      }

      mockAlbum.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedAlbum) as any

      const result = await updateAlbumTotalSongsById("album2", 0)

      expect(result).toEqual(mockUpdatedAlbum)
      expect(mockAlbum.findByIdAndUpdate).toHaveBeenCalledWith(
        "album2",
        { totalSongs: 0 },
        { new: true }
      )
    })

    it("should return null when album not found", async () => {
      mockAlbum.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null) as any

      const result = await updateAlbumTotalSongsById("nonexistent", 10)

      expect(result).toBeNull()
    })
  })
})
