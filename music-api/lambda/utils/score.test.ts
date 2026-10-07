import { Rating } from "../mongodb/models/album"
import {
  ratingsMap,
  updateScoreBasedOnAlbumRatings,
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
})
