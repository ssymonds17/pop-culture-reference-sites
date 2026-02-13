import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getFilmById, deleteFilm, updateDirectorStats, updateYearStats } from "./mongodb"

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

    await deleteFilm(filmId)

    // Cascade update to all associated directors
    for (const directorId of directorIds) {
      await updateDirectorStats(directorId.toString())
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
