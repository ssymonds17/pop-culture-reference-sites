import mongoose from "mongoose"

export interface YearStatsDocument extends mongoose.Document {
  year: number // Year (unique)
  songs: number // Total songs for year
  goldAlbums: number // Count of gold-rated albums
  silverAlbums: number // Count of silver-rated albums
  totalScore: number // songs * 1 + goldAlbums * 15 + silverAlbums * 5
}

// Type for creating new year stats (excludes mongoose Document fields)
export type YearStatsData = Omit<YearStatsDocument, keyof mongoose.Document>

const yearStatsSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  songs: { type: Number, default: 0 },
  goldAlbums: { type: Number, default: 0 },
  silverAlbums: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
})

// Indexes for efficient querying
yearStatsSchema.index({ totalScore: -1 })

export default mongoose.model<YearStatsDocument>(
  "YearStats",
  yearStatsSchema,
  "yearStats"
)
