import mongoose from "mongoose"

export interface YearStatsDocument extends mongoose.Document {
  year: number // Year (unique)
  totalFilms: number // Total films for year
  watchedFilms: number // Watched count
  averageRating?: number // Average of watched films
  totalScore: number // Sum of all ratings
  filmsRated6Plus: number // Count of films rated 6+
  percentRated6Plus: number // (filmsRated6Plus / watchedFilms) * 100
  yearScore: number // totalScore * (percentRated6Plus / 100)
  ratingDistribution: {
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
  topGenres: Array<{
    genre: string
    count: number
  }>
}

// Type for creating new year stats (excludes mongoose Document fields)
export type YearStatsData = Omit<YearStatsDocument, keyof mongoose.Document>

const yearStatsSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  totalFilms: { type: Number, default: 0 },
  watchedFilms: { type: Number, default: 0 },
  averageRating: { type: Number },
  totalScore: { type: Number, default: 0 },
  filmsRated6Plus: { type: Number, default: 0 },
  percentRated6Plus: { type: Number, default: 0 },
  yearScore: { type: Number, default: 0 },
  ratingDistribution: {
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
  topGenres: [
    {
      genre: { type: String },
      count: { type: Number },
    },
  ],
})

// Indexes for efficient querying
yearStatsSchema.index({ year: 1 })
yearStatsSchema.index({ yearScore: -1 })

export default mongoose.model<YearStatsDocument>(
  "YearStats",
  yearStatsSchema,
  "yearStats"
)
