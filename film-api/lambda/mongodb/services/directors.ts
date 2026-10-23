import Director from "../models/director"
import { normalizeForSearch } from "../../utils"
import { calculatePersonStats, personStatsFilter, personStatsSort } from "../models/personStats"
import { EXCLUDE_DETAIL_FIELDS, FilmDocument } from "../models/film"

export const findOrCreateDirector = async (
  tmdbPersonId: string,
  displayName: string,
  profilePath?: string,
  imdbPersonId?: string | null,
) => {
  const updates = {
    // Only overwrite with a photo TMDb has, so a gap on TMDb's side never removes one we hold.
    ...(profilePath && { profilePath }),
    ...(imdbPersonId !== undefined && { imdbPersonId }),
  }

  return Director.findOneAndUpdate(
    { tmdbPersonId },
    {
      $setOnInsert: { tmdbPersonId, name: displayName.toLowerCase(), displayName },
      ...(Object.keys(updates).length > 0 && { $set: updates }),
    },
    { upsert: true, new: true },
  ).exec()
}

// An IMDb ID of null means TMDb had none, so only people without the field need looking up.
export const findDirectorsMissingImdbId = async (tmdbPersonIds: string[]) => {
  if (tmdbPersonIds.length === 0) {
    return []
  }

  const checked = await Director.find(
    { tmdbPersonId: { $in: tmdbPersonIds }, imdbPersonId: { $exists: true } },
    { tmdbPersonId: 1 },
  ).exec()
  const checkedIds = new Set(checked.map((director) => director.tmdbPersonId))

  return tmdbPersonIds.filter((tmdbPersonId) => !checkedIds.has(tmdbPersonId))
}

export const getDirectors = async (sortBy?: string) => {
  return Director.find(personStatsFilter(sortBy))
    .sort(personStatsSort(sortBy))
    .limit(200)
    .exec()
}

export const getDirectorById = async (id: string) => {
  return Director.findById(id)
    .populate({
      path: "films",
      select: EXCLUDE_DETAIL_FIELDS,
      options: { sort: { year: -1, title: 1 } },
    })
    .exec()
}

export const getDirectorByTmdbPersonId = async (tmdbPersonId: string) => {
  return Director.findOne({ tmdbPersonId })
    .populate({
      path: "films",
      select: EXCLUDE_DETAIL_FIELDS,
      options: { sort: { year: -1, title: 1 } },
    })
    .exec()
}

export const findDirectorsByName = async (name: string) => {
  const needle = normalizeForSearch(name)
  if (!needle) {
    return []
  }

  // Accent-insensitive substring match against the stored (already lowercased)
  // name. We fold both sides to a diacritic-free form so "Bunuel" matches a
  // stored "Buñuel". Filtering in app code because a MongoDB regex cannot fold
  // accents on the stored value; the directors collection is small.
  const directors = await Director.find({}, null, {
    sort: { totalPoints: -1 },
  }).exec()

  return directors.filter((director) =>
    normalizeForSearch(director.name).includes(needle),
  )
}

export const updateDirectorStats = async (directorId: string) => {
  const director = await Director.findById(directorId)
    .populate({ path: "films", select: "watched rating" })
    .exec()

  if (!director) {
    throw new Error("Director not found")
  }

  const films = director.films as unknown as FilmDocument[]
  Object.assign(director, calculatePersonStats(films))

  return director.save()
}
