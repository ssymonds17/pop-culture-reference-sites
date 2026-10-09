import mongoose from "mongoose"
import { PersonStats, personStatsSchemaFields } from "./personStats"

export interface DirectorDocument extends mongoose.Document, PersonStats {
  tmdbPersonId: string // TMDb unique identifier (primary key)
  name: string // Lowercase for searching
  displayName: string // Display format (from TMDb)
  films: mongoose.Types.ObjectId[] // Film references
}

// Type for creating new directors - only required fields, rest have defaults
export type DirectorData = {
  tmdbPersonId: string
  name: string
  displayName: string
  films?: mongoose.Types.ObjectId[]
  totalFilms?: number
  seenFilms?: number
  averageRating?: number
  totalScore?: number
  ratingCounts?: {
    rating1?: number
    rating2?: number
    rating3?: number
    rating4?: number
    rating5?: number
    rating6?: number
    rating7?: number
    rating8?: number
    rating9?: number
    rating10?: number
  }
  totalPoints?: number
}

const directorSchema = new mongoose.Schema({
  tmdbPersonId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
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
