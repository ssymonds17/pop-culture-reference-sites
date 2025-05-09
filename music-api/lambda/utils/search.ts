import {
  ALBUMS_TABLE_NAME,
  ARTISTS_TABLE_NAME,
  SONGS_TABLE_NAME,
} from "../dynamodb"

export const getTableName = (itemType: "artist" | "album" | "song") => {
  switch (itemType) {
    case "artist":
      return ARTISTS_TABLE_NAME
    case "album":
      return ALBUMS_TABLE_NAME
    case "song":
      return SONGS_TABLE_NAME
    default:
      throw new Error(`Invalid item type: ${itemType}`)
  }
}
