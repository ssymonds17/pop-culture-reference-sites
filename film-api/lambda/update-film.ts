import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getFilmById, updateFilm, updateDirectorStats, updateYearStats } from "./mongodb"

const handler = async (event: any) => {
  const filmId = event.pathParameters?.id
  const { rating, owned } = JSON.parse(event.body)

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

    const updatedFilm = await updateFilm(filmId, rating, owned)

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
      owned: updatedFilm.owned,
      message: "Successfully updated film",
    })
  } catch (error) {
    logger.error(`Error updating film: ${error}`)
    return createApiResponse(502, {
      message: "Could not update film",
    })
  }
}

export { handler }
