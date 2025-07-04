import { FilterQuery } from "mongoose"
import Artist, { ArtistDocument } from "../models/artist"

export const findArtist = async (query: FilterQuery<ArtistDocument>) => {
  return Artist.findOne(query, null)
}

export const getArtists = async () => {
  return Artist.find({}, null)
    .sort({ name: 1, silverAlbums: -1, goldAlbums: -1, totalScore: -1 })
    .limit(100)
    .exec()
}
