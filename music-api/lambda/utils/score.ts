import { Rating } from "../schemas"

export const updateScoreBasedOnAlbumRatings = (
  currentScore: number,
  rating: Rating
) => {
  switch (rating) {
    case Rating.GOLD:
      return currentScore + 10
    case Rating.SILVER:
      return currentScore + 5
    default:
      return currentScore
  }
}
