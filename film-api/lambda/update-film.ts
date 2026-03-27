import { createApiResponse, logger } from "./utils"
import { requireAuth } from "./auth"
import { connectToDatabase, getFilmById, updateFilm, updateDirectorStats, updateYearStats } from "./mongodb"

const handlerImpl = async (event: any, _userId: string) => {
  const filmId = event.pathParameters?.id
  const { rating, owned, review } = JSON.parse(event.body)

  try {
    if (!filmId) {
      throw new Error("Film ID is missing")
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 10)) {
      throw new Error("Rating must be between 1 and 10")
    }

    await connectToDatabase()

    const currentFilm = await getFilmById(filmId)

    if (!currentFilm) {
      throw new Error("Film not found")
    }

    const updatedFilm = await updateFilm(filmId, rating, owned, review)

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
