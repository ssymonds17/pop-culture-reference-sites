import { getArtistById } from "../mongodb"
import { AlbumDocument } from "../mongodb/models/album"
import { ArtistDocument } from "../mongodb/models/artist"
import { SongDocument } from "../mongodb/models/song"
import { logger } from "./logger"

export const validateAssociatedEntities = async (
  ids: string[]
): Promise<ArtistDocument[] | AlbumDocument[] | SongDocument[] | null> => {
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

    return allEntities as ArtistDocument[] | AlbumDocument[] | SongDocument[]
  } catch (error) {
    logger.error(`Error validating associated entity: ${error}`)
    throw new Error(`Error validating associated entity: ${error}`)
  }
}
