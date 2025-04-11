import { UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { documentClient } from "./client"

/**
 * Generates an update expression for updating a record in DynamoDB.
 *
 * @param updateData - The object containing the fields to be updated.
 * @returns The update expression string.
 */
export const updateExpression = (updateData: Record<string, unknown>): string =>
  Object.keys(updateData)
    .map((key) => `#${key} = :${key}`)
    .join(", ")

/**
 * Generates an expression attribute names object for updating a record in DynamoDB.
 *
 * @param updateData - The partial object containing the updated data.
 * @returns An object representing the expression attribute names for the update operation.
 */
export const buildExpressionAttributeNames = (
  updateData: Record<string, unknown>,
  initialNames: Record<string, string> = {}
): Record<string, string> =>
  Object.keys(updateData).reduce((acc, key) => {
    acc[`#${key}`] = key
    return acc
  }, initialNames)

/**
 * Generates an expression attribute values object for updating a session in DynamoDB.
 *
 * @param updateData - The partial session object containing the updated data.
 * @returns An object representing the expression attribute values for the update operation.
 */
export const buildExpressionAttributeValues = (
  updateData: Record<string, unknown>,
  initialValues: Record<string, unknown> = {}
): Record<string, unknown> =>
  Object.keys(updateData).reduce((acc, key) => {
    acc[`:${key}`] = updateData[key]
    return acc
  }, initialValues)

export const updateRecord = async (
  updateData: Record<string, unknown>,
  tableName: string,
  itemId: string
) => {
  const expressionAttributeNames = buildExpressionAttributeNames(updateData)
  const expressionAttributeValues = buildExpressionAttributeValues(updateData)
  const conditionParts: string[] = ["attribute_exists(id)"]
  const conditionExpression = conditionParts.join(" AND ")

  try {
    await documentClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          id: itemId,
        },
        UpdateExpression: `SET ${updateExpression(updateData)}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: conditionExpression,
      })
    )
  } catch (error) {
    console.error("Error updating DynamoDB record:", error)
    throw new Error("Could not update record")
  }
}
