import mongoose from "mongoose"

export interface SongDocument extends mongoose.Document {
  title: string // title of the album
  displayTitle: string // title of the album to be displayed in the client
  year: number // the year the album was released
  album?: string // {optional} the id of the album the song was released on
  albumDisplayTitle?: string // {optional} the display title of the album the song was released on
  artists: string[] // array of ids that represent the artists present on the song
  artistDisplayName: string // the display name of the artist of the song
}

// Type for creating new songs (excludes mongoose Document fields)
export type SongData = Omit<SongDocument, keyof mongoose.Document>

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  displayTitle: { type: String, required: true },
  year: { type: Number, required: true },
  album: { type: String, default: null },
  albumDisplayTitle: { type: String, default: null },
  artists: { type: [String], required: true },
  artistDisplayName: { type: String, required: true },
})

export default mongoose.model<SongDocument>("Song", songSchema, "songs")
