import { Rating } from "../schemas"

export const ratingsMap = {
  [Rating.NONE]: 0,
  [Rating.SILVER]: 5,
  [Rating.GOLD]: 15,
}

export const updateScoreBasedOnAlbumRatings = (
  currentScore: number,
  rating: Rating
) => currentScore + ratingsMap[rating]

export const updateScoreBasedOnAlbumRatingUpdate = (
  currentScore: number,
  oldRating: Rating,
  newRating: Rating
) => currentScore + ratingsMap[newRating] - ratingsMap[oldRating]
