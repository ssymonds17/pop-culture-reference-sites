import mongoose from "mongoose"
import { PersonStats, personStatsSchemaFields } from "./personStats"

export interface DirectorDocument extends mongoose.Document, PersonStats {
  tmdbPersonId: string // TMDb unique identifier (primary key)
  name: string // Lowercase for searching
  displayName: string // Display format (from TMDb)
  profilePath?: string // TMDb profile image
  films: mongoose.Types.ObjectId[] // Film references
}

const directorSchema = new mongoose.Schema({
  tmdbPersonId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  profilePath: { type: String },
  films: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Film",
      default: [],
    },
  ],
  ...personStatsSchemaFields,
})

// Indexes for efficient querying
directorSchema.index({ name: 1 })
directorSchema.index({ totalPoints: -1 })
directorSchema.index({ seenFilms: -1 })

export default mongoose.model<DirectorDocument>(
  "Director",
  directorSchema,
  "directors"
)
