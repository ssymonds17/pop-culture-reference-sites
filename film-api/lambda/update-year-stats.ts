import { createApiResponse, logger } from "./utils"
import { connectToDatabase, updateYearStats } from "./mongodb"

const handler = async (event: any) => {
  const year = event.pathParameters?.year

  try {
    if (!year) {
      throw new Error("Year is missing")
    }

    await connectToDatabase()

    const updatedYearStats = await updateYearStats(parseInt(year))

    return createApiResponse(200, {
      year: updatedYearStats.year,
      yearScore: updatedYearStats.yearScore,
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
