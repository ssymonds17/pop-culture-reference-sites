import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getFilmById, deleteFilm, updateDirectorStats, updateYearStats, Director } from "./mongodb"

const handler = async (event: any) => {
  const filmId = event.pathParameters?.id

  try {
    if (!filmId) {
      throw new Error("Film ID is missing")
    }

    await connectToDatabase()

    const film = await getFilmById(filmId)

    if (!film) {
      return createApiResponse(404, {
        message: "Film not found",
      })
    }

    const directorIds = film.directors as any[]
    const filmYear = film.year

    // Remove film from all directors' films arrays
    for (const director of directorIds) {
      const directorId = typeof director === 'object' && director._id ? director._id.toString() : director.toString()
      await Director.findByIdAndUpdate(directorId, {
        $pull: { films: filmId },
      })
    }

    // Delete the film
    await deleteFilm(filmId)

    // Cascade update to all associated directors
    for (const director of directorIds) {
      const directorId = typeof director === 'object' && director._id ? director._id.toString() : director.toString()
      await updateDirectorStats(directorId)
    }

    // Cascade update to year statistics
    await updateYearStats(filmYear)

    return createApiResponse(200, {
      message: "Successfully deleted film",
    })
  } catch (error) {
    logger.error(`Error deleting film: ${error}`)
    return createApiResponse(502, {
      message: "Could not delete film",
    })
  }
}

export { handler }
