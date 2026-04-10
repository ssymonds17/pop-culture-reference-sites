import { createApiResponse, logger } from "./utils"
import { connectToDatabase, updateYearStats } from "./mongodb"

const handler = async (event: any) => {
  const year = event.pathParameters?.year

  try {
    if (!year) {
      throw new Error("Year parameter is missing")
    }

    const yearNum = Number.parseInt(year, 10)
    if (Number.isNaN(yearNum)) {
      throw new TypeError("Invalid year parameter")
    }

    await connectToDatabase()

    const updatedYearStats = await updateYearStats(yearNum)

    if (!updatedYearStats) {
      throw new Error("Failed to update year stats")
    }

    return createApiResponse(200, {
      year: updatedYearStats.year,
      songs: updatedYearStats.songs,
      goldAlbums: updatedYearStats.goldAlbums,
      silverAlbums: updatedYearStats.silverAlbums,
      totalScore: updatedYearStats.totalScore,
      message: "Successfully updated year stats",
    })
  } catch (error) {
    logger.error(`Error updating year stats: ${error}`)
    return createApiResponse(502, {
      message: "Could not update year stats",
    })
  }
}

export { handler }
