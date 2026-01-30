import { validateAssociatedEntities } from "./validate-upstream-entities"
import * as mongodb from "../mongodb"
import { AlbumDocument } from "../mongodb/models/album"
import { ArtistDocument } from "../mongodb/models/artist"
import { SongDocument } from "../mongodb/models/song"
import { logger } from "./logger"

// Mock the mongodb functions
jest.mock("../mongodb", () => ({
  getArtistById: jest.fn(),
  getAlbumById: jest.fn(),
  getSongById: jest.fn(),
}))

// Mock the logger
jest.mock("./logger", () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockGetArtistById = mongodb.getArtistById as jest.Mock
const mockGetAlbumById = mongodb.getAlbumById as jest.Mock
const mockGetSongById = mongodb.getSongById as jest.Mock
const mockLoggerError = logger.error as jest.Mock

describe("validate-upstream-entities utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("validateAssociatedEntities", () => {
    describe("artist validation", () => {
      it("should return all artists when all IDs are valid", async () => {
        const mockArtist1 = { id: "artist1", name: "Artist 1" } as ArtistDocument
        const mockArtist2 = { id: "artist2", name: "Artist 2" } as ArtistDocument

        mockGetArtistById
          .mockResolvedValueOnce(mockArtist1)
          .mockResolvedValueOnce(mockArtist2)

        const result = await validateAssociatedEntities(
          ["artist1", "artist2"],
          "artist"
        )

        expect(result).toEqual([mockArtist1, mockArtist2])
        expect(mockGetArtistById).toHaveBeenCalledTimes(2)
        expect(mockGetArtistById).toHaveBeenCalledWith("artist1")
        expect(mockGetArtistById).toHaveBeenCalledWith("artist2")
      })

      it("should return null when one artist does not exist", async () => {
        const mockArtist1 = { id: "artist1", name: "Artist 1" } as ArtistDocument

        mockGetArtistById
          .mockResolvedValueOnce(mockArtist1)
          .mockResolvedValueOnce(null)

        const result = await validateAssociatedEntities(
          ["artist1", "artist2"],
          "artist"
        )

        expect(result).toBeNull()
        expect(mockGetArtistById).toHaveBeenCalledTimes(2)
      })

      it("should return null when all artists do not exist", async () => {
        mockGetArtistById.mockResolvedValue(null)

        const result = await validateAssociatedEntities(
          ["artist1", "artist2"],
          "artist"
        )

        expect(result).toBeNull()
        expect(mockGetArtistById).toHaveBeenCalledTimes(2)
      })

      it("should handle single artist ID", async () => {
        const mockArtist = { id: "artist1", name: "Artist 1" } as ArtistDocument

        mockGetArtistById.mockResolvedValueOnce(mockArtist)

        const result = await validateAssociatedEntities(["artist1"], "artist")

        expect(result).toEqual([mockArtist])
        expect(mockGetArtistById).toHaveBeenCalledTimes(1)
      })
    })

    describe("album validation", () => {
      it("should return all albums when all IDs are valid", async () => {
        const mockAlbum1 = { id: "album1", title: "Album 1" } as AlbumDocument
        const mockAlbum2 = { id: "album2", title: "Album 2" } as AlbumDocument

        mockGetAlbumById
          .mockResolvedValueOnce(mockAlbum1)
          .mockResolvedValueOnce(mockAlbum2)

        const result = await validateAssociatedEntities(
          ["album1", "album2"],
          "album"
        )

        expect(result).toEqual([mockAlbum1, mockAlbum2])
        expect(mockGetAlbumById).toHaveBeenCalledTimes(2)
        expect(mockGetAlbumById).toHaveBeenCalledWith("album1")
        expect(mockGetAlbumById).toHaveBeenCalledWith("album2")
      })

      it("should return null when one album does not exist", async () => {
        const mockAlbum1 = { id: "album1", title: "Album 1" } as AlbumDocument

        mockGetAlbumById
          .mockResolvedValueOnce(mockAlbum1)
          .mockResolvedValueOnce(null)

        const result = await validateAssociatedEntities(
          ["album1", "album2"],
          "album"
        )

        expect(result).toBeNull()
        expect(mockGetAlbumById).toHaveBeenCalledTimes(2)
      })
    })

    describe("song validation", () => {
      it("should return all songs when all IDs are valid", async () => {
        const mockSong1 = { id: "song1", title: "Song 1" } as SongDocument
        const mockSong2 = { id: "song2", title: "Song 2" } as SongDocument

        mockGetSongById
          .mockResolvedValueOnce(mockSong1)
          .mockResolvedValueOnce(mockSong2)

        const result = await validateAssociatedEntities(
          ["song1", "song2"],
          "song"
        )

        expect(result).toEqual([mockSong1, mockSong2])
        expect(mockGetSongById).toHaveBeenCalledTimes(2)
        expect(mockGetSongById).toHaveBeenCalledWith("song1")
        expect(mockGetSongById).toHaveBeenCalledWith("song2")
      })

      it("should return null when one song does not exist", async () => {
        const mockSong1 = { id: "song1", title: "Song 1" } as SongDocument

        mockGetSongById.mockResolvedValueOnce(mockSong1).mockResolvedValueOnce(null)

        const result = await validateAssociatedEntities(
          ["song1", "song2"],
          "song"
        )

        expect(result).toBeNull()
        expect(mockGetSongById).toHaveBeenCalledTimes(2)
      })
    })

    describe("empty array handling", () => {
      it("should return empty array when no IDs are provided", async () => {
        const result = await validateAssociatedEntities([], "artist")

        expect(result).toEqual([])
        expect(mockGetArtistById).not.toHaveBeenCalled()
      })
    })

    describe("error handling", () => {
      it("should log and throw error when database call fails", async () => {
        const mockError = new Error("Database connection failed")
        mockGetArtistById.mockRejectedValueOnce(mockError)

        await expect(
          validateAssociatedEntities(["artist1"], "artist")
        ).rejects.toThrow("Error validating associated entity: Error: Database connection failed")

        expect(mockLoggerError).toHaveBeenCalledWith(
          `Error validating associated entity: ${mockError}`
        )
      })

      it("should throw error when multiple database calls fail", async () => {
        const mockError = new Error("Network timeout")
        mockGetAlbumById.mockRejectedValue(mockError)

        await expect(
          validateAssociatedEntities(["album1", "album2"], "album")
        ).rejects.toThrow("Error validating associated entity: Error: Network timeout")

        expect(mockLoggerError).toHaveBeenCalled()
      })
    })

    describe("concurrent validation", () => {
      it("should validate multiple entities in parallel", async () => {
        const mockArtist1 = { id: "artist1", name: "Artist 1" } as ArtistDocument
        const mockArtist2 = { id: "artist2", name: "Artist 2" } as ArtistDocument
        const mockArtist3 = { id: "artist3", name: "Artist 3" } as ArtistDocument

        mockGetArtistById
          .mockResolvedValueOnce(mockArtist1)
          .mockResolvedValueOnce(mockArtist2)
          .mockResolvedValueOnce(mockArtist3)

        const result = await validateAssociatedEntities(
          ["artist1", "artist2", "artist3"],
          "artist"
        )

        expect(result).toEqual([mockArtist1, mockArtist2, mockArtist3])
        expect(mockGetArtistById).toHaveBeenCalledTimes(3)
      })
    })
  })
})
