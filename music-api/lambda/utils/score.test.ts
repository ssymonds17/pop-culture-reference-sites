import { Rating } from "../mongodb/models/album"
import {
  ratingsMap,
  updateScoreBasedOnAlbumRatings,
  updateScoreBasedOnAlbumRatingUpdate,
} from "./score"

describe("score utilities", () => {
  describe("ratingsMap", () => {
    it("should have correct values for each rating", () => {
      expect(ratingsMap[Rating.NONE]).toBe(0)
      expect(ratingsMap[Rating.SILVER]).toBe(5)
      expect(ratingsMap[Rating.GOLD]).toBe(15)
    })
  })

  describe("updateScoreBasedOnAlbumRatings", () => {
    it("should add 0 points for NONE rating", () => {
      const currentScore = 10
      const result = updateScoreBasedOnAlbumRatings(currentScore, Rating.NONE)
      expect(result).toBe(10)
    })

    it("should add 5 points for SILVER rating", () => {
      const currentScore = 10
      const result = updateScoreBasedOnAlbumRatings(currentScore, Rating.SILVER)
      expect(result).toBe(15)
    })

    it("should add 15 points for GOLD rating", () => {
      const currentScore = 10
      const result = updateScoreBasedOnAlbumRatings(currentScore, Rating.GOLD)
      expect(result).toBe(25)
    })

    it("should work with zero as current score", () => {
      const result = updateScoreBasedOnAlbumRatings(0, Rating.GOLD)
      expect(result).toBe(15)
    })
  })

  describe("updateScoreBasedOnAlbumRatingUpdate", () => {
    it("should add 5 points when upgrading from NONE to SILVER", () => {
      const currentScore = 10
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.NONE,
        Rating.SILVER
      )
      expect(result).toBe(15)
    })

    it("should add 15 points when upgrading from NONE to GOLD", () => {
      const currentScore = 10
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.NONE,
        Rating.GOLD
      )
      expect(result).toBe(25)
    })

    it("should add 10 points when upgrading from SILVER to GOLD", () => {
      const currentScore = 20
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.SILVER,
        Rating.GOLD
      )
      expect(result).toBe(30)
    })

    it("should subtract 5 points when downgrading from SILVER to NONE", () => {
      const currentScore = 20
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.SILVER,
        Rating.NONE
      )
      expect(result).toBe(15)
    })

    it("should subtract 15 points when downgrading from GOLD to NONE", () => {
      const currentScore = 30
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.GOLD,
        Rating.NONE
      )
      expect(result).toBe(15)
    })

    it("should subtract 10 points when downgrading from GOLD to SILVER", () => {
      const currentScore = 30
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.GOLD,
        Rating.SILVER
      )
      expect(result).toBe(20)
    })

    it("should not change score when rating stays the same", () => {
      const currentScore = 20
      const result = updateScoreBasedOnAlbumRatingUpdate(
        currentScore,
        Rating.SILVER,
        Rating.SILVER
      )
      expect(result).toBe(20)
    })
  })
})
