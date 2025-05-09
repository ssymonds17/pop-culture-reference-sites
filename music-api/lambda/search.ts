import _ from "lodash"
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb"
import { createApiResponse, logger } from "./utils"
import { documentClient } from "./dynamodb/client"
import { getTableName } from "./utils/search"

const handler = async (event: any) => {
  logger.info("event", event)
  try {
    const searchString = event.queryStringParameters.searchString
    const itemType = event.queryStringParameters.itemType
    logger.info("searchString", searchString)
    logger.info("itemType", itemType)

    if (!searchString) {
      throw new Error("Missing a searchString parameter")
    }
    if (!itemType) {
      throw new Error("Missing an itemType parameter")
    }

    const searchStringAsLower = _.toLower(searchString)

    const params: ScanCommandInput =
      itemType === "artist"
        ? {
            TableName: getTableName(itemType),
            FilterExpression: "contains(#name, :searchString)",
            ExpressionAttributeNames: {
              "#name": "name",
            },
            ExpressionAttributeValues: {
              ":searchString": searchStringAsLower,
            },
          }
        : {
            TableName: getTableName(itemType),
            FilterExpression: "contains(#title, :searchString)",
            ExpressionAttributeNames: {
              "#title": "title",
            },
            ExpressionAttributeValues: {
              ":searchString": searchStringAsLower,
            },
          }

    const result = await documentClient.send(new ScanCommand(params))

    if (!result.Items) {
      throw new Error("No items found")
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
