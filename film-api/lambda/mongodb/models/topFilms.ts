import mongoose from "mongoose"

export interface TopFilmsDocument extends mongoose.Document {
  filmIds: mongoose.Types.ObjectId[]
}

const topFilmsSchema = new mongoose.Schema(
  {
    filmIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Film",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<TopFilmsDocument>(
  "TopFilms",
  topFilmsSchema,
  "topFilms"
)
