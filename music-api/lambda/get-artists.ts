import _ from "lodash"
import {
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb"
import { createApiResponse } from "./utils/api"
import { documentClient } from "./dynamodb/client"
import { ARTISTS_TABLE_NAME } from "./dynamodb/constants"
import { logger } from "./utils"
import { sortSearchResults } from "./utils/search"
import { Artist } from "./schemas"
import { connect } from "http2"
import { connectToDatabase } from "./mongodb"

const handler = async () => {
  const params: ScanCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
  }

  try {
    connectToDatabase()
    const result: ScanCommandOutput = await documentClient.send(
      new ScanCommand(params)
    )

    if (!result.Items) {
      return createApiResponse(404, {
        message: "Could not find artists",
      })
    }

    const sortedItems = sortSearchResults(
      result.Items as Artist[],
      "artist"
    ) as Artist[]
    const filteredItems = _.take(sortedItems, 100)

    return createApiResponse(200, {
      artists: filteredItems,
      message: "Successfully retrieved artists",
    })
  } catch (error) {
    logger.error("Error retrieving artists:", { error })
    return createApiResponse(404, {
      message: { message: "Could not find artists" },
    })
  }
}

export { handler }
