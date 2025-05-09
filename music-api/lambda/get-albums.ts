import _ from "lodash"
import {
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb"
import { createApiResponse } from "./utils/api"
import { documentClient } from "./dynamodb/client"
import { ALBUMS_TABLE_NAME } from "./dynamodb/constants"
import { logger } from "./utils"
import { sortSearchResults } from "./utils/search"
import { Album } from "./schemas"

const handler = async () => {
  const params: ScanCommandInput = {
    TableName: ALBUMS_TABLE_NAME,
  }

  try {
    const result: ScanCommandOutput = await documentClient.send(
      new ScanCommand(params)
    )

    if (!result.Items) {
      return createApiResponse(404, {
        message: "Could not find albums",
      })
    }

    const sortedItems = sortSearchResults(
      result.Items as Album[],
      "album"
    ) as Album[]
    const filteredItems = _.take(sortedItems, 250)

    return createApiResponse(200, {
      albums: filteredItems,
      message: "Successfully retrieved albums",
    })
  } catch (error) {
    logger.error("Error retrieving albums:", { error })
    return createApiResponse(404, {
      message: { message: "Could not find albums" },
    })
  }
}

export { handler }
