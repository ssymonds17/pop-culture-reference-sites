/**
 * Generates an update expression for updating a session in DynamoDB.
 *
 * @param updateData - The partial session object containing the fields to be updated.
 * @returns The update expression string.
 */
export const updateExpression = (updateData): string =>
  Object.keys(updateData)
    .map((key) => `#${key} = :${key}`)
    .join(', ');

/**
 * Generates an expression attribute names object for updating a session in DynamoDB.
 *
 * @param updateData - The partial session object containing the updated data.
 * @returns An object representing the expression attribute names for the update operation.
 */
export const expressionAttributeNames = (
  updateData: Record<string, unknown>,
  initialNames: Record<string, string> = {}
): Record<string, string> =>
  Object.keys(updateData).reduce((acc, key) => {
    acc[`#${key}`] = key;
    return acc;
  }, initialNames);

/**
 * Generates an expression attribute values object for updating a session in DynamoDB.
 *
 * @param updateData - The partial session object containing the updated data.
 * @returns An object representing the expression attribute values for the update operation.
 */
export const expressionAttributeValues = (
  updateData: Record<string, unknown>,
  initialValues: Record<string, unknown> = {}
): Record<string, unknown> =>
  Object.keys(updateData).reduce((acc, key) => {
    acc[`:${key}`] = updateData[key];
    return acc;
  }, initialValues);
