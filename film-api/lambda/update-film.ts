import mongoose from "mongoose"
import { createApiResponse, logger } from "./utils"
import { CAST_TIERS, CastTier } from "./mongodb/models/film"
import { requireAuth } from "./auth"
import { connectToDatabase, getFilmById, updateFilm, updateDirectorStats, updateYearStats, addFilmToTopAtTierBottom, removeFilmFromTop, isEligibleRating, updateCastActorStats } from "./mongodb"

const isCastTierMap = (value: unknown): value is Record<string, CastTier> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.entries(value).every(
    ([actorId, tier]) => mongoose.isValidObjectId(actorId) && CAST_TIERS.includes(tier as CastTier),
  )

const handlerImpl = async (event: any, _userId: string) => {
  const filmId = event.pathParameters?.id

  try {
    const { rating, owned, review, castTiers } = JSON.parse(event.body)

    if (!filmId) {
      throw new Error("Film ID is missing")
    }

    if (rating !== undefined && rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
      throw new Error("Rating must be a whole number between 1 and 10")
    }

    if (castTiers !== undefined && !isCastTierMap(castTiers)) {
      throw new Error(`castTiers must map actor IDs to one of ${CAST_TIERS.join(", ")}`)
    }

    await connectToDatabase()

    const currentFilm = await getFilmById(filmId)

    if (!currentFilm) {
      throw new Error("Film not found")
    }

    if (castTiers !== undefined) {
      const castActorIds = new Set((currentFilm.cast ?? []).map((member) => member.actor.toString()))
      if (castActorIds.size === 0 || !Object.keys(castTiers).every((id) => castActorIds.has(id))) {
        throw new Error("castTiers must all be actors in the film's cast")
      }
    }

    const updatedFilm = await updateFilm(filmId, { rating, owned, review, castTiers })

    if (!updatedFilm) {
      throw new Error("Failed to update film")
    }

    // Only cascade update stats if rating changed (which affects watched status)
    if (rating !== undefined) {
      // Cascade update to all associated directors
      const directorIds = currentFilm.directors as any[]
      for (const director of directorIds) {
        // Access _id property from populated director object
        const directorId = typeof director === 'object' && director._id ? director._id.toString() : director.toString()
        await updateDirectorStats(directorId)
      }

      // Cascade update to year statistics
      await updateYearStats(currentFilm.year)

      // Sync top-films list on tier transitions
      const oldTier = isEligibleRating(currentFilm.rating) ? currentFilm.rating : null
      const newTier = isEligibleRating(updatedFilm.rating) ? updatedFilm.rating : null

      if (oldTier !== newTier) {
        if (oldTier !== null) {
          await removeFilmFromTop(filmId)
          logger.info(`Removed film ${filmId} from top films (rating tier changed from ${oldTier})`)
        }
        if (newTier !== null) {
          await addFilmToTopAtTierBottom(filmId, newTier)
          logger.info(`Added film ${filmId} to top films at bottom of tier ${newTier}`)
        }
      }
    }

    // Last, so a failing actor lookup cannot skip the year and top-film updates.
    if (rating !== undefined || castTiers !== undefined) {
      await updateCastActorStats(currentFilm.cast)
    }

    return createApiResponse(200, {
      id: updatedFilm.id,
      title: updatedFilm.title,
      rating: updatedFilm.rating,
      watched: updatedFilm.watched,
      owned: updatedFilm.owned,
      review: updatedFilm.review,
      message: "Successfully updated film",
    })
  } catch (error) {
    logger.error(`Error updating film: ${error}`)
    return createApiResponse(502, {
      message: "Could not update film",
    })
  }
}

const handler = requireAuth(handlerImpl)

export { handler }
