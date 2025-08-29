import _ from "lodash"
import { createApiResponse, logger, escapeRegex } from "./utils"
import {
  connectToDatabase,
  findArtistsByName,
  findAlbumsByTitle,
  findSongsByTitle,
} from "./mongodb"
import { ItemType } from "./schemas"

const handler = async (event: any) => {
  logger.info("event", event)
  try {
    const searchString = event.queryStringParameters.searchString
    const itemType = event.queryStringParameters.itemType as ItemType
    logger.info("searchString", searchString)
    logger.info("itemType", itemType)

    if (!searchString) {
      throw new Error("Missing a searchString parameter")
    }
    if (!itemType) {
      throw new Error("Missing an itemType parameter")
    }

    const safeSearch = escapeRegex(searchString)
    const searchStringAsLower = _.toLower(safeSearch)

    let resultItems
    connectToDatabase()
    if (itemType === "artist") {
      resultItems = await findArtistsByName(searchStringAsLower)
    } else if (itemType === "album") {
      resultItems = await findAlbumsByTitle(searchStringAsLower)
    } else if (itemType === "song") {
      resultItems = await findSongsByTitle(searchStringAsLower)
    }

    if (!resultItems || resultItems.length === 0) {
      throw new Error("No items found")
    }

    return createApiResponse(200, {
      result: resultItems,
      message: "Successfully retrieved matches",
    })
  } catch (error) {
    if (error instanceof Error) {
      return createApiResponse(404, {
        error: error.message,
      })
    }

    return createApiResponse(502, {
      error: "An unknown error occurred",
    })
  }
}

export { handler }
