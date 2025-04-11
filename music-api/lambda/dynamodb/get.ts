import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
} from "@aws-sdk/lib-dynamodb"
import { documentClient } from "./client"
import { Album, Artist, Song } from "../schemas"

export const getRecord = async (
  tableName: string,
  itemId: string
): Promise<Artist | Album | Song> => {
  try {
    const params: GetCommandInput = {
      TableName: tableName,
      Key: { id: itemId },
      ConsistentRead: true,
    }

    const result: GetCommandOutput = await documentClient.send(
      new GetCommand(params)
    )

    if (!result.Item) {
      throw new Error("Item not found")
    }
    return result.Item as Artist | Album | Song
  } catch (error) {
    console.error("Error retrieving item:", error)
    throw new Error("Error retrieving item")
  }
}
