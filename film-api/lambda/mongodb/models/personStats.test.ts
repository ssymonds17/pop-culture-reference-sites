import { calculatePersonStats } from "./personStats"

const emptyRatingCounts = {
  rating1: 0,
  rating2: 0,
  rating3: 0,
  rating4: 0,
  rating5: 0,
  rating6: 0,
  rating7: 0,
  rating8: 0,
  rating9: 0,
  rating10: 0,
}

describe("calculatePersonStats", () => {
  it("should return zeroed stats with no average for no films", () => {
    expect(calculatePersonStats([])).toEqual({
      totalFilms: 0,
      seenFilms: 0,
      averageRating: undefined,
      totalScore: 0,
      ratingCounts: emptyRatingCounts,
      totalPoints: 0,
    })
  })

  it("should count unwatched and unrated films towards total but not seen", () => {
    const stats = calculatePersonStats([
      { watched: false },
      { watched: true },
      { watched: false, rating: 8 },
    ])

    expect(stats.totalFilms).toBe(3)
    expect(stats.seenFilms).toBe(0)
    expect(stats.averageRating).toBeUndefined()
    expect(stats.totalPoints).toBe(0)
  })

  it("should weight points as 6=1, 7=3, 8=6, 9=10 and 10=15", () => {
    const stats = calculatePersonStats(
      [6, 7, 8, 9, 10].map((rating) => ({ watched: true, rating })),
    )

    expect(stats.totalPoints).toBe(35)
  })

  it("should give no points for ratings of 5 or below", () => {
    const stats = calculatePersonStats(
      [1, 2, 3, 4, 5].map((rating) => ({ watched: true, rating })),
    )

    expect(stats.totalPoints).toBe(0)
    expect(stats.seenFilms).toBe(5)
  })

  it("should count an out-of-range rating as seen but not in the rating counts", () => {
    const stats = calculatePersonStats([
      { watched: true, rating: 11 },
      { watched: true, rating: 8 },
    ])

    expect(stats.seenFilms).toBe(2)
    expect(stats.totalScore).toBe(19)
    expect(stats.ratingCounts).toEqual({ ...emptyRatingCounts, rating8: 1 })
    expect(stats.totalPoints).toBe(6)
  })

  it("should treat a watched film with a rating of 0 as unseen", () => {
    const stats = calculatePersonStats([{ watched: true, rating: 0 }])

    expect(stats.seenFilms).toBe(0)
    expect(stats.averageRating).toBeUndefined()
  })

  it("should sum, average and count the watched ratings", () => {
    const stats = calculatePersonStats([
      { watched: true, rating: 7 },
      { watched: true, rating: 9 },
      { watched: true, rating: 9 },
      { watched: false },
    ])

    expect(stats).toEqual({
      totalFilms: 4,
      seenFilms: 3,
      averageRating: 25 / 3,
      totalScore: 25,
      ratingCounts: { ...emptyRatingCounts, rating7: 1, rating9: 2 },
      totalPoints: 23,
    })
  })
})
