import { getRecord } from "../dynamodb"
import { logger } from "./logger"

export const validateAssociatedEntities = async (
  entityToValidate: string[],
  tableName: string
) => {
  try {
    let entityExists = true
    const allEntities = await Promise.all(
      entityToValidate.map(async (entity: string) => {
        const retrievedEntity = await getRecord(tableName, entity)

        if (!retrievedEntity) {
          entityExists = false
        }

        return retrievedEntity
      })
    )

    if (!entityExists) {
      return null
    }

    return allEntities
  } catch (error) {
    logger.error(`Error validating associated entity: ${error}`)
    throw new Error(`Error validating associated entity: ${error}`)
  }
}
