import mongoose from "mongoose"
import { normalizeForSearch } from "../../utils/search"

export interface CastMember {
  actor: mongoose.Types.ObjectId // Actor reference
  character?: string // Role played (from TMDb)
  order: number // TMDb billing position
}

export interface ProductionCompany {
  tmdbId: string
  name: string
  logoPath?: string
  originCountry?: string
}

export interface FilmCollection {
  tmdbId: string
  name: string
}

export interface FilmDocument extends mongoose.Document {
  title: string // Primary title (from TMDb)
  searchTitle?: string // Lowercased and accent-folded title for searching
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
  review?: string // User's review/notes
  cast?: CastMember[] // Top-billed credited cast (from TMDb)
  productionCompanies?: ProductionCompany[] // From TMDb
  tmdbCollection?: FilmCollection // Franchise the film belongs to (from TMDb)
}

// Type for creating new films (excludes mongoose Document fields)
export type FilmData = Omit<FilmDocument, keyof mongoose.Document>

const castMemberSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "Actor", required: true },
    character: { type: String },
    order: { type: Number, required: true },
  },
  { _id: false },
)

const productionCompanySchema = new mongoose.Schema(
  {
    tmdbId: { type: String, required: true },
    name: { type: String, required: true },
    logoPath: { type: String },
    originCountry: { type: String },
  },
  { _id: false },
)

const filmCollectionSchema = new mongoose.Schema(
  {
    tmdbId: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
)

const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  searchTitle: { type: String },
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
  review: { type: String },
  // Left unset rather than [] so the backfill can tell "never fetched" from "no cast".
  cast: { type: [castMemberSchema], default: undefined },
  productionCompanies: { type: [productionCompanySchema], default: undefined },
  tmdbCollection: { type: filmCollectionSchema },
})

// Derived here so every path that saves a film keeps it in step with the title.
filmSchema.pre("validate", function () {
  if (this.isModified("title")) {
    this.searchTitle = normalizeForSearch(this.title)
  }
})

// Indexes for efficient querying
filmSchema.index({ title: 1 })
filmSchema.index({ year: 1 })
filmSchema.index({ directors: 1 })
filmSchema.index({ watched: 1 })
filmSchema.index({ rating: 1 })
filmSchema.index({ genres: 1 })
filmSchema.index({ "cast.actor": 1 })

export default mongoose.model<FilmDocument>("Film", filmSchema, "films")
