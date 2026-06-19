import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required (set it in .env)")
  process.exit(1)
}

const filmSchema = new mongoose.Schema({
  title: String,
  year: Number,
  rating: { type: Number, min: 1, max: 10 },
})

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
  { timestamps: true }
)

const Film = mongoose.model("Film", filmSchema, "films")
const TopFilms = mongoose.model("TopFilms", topFilmsSchema, "topFilms")

const syncTopFilms = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: "films" })
  console.log("Connected to MongoDB")

  const eligible = await Film.find({ rating: { $in: [8, 9, 10] } })
    .select("_id rating year title")
    .sort({ year: 1 })
    .exec()

  const tens = []
  const nines = []
  const eights = []
  const tierOf = new Map()
  eligible.forEach((f) => {
    const id = String(f._id)
    tierOf.set(id, f.rating)
    if (f.rating === 10) tens.push(id)
    else if (f.rating === 9) nines.push(id)
    else if (f.rating === 8) eights.push(id)
  })
  const eligibleSet = new Set([...tens, ...nines, ...eights])

  console.log(
    `Eligible films: ${tens.length} tens, ${nines.length} nines, ${eights.length} eights`
  )

  const existing = await TopFilms.findOne().exec()

  if (!existing) {
    const ordered = [...tens, ...nines, ...eights]
    await TopFilms.create({ filmIds: ordered })
    console.log(`Created topFilms with ${ordered.length} films`)
  } else {
    const preserved = { 10: [], 9: [], 8: [] }
    const seen = new Set()
    for (const id of existing.filmIds) {
      const idStr = id.toString()
      if (!eligibleSet.has(idStr) || seen.has(idStr)) continue
      const tier = tierOf.get(idStr)
      if (!tier) continue
      preserved[tier].push(idStr)
      seen.add(idStr)
    }
    const appendMissing = (tier, ids) => {
      ids.forEach((id) => {
        if (!seen.has(id)) {
          preserved[tier].push(id)
          seen.add(id)
        }
      })
    }
    appendMissing(10, tens)
    appendMissing(9, nines)
    appendMissing(8, eights)

    const finalIds = [...preserved[10], ...preserved[9], ...preserved[8]]
    existing.filmIds = finalIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    )
    await existing.save()
    console.log(
      `Updated topFilms: preserved ${
        preserved[10].length + preserved[9].length + preserved[8].length
      } films across all tiers`
    )
  }

  await mongoose.disconnect()
  console.log("Disconnected from MongoDB")
}

syncTopFilms().catch((error) => {
  console.error("Error syncing top films:", error)
  mongoose.disconnect().finally(() => process.exit(1))
})
