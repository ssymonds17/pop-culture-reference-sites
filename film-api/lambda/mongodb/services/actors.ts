import Actor from "../models/actor"
import Film, { CastMember, EXCLUDE_DETAIL_FIELDS } from "../models/film"
import { calculatePersonStats, personStatsFilter, personStatsSort } from "../models/personStats"
import { escapeRegex, normalizeForSearch } from "../../utils"

export const findOrCreateActor = async (
  tmdbPersonId: string,
  displayName: string,
  profilePath?: string,
) => {
  return Actor.findOneAndUpdate(
    { tmdbPersonId },
    {
      $setOnInsert: {
        tmdbPersonId,
        name: normalizeForSearch(displayName),
        displayName,
      },
      // Only overwrite with a photo TMDb has, so a gap on TMDb's side never removes one we hold.
      ...(profilePath && { $set: { profilePath } }),
    },
    { upsert: true, new: true },
  ).exec()
}

export const getActors = async (sortBy?: string) => {
  return Actor.find({ totalFilms: { $gt: 0 }, ...personStatsFilter(sortBy) })
    .sort(personStatsSort(sortBy))
    .limit(200)
    .exec()
}

export const getActorByTmdbPersonId = async (tmdbPersonId: string) => {
  const actor = await Actor.findOne({ tmdbPersonId }).exec()

  if (!actor) {
    return null
  }

  const films = await Film.find({ "cast.actor": actor._id })
    .select(EXCLUDE_DETAIL_FIELDS)
    .sort({ year: -1, title: 1 })
    .populate("directors")
    .exec()

  return { ...actor.toObject(), films }
}

export const findActorsByName = async (name: string) => {
  const needle = normalizeForSearch(name)
  if (!needle) {
    return []
  }

  // The stored `name` is folded at write time, so the folded query can be matched in the database.
  return Actor.find(
    { name: new RegExp(escapeRegex(needle), "i"), totalFilms: { $gt: 0 } },
    null,
    { sort: { totalPoints: -1 }, limit: 200 },
  ).exec()
}

export const updateActorStats = async (actorId: string) => {
  const actor = await Actor.findById(actorId).exec()

  if (!actor) {
    throw new Error("Actor not found")
  }

  const films = await Film.find({ "cast.actor": actor._id }, "watched rating").exec()
  Object.assign(actor, calculatePersonStats(films))

  return actor.save()
}

// An actor can appear more than once when they play several roles, so recompute each only once.
export const updateCastActorStats = async (cast: CastMember[] = []) => {
  const actorIds = new Set(cast.map((member) => member.actor.toString()))

  await Promise.all([...actorIds].map((actorId) => updateActorStats(actorId)))
}
