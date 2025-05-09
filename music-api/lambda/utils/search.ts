import {
  ALBUMS_TABLE_NAME,
  ARTISTS_TABLE_NAME,
  SONGS_TABLE_NAME,
} from "../dynamodb"
import { Album, Artist, Song } from "../schemas"

export type ItemType = "artist" | "album" | "song"

export const getTableName = (itemType: ItemType) => {
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

export const sortSearchResults = (
  items: Artist[] | Album[] | Song[],
  itemType: ItemType
) => {
  switch (itemType) {
    case "artist":
      return (items as Artist[])
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => b.silverAlbums - a.silverAlbums)
        .sort((a, b) => b.goldAlbums - a.goldAlbums)
        .sort((a, b) => b.totalScore - a.totalScore)
    case "album":
      return (items as Album[])
        .sort((a, b) => a.artistDisplayName.localeCompare(b.artistDisplayName))
        .sort((a, b) => a.year - b.year)
        .sort((a, b) => a.rating.localeCompare(b.rating))
    case "song":
      return (items as Song[])
        .sort((a, b) => a.year - b.year)
        .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle))
    default:
      throw new Error(`Invalid item type: ${itemType}`)
  }
}
