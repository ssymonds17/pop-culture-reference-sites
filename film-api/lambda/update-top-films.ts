import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import {
  connectToDatabase,
  updateTopFilms,
  getEligibleFilmIdsByTier,
} from "./mongodb"
import Film, { FilmDocument } from "./mongodb/models/film"

const handlerImpl = async (event: any, _userId: string) => {
  try {
    const body = JSON.parse(event.body)
    const { filmIds } = body

    if (!filmIds || !Array.isArray(filmIds)) {
      throw new Error("filmIds array is required")
    }
    if (filmIds.length === 0) {
      throw new Error("filmIds array cannot be empty")
    }

    await connectToDatabase()

    const { tens, nines, eights } = await getEligibleFilmIdsByTier()
    const eligibleIds = [...tens, ...nines, ...eights]
    const eligibleSet = new Set(eligibleIds)

    const submittedSet = new Set(filmIds.map((id: any) => id.toString()))

    if (submittedSet.size !== filmIds.length) {
      throw new Error("Duplicate film IDs found in the submitted list")
    }
    if (submittedSet.size !== eligibleSet.size) {
      throw new Error(
        `Film count mismatch: expected ${eligibleSet.size} eligible films, got ${submittedSet.size}`
      )
    }
    for (const id of filmIds) {
      if (!eligibleSet.has(id.toString())) {
        throw new Error(
          `Film ${id} is not eligible (must be rated 8, 9, or 10)`
        )
      }
    }
    for (const id of eligibleIds) {
      if (!submittedSet.has(id)) {
        throw new Error(`Missing eligible film ${id} in the submitted list`)
      }
    }

    // Tier ordering check: ratings must be non-increasing across {10, 9, 8}.
    const ratingDocs = (await Film.find({ _id: { $in: filmIds } })
      .select("_id rating")
      .exec()) as FilmDocument[]
    const ratingById = new Map<string, number>()
    ratingDocs.forEach((f) => ratingById.set(String(f._id), f.rating ?? 0))

    let previousRating = Infinity
    for (let i = 0; i < filmIds.length; i++) {
      const rating = ratingById.get(filmIds[i].toString()) ?? 0
      if (rating > previousRating) {
        throw new Error(
          `Tier ordering violated at index ${i}: a ${rating}-rated film cannot appear below a ${previousRating}-rated film`
        )
      }
      previousRating = rating
    }

    const updated = await updateTopFilms(filmIds)
    if (!updated) {
      throw new Error("Failed to update top films")
    }

    return createApiResponse(200, {
      filmIds: updated.filmIds,
      total: updated.filmIds.length,
      message: "Successfully updated top films rankings",
    })
  } catch (error) {
    logger.error(`Error updating top films: ${error}`)
    const statusCode = error instanceof Error && error.message ? 400 : 500
    return createApiResponse(statusCode, {
      message:
        error instanceof Error ? error.message : "Could not update top films",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
