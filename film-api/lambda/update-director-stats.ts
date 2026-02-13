import { createApiResponse, logger } from "./utils"
import { connectToDatabase, updateDirectorStats } from "./mongodb"

const handler = async (event: any) => {
  const directorId = event.pathParameters?.id

  try {
    if (!directorId) {
      throw new Error("Director ID is missing")
    }

    await connectToDatabase()

    const updatedDirector = await updateDirectorStats(directorId)

    return createApiResponse(200, {
      id: updatedDirector.id,
      displayName: updatedDirector.displayName,
      totalPoints: updatedDirector.totalPoints,
      seenFilms: updatedDirector.seenFilms,
      message: "Successfully updated director stats",
    })
  } catch (error) {
    logger.error(`Error updating director stats: ${error}`)
    return createApiResponse(502, {
      message: "Could not update director stats",
    })
  }
}

export { handler }
