import mongoose from "mongoose"

export interface ArtistDocument extends mongoose.Document {
  name: string // the name of the artist
  displayName: string // title of the artist to be displayed in the client
  albums: string[] // the ids of the albums of the artist
  songs: string[] // the ids of the songs of the artist
  silverAlbums: number // how many silver rated albums this artist has
  goldAlbums: number // how many gold rated albums this artist has
  totalSongs: number // how many songs this artist has
  totalScore: number // the total score for this artist
}

// Type for creating new artists (excludes mongoose Document fields)
export type ArtistData = Omit<ArtistDocument, keyof mongoose.Document>

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  albums: { type: [String], default: [] },
  songs: { type: [String], default: [] },
  silverAlbums: { type: Number, default: 0 },
  goldAlbums: { type: Number, default: 0 },
  totalSongs: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
})

export default mongoose.model<ArtistDocument>("Artist", artistSchema, "artists")
