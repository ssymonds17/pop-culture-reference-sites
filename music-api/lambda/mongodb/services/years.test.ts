import {
  getSongsByYear,
  getAlbumsByRating,
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

  describe("getSongsByYear", () => {
    it("should return songs for a specific year", async () => {
      const mockSongs = [
        { id: "1", title: "Song 1", year: 2020 },
        { id: "2", title: "Song 2", year: 2020 },
      ]

      mockSong.find = jest.fn().mockResolvedValueOnce(mockSongs) as any

      const result = await getSongsByYear(2020)

      expect(result).toEqual(mockSongs)
      expect(mockSong.find).toHaveBeenCalledWith({ year: 2020 }, null)
    })

    it("should return empty array when no songs found for year", async () => {
      mockSong.find = jest.fn().mockResolvedValueOnce([]) as any

      const result = await getSongsByYear(1999)

      expect(result).toEqual([])
      expect(mockSong.find).toHaveBeenCalledWith({ year: 1999 }, null)
    })
  })

  describe("getAlbumsByRating", () => {
    it("should return gold albums for a specific year", async () => {
      const mockAlbums = [
        { id: "1", title: "Gold Album 1", rating: Rating.GOLD, year: 2020 },
      ]

      mockAlbum.find = jest.fn().mockResolvedValueOnce(mockAlbums) as any

      const result = await getAlbumsByRating(Rating.GOLD, 2020)

      expect(result).toEqual(mockAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith(
        { rating: Rating.GOLD, year: 2020 },
        null
      )
    })

    it("should return silver albums for a specific year", async () => {
      const mockAlbums = [
        { id: "1", title: "Silver Album 1", rating: Rating.SILVER, year: 2021 },
      ]

      mockAlbum.find = jest.fn().mockResolvedValueOnce(mockAlbums) as any

      const result = await getAlbumsByRating(Rating.SILVER, 2021)

      expect(result).toEqual(mockAlbums)
      expect(mockAlbum.find).toHaveBeenCalledWith(
        { rating: Rating.SILVER, year: 2021 },
        null
      )
    })

    it("should return empty array when no albums match", async () => {
      mockAlbum.find = jest.fn().mockResolvedValueOnce([]) as any

      const result = await getAlbumsByRating(Rating.GOLD, 1999)

      expect(result).toEqual([])
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
        })
        // Mock getSongsByYear calls - return consistent data for each year
        .mockResolvedValue([{ id: "song" }]) as any

      // Mock getAlbumsByRating calls - return consistent data
      mockAlbum.find = jest
        .fn()
        .mockResolvedValue([{ id: "album" }]) as any

      const result = await getYears()

      // Verify structure and year range
      expect(result).toHaveLength(3)
      expect(result[0].year).toBe(2020)
      expect(result[1].year).toBe(2021)
      expect(result[2].year).toBe(2022)

      // Verify each year has correct structure
      result.forEach((yearData) => {
        expect(yearData).toHaveProperty("year")
        expect(yearData).toHaveProperty("songs")
        expect(yearData).toHaveProperty("goldAlbums")
        expect(yearData).toHaveProperty("silverAlbums")
        expect(yearData).toHaveProperty("totalScore")
        expect(typeof yearData.totalScore).toBe("number")
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

      await expect(getYears()).rejects.toThrow(
        "Unable to determine year range"
      )
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
        })
        // Mock getSongsByYear
        .mockResolvedValueOnce([{ id: "1" }]) as any

      // Mock getAlbumsByRating
      mockAlbum.find = jest
        .fn()
        .mockResolvedValueOnce([]) // gold
        .mockResolvedValueOnce([]) as any // silver

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
