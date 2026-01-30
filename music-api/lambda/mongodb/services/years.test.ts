import {
  countSongsByYear,
  countAlbumsByRating,
  getYearRanges,
  getYears,
} from "./years"
import Song from "../models/song"
import Album, { Rating } from "../models/album"

jest.mock("../models/song")
jest.mock("../models/album")

const mockSong = Song as jest.Mocked<typeof Song>
const mockAlbum = Album as jest.Mocked<typeof Album>

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

  describe("getYearRanges", () => {
    it("should return oldest and newest year", async () => {
      const oldestSong = [{ id: "1", title: "Old Song", year: 2000 }]
      const newestSong = [{ id: "2", title: "New Song", year: 2023 }]

      mockSong.find = jest
        .fn()
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (callback: any) => callback(oldestSong),
            }),
          }),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (callback: any) => callback(newestSong),
            }),
          }),
        }) as any

      const result = await getYearRanges()

      expect(result).toEqual({ oldestYear: 2000, newestYear: 2023 })
    })

    it("should return null values when no songs exist", async () => {
      mockSong.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            then: (callback: any) => callback([]),
          }),
        }),
      }) as any

      const result = await getYearRanges()

      expect(result).toEqual({ oldestYear: null, newestYear: null })
    })
  })

  describe("getYears", () => {
    it("should return year statistics for all years in range", async () => {
      const oldestSong = [{ id: "1", title: "Old Song", year: 2020 }]
      const newestSong = [{ id: "2", title: "New Song", year: 2022 }]

      mockSong.find = jest
        .fn()
        // First two calls for getYearRanges
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (callback: any) => callback(oldestSong),
            }),
          }),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (callback: any) => callback(newestSong),
            }),
          }),
        }) as any

      // Mock countSongsByYear - return consistent value
      mockSong.countDocuments = jest.fn().mockResolvedValue(2) as any

      // Mock countAlbumsByRating - return consistent value
      mockAlbum.countDocuments = jest.fn().mockResolvedValue(1) as any

      const result = await getYears()

      // Verify structure and year range
      expect(result).toHaveLength(3)
      expect(result[0].year).toBe(2020)
      expect(result[1].year).toBe(2021)
      expect(result[2].year).toBe(2022)

      // Verify each year has correct structure with expected values
      // Each year should have: 2 songs, 1 gold, 1 silver
      // totalScore = 2*1 + 1*15 + 1*5 = 2 + 15 + 5 = 22
      result.forEach((yearData) => {
        expect(yearData).toHaveProperty("year")
        expect(yearData).toHaveProperty("songs", 2)
        expect(yearData).toHaveProperty("goldAlbums", 1)
        expect(yearData).toHaveProperty("silverAlbums", 1)
        expect(yearData).toHaveProperty("totalScore", 22)
      })
    })

    it("should throw error when no year range can be determined", async () => {
      mockSong.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            then: (callback: any) => callback([]),
          }),
        }),
      }) as any

      await expect(getYears()).rejects.toThrow("Unable to determine year range")
    })

    it("should handle single year range", async () => {
      const song = [{ id: "1", title: "Song", year: 2020 }]

      mockSong.find = jest
        .fn()
        // Mock getYearRanges - both return same year
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (callback: any) => callback(song),
            }),
          }),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (callback: any) => callback(song),
            }),
          }),
        }) as any

      // Mock countSongsByYear
      mockSong.countDocuments = jest.fn().mockResolvedValueOnce(1) as any

      // Mock countAlbumsByRating
      mockAlbum.countDocuments = jest
        .fn()
        .mockResolvedValueOnce(0) // gold
        .mockResolvedValueOnce(0) as any // silver

      const result = await getYears()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        year: 2020,
        songs: 1,
        goldAlbums: 0,
        silverAlbums: 0,
        totalScore: 1,
      })
    })
  })
})
