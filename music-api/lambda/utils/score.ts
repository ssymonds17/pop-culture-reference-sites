import { Rating } from "../mongodb/models/album"

export const ratingsMap = {
  [Rating.NONE]: 0,
  [Rating.SILVER]: 5,
  [Rating.GOLD]: 15,
}

export const updateScoreBasedOnAlbumRatings = (
  currentScore: number,
  rating: Rating,
) => currentScore + ratingsMap[rating]
