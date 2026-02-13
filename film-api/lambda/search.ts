import { createApiResponse, logger } from "./utils"
import { connectToDatabase, findFilmsByTitle, findDirectorsByName } from "./mongodb"

const handler = async (event: any) => {
  try {
    await connectToDatabase()

    const searchString = event.queryStringParameters?.searchString
    const itemType = event.queryStringParameters?.itemType

    if (!searchString) {
      throw new Error("Search string is required")
    }

    let results: any[] = []

    if (itemType === "film" || !itemType) {
      const films = await findFilmsByTitle(searchString)
      results = [...results, ...films.map(f => ({ ...f.toObject(), type: "film" }))]
    }

    if (itemType === "director" || !itemType) {
      const directors = await findDirectorsByName(searchString)
      results = [...results, ...directors.map(d => ({ ...d.toObject(), type: "director" }))]
    }

    return createApiResponse(200, {
      data: results,
      count: results.length,
    })
  } catch (error) {
    logger.error(`Error searching: ${error}`)
    return createApiResponse(502, {
      message: "Could not perform search",
    })
  }
}

export { handler }
