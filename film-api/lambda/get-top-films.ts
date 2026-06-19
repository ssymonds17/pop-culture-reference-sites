import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getTopFilms } from "./mongodb"

const handler = async () => {
  try {
    await connectToDatabase()
    const topFilms = await getTopFilms()

    if (!topFilms?.filmIds || topFilms.filmIds.length === 0) {
      return createApiResponse(200, {
        films: [],
        total: 0,
        message: "No top films found",
      })
    }

    const rankedFilms = topFilms.filmIds.map(
      (film: any, index: number) => ({
        ...film.toObject(),
        rank: index + 1,
      })
    )

    return createApiResponse(200, {
      films: rankedFilms,
      total: rankedFilms.length,
      message: "Successfully retrieved top films",
    })
  } catch (error) {
    logger.error(`Error retrieving top films: ${error}`)
    return createApiResponse(500, {
      message: "Could not retrieve top films",
    })
  }
}

export { handler }
