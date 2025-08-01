import { getArtistById } from "../mongodb"
import { ArtistDocument } from "../mongodb/models/artist"
import { logger } from "./logger"

export const validateAssociatedEntities = async (
  ids: string[]
): Promise<ArtistDocument[] | null> => {
  try {
    let entityExists = true
    const allEntities = await Promise.all(
      ids.map(async (id: string) => {
        const retrievedEntity = await getArtistById(id)

        if (!retrievedEntity) {
          entityExists = false
        }

        return retrievedEntity
      })
    )

    if (!entityExists) {
      return null
    }

    return allEntities as ArtistDocument[]
  } catch (error) {
    logger.error(`Error validating associated entity: ${error}`)
    throw new Error(`Error validating associated entity: ${error}`)
  }
}
