import { calculateScore } from "./score"

describe("score utilities", () => {
  describe("calculateScore", () => {
    it("should score 1 per song, 15 per gold album and 5 per silver album", () => {
      expect(calculateScore(7, 1, 2)).toBe(32)
    })

    it("should score songs alone when there are no rated albums", () => {
      expect(calculateScore(4, 0, 0)).toBe(4)
    })

    it("should return 0 when there is nothing to score", () => {
      expect(calculateScore(0, 0, 0)).toBe(0)
    })
  })
})
