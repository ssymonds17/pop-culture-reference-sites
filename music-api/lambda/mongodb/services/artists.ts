import Artist, { ArtistData } from "../models/artist"

export const createArtist = async (artistData: ArtistData) => {
  return Artist.create(artistData)
}

export const getArtists = async () => {
  return Artist.find({}, null)
    .sort({ name: 1, silverAlbums: -1, goldAlbums: -1, totalScore: -1 })
    .limit(100)
    .exec()
}

export const getArtistById = async (id: string) => {
  return Artist.findById(id, null)
}

export const findArtistsByName = async (name: string) => {
  return Artist.find(
    { name: new RegExp(name, "i") }, // case-insensitive search
    null,
    { sort: { name: 1 } }
  ).exec()
}
