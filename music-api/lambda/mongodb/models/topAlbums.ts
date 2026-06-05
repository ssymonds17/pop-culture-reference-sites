import mongoose from "mongoose"

export interface TopAlbumsDocument extends mongoose.Document {
  albumIds: string[]
}

const topAlbumsSchema = new mongoose.Schema(
  {
    albumIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<TopAlbumsDocument>(
  "TopAlbums",
  topAlbumsSchema,
  "topAlbums"
)
