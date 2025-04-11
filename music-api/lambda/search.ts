import { ScanCommand } from "@aws-sdk/lib-dynamodb"
import { createApiResponse, logger } from "./utils"
import { documentClient } from "./dynamodb/client"
import { ARTISTS_TABLE_NAME } from "./dynamodb/constants"
import _ from "lodash"

const handler = async (event: any) => {
  logger.info("event", event)
  try {
    const searchString = event.queryStringParameters.searchString
    logger.info("searchString", searchString)

    if (!searchString) {
      throw new Error("Missing a searchString parameter")
    }

    const searchStringAsLower = _.toLower(searchString)

    const params = {
      TableName: ARTISTS_TABLE_NAME,
      FilterExpression: "contains(#name, :searchString)",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":searchString": searchStringAsLower,
      },
    }

    const result = await documentClient.send(new ScanCommand(params))

    if (!result.Items) {
      return createApiResponse(404, {
        message: "Could not find any matches",
      })
    }

    return createApiResponse(200, {
      artist: result.Items,
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
