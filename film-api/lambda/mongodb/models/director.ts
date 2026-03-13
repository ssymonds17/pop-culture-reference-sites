import mongoose from "mongoose"

export interface DirectorDocument extends mongoose.Document {
  tmdbPersonId: string // TMDb unique identifier (primary key)
  name: string // Lowercase for searching
  displayName: string // Display format (from TMDb)
  films: mongoose.Types.ObjectId[] // Film references
  totalFilms: number // Total films in DB
  seenFilms: number // Watched count
  averageRating?: number // Average of watched films
  totalScore: number // Sum of ratings
  ratingCounts: {
    rating1: number
    rating2: number
    rating3: number
    rating4: number
    rating5: number
    rating6: number
    rating7: number
    rating8: number
    rating9: number
    rating10: number
  }
  totalPoints: number // Weighted score (6=1pt, 7=3pt, 8=6pt, 9=10pt, 10=15pt)
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
  totalFilms: { type: Number, default: 0 },
  seenFilms: { type: Number, default: 0 },
  averageRating: { type: Number },
  totalScore: { type: Number, default: 0 },
  ratingCounts: {
    rating1: { type: Number, default: 0 },
    rating2: { type: Number, default: 0 },
    rating3: { type: Number, default: 0 },
    rating4: { type: Number, default: 0 },
    rating5: { type: Number, default: 0 },
    rating6: { type: Number, default: 0 },
    rating7: { type: Number, default: 0 },
    rating8: { type: Number, default: 0 },
    rating9: { type: Number, default: 0 },
    rating10: { type: Number, default: 0 },
  },
  totalPoints: { type: Number, default: 0 },
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
