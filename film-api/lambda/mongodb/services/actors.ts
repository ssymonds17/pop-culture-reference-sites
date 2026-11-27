import Actor from "../models/actor"
import type mongoose from "mongoose"
import Film, { CastMember, CastTier } from "../models/film"
import { calculatePersonStats, personStatsFilter, personStatsSort } from "../models/personStats"
import { escapeRegex, normalizeForSearch } from "../../utils"

export const findOrCreateActor = async (
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

  return Actor.findOneAndUpdate(
    { tmdbPersonId },
    {
      $setOnInsert: {
        tmdbPersonId,
        name: normalizeForSearch(displayName),
        displayName,
      },
      ...(Object.keys(updates).length > 0 && { $set: updates }),
    },
    { upsert: true, new: true },
  ).exec()
}

// An IMDb ID of null means TMDb had none, so only people without the field need looking up.
export const findActorsMissingImdbId = async (tmdbPersonIds: string[]) => {
  if (tmdbPersonIds.length === 0) {
    return []
  }

  const checked = await Actor.find(
    { tmdbPersonId: { $in: tmdbPersonIds }, imdbPersonId: { $exists: true } },
    { tmdbPersonId: 1 },
  ).exec()
  const checkedIds = new Set(checked.map((actor) => actor.tmdbPersonId))

  return tmdbPersonIds.filter((tmdbPersonId) => !checkedIds.has(tmdbPersonId))
}

// The share of a film's points each tier earns. Keep each to one decimal place: totalPoints is
// rounded to one, and the backfill sums in a different order.
export const TIER_POINTS: Record<CastTier, number> = { lead: 1, major: 0.7, supporting: 0.4, minor: 0.2 }
const UNSET_TIER: CastTier = "supporting"

const rolesOf = (cast: CastMember[] | undefined, actorId: mongoose.Types.ObjectId) =>
  (cast ?? []).filter((member) => member.actor.toString() === actorId.toString())

// An actor with several roles in a film takes the highest tier among them.
const highestTier = (tiers: CastTier[]) =>
  tiers.reduce<CastTier | undefined>(
    (best, tier) => (!best || TIER_POINTS[tier] > TIER_POINTS[best] ? tier : best),
    undefined,
  )

// Undefined when none of the actor's roles has a tier.
const storedTierIn = (cast: CastMember[] | undefined, actorId: mongoose.Types.ObjectId) =>
  highestTier(rolesOf(cast, actorId).flatMap((member) => (member.tier ? [member.tier] : [])))

// An untiered role still earns points, as supporting.
const scoringTierIn = (cast: CastMember[] | undefined, actorId: mongoose.Types.ObjectId) =>
  highestTier(rolesOf(cast, actorId).map((member) => member.tier ?? UNSET_TIER)) ?? UNSET_TIER

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

  // Loads `cast` only to work out the actor's role, then drops it to keep the response small.
  const films = await Film.find({ "cast.actor": actor._id })
    .select("-productionCompanies -tmdbCollection")
    .sort({ year: -1, title: 1 })
    .populate("directors")
    .exec()

  return {
    ...actor.toObject(),
    films: films.map((film) => {
      const { cast, ...rest } = film.toObject()
      return { ...rest, tier: storedTierIn(cast, actor._id) }
    }),
  }
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

  const films = await Film.find(
    { "cast.actor": actor._id },
    "watched rating cast.actor cast.tier",
  ).exec()
  const weightedFilms = films.map((film) => ({
    watched: film.watched,
    rating: film.rating,
    pointsWeight: TIER_POINTS[scoringTierIn(film.cast, actor._id)],
  }))
  Object.assign(actor, calculatePersonStats(weightedFilms))

  return actor.save()
}

// An actor can appear more than once when they play several roles, so recompute each only once.
export const updateCastActorStats = async (cast: CastMember[] = []) => {
  const actorIds = new Set(cast.map((member) => member.actor.toString()))

  await Promise.all([...actorIds].map((actorId) => updateActorStats(actorId)))
}
