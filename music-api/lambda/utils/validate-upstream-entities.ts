import { getAlbumById, getArtistById, getSongById } from "../mongodb"
import { AlbumDocument } from "../mongodb/models/album"
import { ArtistDocument } from "../mongodb/models/artist"
import { SongDocument } from "../mongodb/models/song"
import { ItemType } from "../schemas"
import { logger } from "./logger"

export const validateAssociatedEntities = async (
  ids: string[],
  itemType: ItemType
): Promise<ArtistDocument[] | AlbumDocument[] | SongDocument[] | null> => {
  try {
    let entityExists = true
    const allEntities = await Promise.all(
      ids.map(async (id: string) => {
        const retrievedEntity = await getRecord(id, itemType)

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

const getRecord = async (id: string, type: ItemType) => {
  switch (type) {
    case "artist":
      return await getArtistById(id)
    case "album":
      return await getAlbumById(id)
    case "song":
      return await getSongById(id)
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}
