import mongoose from "mongoose"

export interface FilmDocument extends mongoose.Document {
  title: string // Primary title (from TMDb)
  year: number // Release year
  directors: mongoose.Types.ObjectId[] // Array of Director IDs
  watched: boolean // Seen status
  rating?: number // 1-10 (optional if unwatched)
  owned: boolean // Whether user owns the film
  genres: string[] // From TMDb API
  language?: string // From TMDb
  duration?: number // Runtime in minutes
  tmdbId: string // TMDb movie ID (unique)
  imdbId?: string // From TMDb external_ids
  posterPath?: string // TMDb poster
  overview?: string // Description
  voteAverage?: number // TMDb rating
  originalTitle?: string // User's original title entry from CSV
}

// Type for creating new films (excludes mongoose Document fields)
export type FilmData = Omit<FilmDocument, keyof mongoose.Document>

const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  directors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Director",
      default: [],
    },
  ],
  watched: { type: Boolean, required: true, default: false },
  rating: { type: Number, min: 1, max: 10 },
  owned: { type: Boolean, default: false },
  genres: [{ type: String }],
  language: { type: String },
  duration: { type: Number },
  tmdbId: { type: String, required: true, unique: true },
  imdbId: { type: String },
  posterPath: { type: String },
  overview: { type: String },
  voteAverage: { type: Number },
  originalTitle: { type: String },
})

// Indexes for efficient querying
filmSchema.index({ title: 1 })
filmSchema.index({ year: 1 })
filmSchema.index({ directors: 1 })
filmSchema.index({ watched: 1 })
filmSchema.index({ rating: 1 })
filmSchema.index({ genres: 1 })

export default mongoose.model<FilmDocument>("Film", filmSchema, "films")
