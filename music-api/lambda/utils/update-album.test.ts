import { Rating } from "../mongodb/models/album"
import { updateAlbumTotal } from "./update-album"

describe("update-album utilities", () => {
  describe("updateAlbumTotal", () => {
    it("should decrement total when old rating matches the rating category", () => {
      const result = updateAlbumTotal(Rating.SILVER, 5, Rating.SILVER, Rating.GOLD)
      expect(result).toBe(4)
    })

    it("should increment total when new rating matches the rating category", () => {
      const result = updateAlbumTotal(Rating.GOLD, 3, Rating.SILVER, Rating.GOLD)
      expect(result).toBe(4)
    })

    it("should not change total when neither old nor new rating matches category", () => {
      const result = updateAlbumTotal(Rating.SILVER, 5, Rating.NONE, Rating.GOLD)
      expect(result).toBe(5)
    })

    it("should handle upgrading from NONE to SILVER", () => {
      const silverTotal = 2
      const result = updateAlbumTotal(Rating.SILVER, silverTotal, Rating.NONE, Rating.SILVER)
      expect(result).toBe(3)
    })

    it("should handle upgrading from NONE to GOLD", () => {
      const goldTotal = 1
      const result = updateAlbumTotal(Rating.GOLD, goldTotal, Rating.NONE, Rating.GOLD)
      expect(result).toBe(2)
    })

    it("should handle upgrading from SILVER to GOLD", () => {
      const silverTotal = 5
      const goldTotal = 2

      const newSilverTotal = updateAlbumTotal(Rating.SILVER, silverTotal, Rating.SILVER, Rating.GOLD)
      const newGoldTotal = updateAlbumTotal(Rating.GOLD, goldTotal, Rating.SILVER, Rating.GOLD)

      expect(newSilverTotal).toBe(4) // decremented
      expect(newGoldTotal).toBe(3)   // incremented
    })

    it("should handle downgrading from SILVER to NONE", () => {
      const silverTotal = 5
      const result = updateAlbumTotal(Rating.SILVER, silverTotal, Rating.SILVER, Rating.NONE)
      expect(result).toBe(4)
    })

    it("should handle downgrading from GOLD to SILVER", () => {
      const goldTotal = 3
      const silverTotal = 2

      const newGoldTotal = updateAlbumTotal(Rating.GOLD, goldTotal, Rating.GOLD, Rating.SILVER)
      const newSilverTotal = updateAlbumTotal(Rating.SILVER, silverTotal, Rating.GOLD, Rating.SILVER)

      expect(newGoldTotal).toBe(2)   // decremented
      expect(newSilverTotal).toBe(3) // incremented
    })

    it("should work with zero totals", () => {
      const result = updateAlbumTotal(Rating.SILVER, 0, Rating.NONE, Rating.SILVER)
      expect(result).toBe(1)
    })

    it("should not change when rating stays the same", () => {
      const result = updateAlbumTotal(Rating.GOLD, 5, Rating.GOLD, Rating.GOLD)
      expect(result).toBe(5)
    })
  })
})
