import mongoose from "mongoose"
import TopFilms from "../models/topFilms"
import Film, { FilmDocument } from "../models/film"

export const ELIGIBLE_RATINGS = [10, 9, 8] as const
export type EligibleRating = (typeof ELIGIBLE_RATINGS)[number]

export const isEligibleRating = (
  rating: number | null | undefined
): rating is EligibleRating =>
  rating === 8 || rating === 9 || rating === 10

export const getTopFilms = async () => {
  return TopFilms.findOne().populate("filmIds").exec()
}

export const updateTopFilms = async (filmIds: string[]) => {
  return TopFilms.findOneAndUpdate(
    {},
    { filmIds },
    { upsert: true, new: true }
  ).exec()
}

export const removeFilmFromTop = async (filmId: string) => {
  const topFilms = await TopFilms.findOne().exec()
  if (!topFilms) return null

  const initialLength = topFilms.filmIds.length
  topFilms.filmIds = topFilms.filmIds.filter(
    (id) => id.toString() !== filmId.toString()
  ) as typeof topFilms.filmIds

  if (topFilms.filmIds.length < initialLength) {
    return topFilms.save()
  }
  return topFilms
}

/**
 * Insert the film at the bottom of its rating tier.
 * Order invariant: ratings are non-increasing across {10, 9, 8}, so the bottom
 * of a tier is the first position whose existing rating is strictly less than
 * the new film's rating, or the end of the array if no such position exists.
 */
export const addFilmToTopAtTierBottom = async (
  filmId: string,
  rating: number
) => {
  if (!isEligibleRating(rating)) return null

  const topFilms = await TopFilms.findOne().exec()
  const filmObjectId = new mongoose.Types.ObjectId(filmId)

  if (!topFilms) {
    return TopFilms.create({ filmIds: [filmObjectId] })
  }

  if (topFilms.filmIds.some((id) => id.toString() === filmId.toString())) {
    return topFilms
  }

  const existingIds = topFilms.filmIds.map((id) => id.toString())
  const films = (await Film.find({ _id: { $in: existingIds } })
    .select("_id rating")
    .exec()) as FilmDocument[]

  const ratingById = new Map<string, number>()
  films.forEach((f) => ratingById.set(String(f._id), f.rating ?? 0))

  let insertAt = topFilms.filmIds.length
  for (let i = 0; i < topFilms.filmIds.length; i++) {
    const existingRating = ratingById.get(topFilms.filmIds[i].toString()) ?? 0
    if (existingRating < rating) {
      insertAt = i
      break
    }
  }

  topFilms.filmIds.splice(insertAt, 0, filmObjectId)
  return topFilms.save()
}

export interface EligibleByTier {
  tens: string[]
  nines: string[]
  eights: string[]
}

/**
 * All films currently rated 8, 9, or 10, grouped by tier and sorted by year
 * ascending within each tier. The deterministic within-tier order is only used
 * for the initial seeding and as a reference for validation.
 */
export const getEligibleFilmIdsByTier = async (): Promise<EligibleByTier> => {
  const films = (await Film.find({ rating: { $in: ELIGIBLE_RATINGS as readonly number[] } })
    .select("_id rating year")
    .sort({ year: 1 })
    .exec()) as FilmDocument[]

  const tens: string[] = []
  const nines: string[] = []
  const eights: string[] = []

  films.forEach((f) => {
    const id = String(f._id)
    if (f.rating === 10) tens.push(id)
    else if (f.rating === 9) nines.push(id)
    else if (f.rating === 8) eights.push(id)
  })

  return { tens, nines, eights }
}

/**
 * Reconcile the topFilms list with current film ratings.
 *
 * If no document exists, create one with all eligible films ordered
 * 10s -> 9s -> 8s, each tier sorted by year ascending.
 *
 * If a document exists, preserve the existing order for films that are still
 * eligible, then append any newly-eligible films at the bottom of their tier.
 */
export const syncTopFilmsWithRatings = async () => {
  const { tens, nines, eights } = await getEligibleFilmIdsByTier()
  const eligibleAll = [...tens, ...nines, ...eights]
  const eligibleSet = new Set(eligibleAll)
  const tierOf = new Map<string, EligibleRating>()
  tens.forEach((id) => tierOf.set(id, 10))
  nines.forEach((id) => tierOf.set(id, 9))
  eights.forEach((id) => tierOf.set(id, 8))

  const topFilms = await TopFilms.findOne().exec()

  if (!topFilms) {
    return TopFilms.create({ filmIds: eligibleAll })
  }

  const preservedByTier: Record<EligibleRating, string[]> = { 10: [], 9: [], 8: [] }
  const seen = new Set<string>()
  for (const id of topFilms.filmIds) {
    const idStr = id.toString()
    if (!eligibleSet.has(idStr) || seen.has(idStr)) continue
    const tier = tierOf.get(idStr)
    if (!tier) continue
    preservedByTier[tier].push(idStr)
    seen.add(idStr)
  }

  const appendIfMissing = (tier: EligibleRating, ids: string[]) => {
    ids.forEach((id) => {
      if (!seen.has(id)) {
        preservedByTier[tier].push(id)
        seen.add(id)
      }
    })
  }
  appendIfMissing(10, tens)
  appendIfMissing(9, nines)
  appendIfMissing(8, eights)

  topFilms.filmIds = [
    ...preservedByTier[10],
    ...preservedByTier[9],
    ...preservedByTier[8],
  ].map((id) => new mongoose.Types.ObjectId(id)) as typeof topFilms.filmIds

  return topFilms.save()
}
