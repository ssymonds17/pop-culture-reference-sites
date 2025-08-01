import mongoose from "mongoose"

export enum Rating {
  GOLD = "GOLD",
  SILVER = "SILVER",
  NONE = "NONE",
}

export interface AlbumDocument extends mongoose.Document {
  title: string // title of the album
  displayTitle: string // title of the album to be displayed in the client
  year: number // the year the album was released
  artistDisplayName: string // the display name of the artist of the album
  artists: string[] // the ids of the artists who should be credited with this album
  songs: string[] // the ids songs on the album
  rating: Rating // what is the rating of the album (if applicable)
}

// Type for creating new albums (excludes mongoose Document fields)
export type AlbumData = Omit<AlbumDocument, keyof mongoose.Document>

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  displayTitle: { type: String, required: true },
  year: { type: Number, required: true },
  artistDisplayName: { type: String, required: true },
  artists: { type: [String], required: true },
  songs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      default: [],
    },
  ],
  rating: { type: String, enum: Object.values(Rating), default: Rating.NONE },
})

export default mongoose.model<AlbumDocument>("Album", albumSchema, "albums")
