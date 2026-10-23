import mongoose from "mongoose"
import { PersonStats, personStatsSchemaFields } from "./personStats"

// Films are linked from Film.cast rather than stored here; see services/actors.ts.
export interface ActorDocument extends mongoose.Document, PersonStats {
  tmdbPersonId: string // TMDb unique identifier (primary key)
  name: string // Lowercased and accent-folded for searching
  displayName: string // Display format (from TMDb)
  profilePath?: string // TMDb profile image
  imdbPersonId?: string | null // IMDb "nm" ID from TMDb; null when TMDb has none
}

const actorSchema = new mongoose.Schema({
  tmdbPersonId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  profilePath: { type: String },
  imdbPersonId: { type: String },
  ...personStatsSchemaFields,
})

actorSchema.index({ name: 1 })
actorSchema.index({ totalPoints: -1 })
actorSchema.index({ seenFilms: -1 })

export default mongoose.model<ActorDocument>("Actor", actorSchema, "actors")
