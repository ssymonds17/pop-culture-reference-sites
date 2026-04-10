import {
  countSongsByYear,
  countAlbumsByRating,
  getYears,
  updateYearStats,
} from "./years"
import Song from "../models/song"
import Album, { Rating } from "../models/album"
import YearStats from "../models/yearStats"

jest.mock("../models/song")
jest.mock("../models/album")
jest.mock("../models/yearStats")

const mockSong = Song as jest.Mocked<typeof Song>
const mockAlbum = Album as jest.Mocked<typeof Album>
const mockYearStats = YearStats as jest.Mocked<typeof YearStats>

describe("years service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("countSongsByYear", () => {
    it("should return count of songs for a specific year", async () => {
      mockSong.countDocuments = jest.fn().mockResolvedValueOnce(5) as any

      const result = await countSongsByYear(2020)

      expect(result).toBe(5)
      expect(mockSong.countDocuments).toHaveBeenCalledWith({ year: 2020 })
    })

    it("should return 0 when no songs found for year", async () => {
      mockSong.countDocuments = jest.fn().mockResolvedValueOnce(0) as any

      const result = await countSongsByYear(1999)

      expect(result).toBe(0)
      expect(mockSong.countDocuments).toHaveBeenCalledWith({ year: 1999 })
    })
  })

  describe("countAlbumsByRating", () => {
    it("should return count of gold albums for a specific year", async () => {
      mockAlbum.countDocuments = jest.fn().mockResolvedValueOnce(3) as any

      const result = await countAlbumsByRating(Rating.GOLD, 2020)

      expect(result).toBe(3)
      expect(mockAlbum.countDocuments).toHaveBeenCalledWith({
        rating: Rating.GOLD,
        year: 2020,
      })
    })

    it("should return count of silver albums for a specific year", async () => {
      mockAlbum.countDocuments = jest.fn().mockResolvedValueOnce(7) as any

      const result = await countAlbumsByRating(Rating.SILVER, 2021)

      expect(result).toBe(7)
      expect(mockAlbum.countDocuments).toHaveBeenCalledWith({
        rating: Rating.SILVER,
        year: 2021,
      })
    })

    it("should return 0 when no albums match", async () => {
      mockAlbum.countDocuments = jest.fn().mockResolvedValueOnce(0) as any

      const result = await countAlbumsByRating(Rating.GOLD, 1999)

      expect(result).toBe(0)
    })
  })

  describe("getYears", () => {
    it("should return year statistics sorted by totalScore descending", async () => {
      const mockYearStatsData = [
        {
          year: 2022,
          songs: 10,
          goldAlbums: 2,
          silverAlbums: 3,
          totalScore: 55,
        },
        {
          year: 2020,
          songs: 5,
          goldAlbums: 1,
          silverAlbums: 1,
          totalScore: 25,
        },
        {
          year: 2021,
          songs: 8,
          goldAlbums: 0,
          silverAlbums: 2,
          totalScore: 18,
        },
      ]

      mockYearStats.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockYearStatsData),
        }),
      }) as any

      const result = await getYears()

      expect(mockYearStats.find).toHaveBeenCalledWith({})
      expect(result).toEqual(mockYearStatsData)
      expect(result).toHaveLength(3)
      expect(result[0].totalScore).toBe(55)
      expect(result[1].totalScore).toBe(25)
      expect(result[2].totalScore).toBe(18)
    })

    it("should return empty array when no year stats exist", async () => {
      mockYearStats.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }) as any

      const result = await getYears()

      expect(result).toEqual([])
    })
  })

  describe("updateYearStats", () => {
    it("should calculate and update year statistics", async () => {
      const year = 2020

      // Mock song count
      mockSong.countDocuments = jest.fn().mockResolvedValueOnce(10) as any

      // Mock album counts
      mockAlbum.countDocuments = jest
        .fn()
        .mockResolvedValueOnce(2) // gold albums
        .mockResolvedValueOnce(3) as any // silver albums

      const mockUpdatedYearStats = {
        year: 2020,
        songs: 10,
        goldAlbums: 2,
        silverAlbums: 3,
        totalScore: 55, // 10*1 + 2*15 + 3*5 = 10 + 30 + 15 = 55
      }

      mockYearStats.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedYearStats),
      }) as any

      const result = await updateYearStats(year)

      expect(mockSong.countDocuments).toHaveBeenCalledWith({ year: 2020 })
      expect(mockAlbum.countDocuments).toHaveBeenCalledWith({
        rating: Rating.GOLD,
        year: 2020,
      })
      expect(mockAlbum.countDocuments).toHaveBeenCalledWith({
        rating: Rating.SILVER,
        year: 2020,
      })

      expect(mockYearStats.findOneAndUpdate).toHaveBeenCalledWith(
        { year: 2020 },
        {
          year: 2020,
          songs: 10,
          goldAlbums: 2,
          silverAlbums: 3,
          totalScore: 55,
        },
        {
          upsert: true,
          new: true,
        }
      )

      expect(result).toEqual(mockUpdatedYearStats)
    })

    it("should handle year with no songs or albums", async () => {
      const year = 1999

      mockSong.countDocuments = jest.fn().mockResolvedValueOnce(0) as any
      mockAlbum.countDocuments = jest
        .fn()
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0) as any

      const mockUpdatedYearStats = {
        year: 1999,
        songs: 0,
        goldAlbums: 0,
        silverAlbums: 0,
        totalScore: 0,
      }

      mockYearStats.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedYearStats),
      }) as any

      const result = await updateYearStats(year)

      expect(result).toEqual(mockUpdatedYearStats)
      expect(result.totalScore).toBe(0)
    })

    it("should correctly calculate totalScore", async () => {
      const year = 2021

      mockSong.countDocuments = jest.fn().mockResolvedValueOnce(7) as any
      mockAlbum.countDocuments = jest
        .fn()
        .mockResolvedValueOnce(1) // gold
        .mockResolvedValueOnce(2) as any // silver

      // Expected: 7*1 + 1*15 + 2*5 = 7 + 15 + 10 = 32
      const mockUpdatedYearStats = {
        year: 2021,
        songs: 7,
        goldAlbums: 1,
        silverAlbums: 2,
        totalScore: 32,
      }

      mockYearStats.findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedYearStats),
      }) as any

      const result = await updateYearStats(year)

      expect(result.totalScore).toBe(32)
    })
  })
})
