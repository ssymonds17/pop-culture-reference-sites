import { Rating } from "../mongodb/models/album"

const ratingsMap = {
  [Rating.NONE]: 0,
  [Rating.SILVER]: 5,
  [Rating.GOLD]: 15,
}

export const calculateScore = (
  songs: number,
  goldAlbums: number,
  silverAlbums: number,
) =>
  songs +
  goldAlbums * ratingsMap[Rating.GOLD] +
  silverAlbums * ratingsMap[Rating.SILVER]
