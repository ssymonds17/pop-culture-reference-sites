import { createApiResponse, logger } from "./utils"
import { connectToDatabase, getActorByTmdbPersonId } from "./mongodb"

const handler = async (event: any) => {
  const tmdbPersonId = event.pathParameters?.tmdbPersonId

  try {
    if (!tmdbPersonId) {
      throw new Error("TMDb Person ID is missing")
    }

    await connectToDatabase()

    const actor = await getActorByTmdbPersonId(tmdbPersonId)

    if (!actor) {
      return createApiResponse(404, {
        message: "Actor not found",
      })
    }

    return createApiResponse(200, { data: actor })
  } catch (error) {
    logger.error(`Error getting actor: ${error}`)
    return createApiResponse(502, {
      message: "Could not get actor",
    })
  }
}

export { handler }
