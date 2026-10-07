import Artist, { ArtistData } from "../models/artist"
import Album, { Rating } from "../models/album"
import Song from "../models/song"
import { calculateScore, escapeRegex, normalizeForSearch } from "../../utils"

export const createArtist = async (artistData: ArtistData) => {
  return Artist.create(artistData)
}

export const getArtists = async () => {
  return Artist.find({}, null)
    .sort({ totalScore: -1, goldAlbums: -1, silverAlbums: -1, name: 1 })
    .limit(100)
    .exec()
}

export const getArtistById = async (id: string) => {
  return Artist.findById(id, null)
}

export const getArtistByIdFull = async (id: string) => {
  return Artist.findById(id, null)
    .populate({ path: "albums", options: { sort: { year: 1, title: 1 } } })
    .populate({
      path: "songs",
      options: { sort: { year: 1, albumDisplayTitle: 1, title: 1 } },
    })
    .exec()
}

export const findArtistsByName = async (name: string) => {
  const needle = normalizeForSearch(name)
  if (!needle) {
    return []
  }

  // The stored `name` is normalised at write time (lowercased and
  // accent-folded), so we can match it directly in the database: fold the query
  // the same way, escape any regex metacharacters, and match it as a substring.
  return Artist.find(
    { name: new RegExp(escapeRegex(needle), "i") },
    null,
    { sort: { name: 1 } }
  ).exec()
}

export const addAlbumToArtist = async (artistId: string, albumId: string) => {
  return Artist.findByIdAndUpdate(artistId, {
    $addToSet: { albums: albumId },
  }).exec()
}

export const addSongToArtist = async (artistId: string, songId: string) => {
  return Artist.findByIdAndUpdate(artistId, {
    $addToSet: { songs: songId },
  }).exec()
}

export const updateArtistStats = async (id: string) => {
  const [goldAlbums, silverAlbums, totalSongs] = await Promise.all([
    Album.countDocuments({ artists: id, rating: Rating.GOLD }),
    Album.countDocuments({ artists: id, rating: Rating.SILVER }),
    Song.countDocuments({ artists: id }),
  ])
  const totalScore = calculateScore(totalSongs, goldAlbums, silverAlbums)

  return Artist.findByIdAndUpdate(
    id,
    { goldAlbums, silverAlbums, totalSongs, totalScore },
    { new: true }
  ).exec()
}
