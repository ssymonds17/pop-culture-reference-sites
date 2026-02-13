import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getFilmById, updateFilmRating, updateDirectorStats, updateYearStats } from "./mongodb"

const handler = async (event: any) => {
  const filmId = event.pathParameters?.id
  const { rating, watched } = JSON.parse(event.body)

  try {
    if (!filmId) {
      throw new Error("Film ID is missing")
    }

    if (rating !== undefined && (rating < 1 || rating > 10)) {
      throw new Error("Rating must be between 1 and 10")
    }

    await connectToDatabase()

    const currentFilm = await getFilmById(filmId)

    if (!currentFilm) {
      throw new Error("Film not found")
    }

    const updatedFilm = await updateFilmRating(filmId, rating, watched)

    if (!updatedFilm) {
      throw new Error("Failed to update film")
    }

    // Cascade update to all associated directors
    const directorIds = currentFilm.directors as any[]
    for (const directorId of directorIds) {
      await updateDirectorStats(directorId.toString())
    }

    // Cascade update to year statistics
    await updateYearStats(currentFilm.year)

    return createApiResponse(200, {
      id: updatedFilm.id,
      title: updatedFilm.title,
      rating: updatedFilm.rating,
      watched: updatedFilm.watched,
      message: "Successfully updated film rating",
    })
  } catch (error) {
    logger.error(`Error updating film rating: ${error}`)
    return createApiResponse(502, {
      message: "Could not update film rating",
    })
  }
}

export { handler }
