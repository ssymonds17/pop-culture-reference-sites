import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

// MongoDB Schemas
const filmSchema = new mongoose.Schema({
  title: String,
  year: Number,
  watched: Boolean,
  rating: Number,
  genres: [String],
})

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
      genre: String,
      count: Number,
    },
  ],
})

const Film = mongoose.model("Film", filmSchema, "films")
const YearStats = mongoose.model("YearStats", yearStatsSchema, "yearStats")

const updateYearStats = async (year) => {
  const films = await Film.find({ year })

  const totalFilms = films.length
  const watchedFilms = films.filter((f) => f.watched && f.rating)
  const watchedCount = watchedFilms.length

  const totalScore = watchedFilms.reduce((sum, f) => sum + (f.rating || 0), 0)

  const averageRating = watchedCount > 0 ? totalScore / watchedCount : undefined

  const ratingDistribution = {
    rating1: 0,
    rating2: 0,
    rating3: 0,
    rating4: 0,
    rating5: 0,
    rating6: 0,
    rating7: 0,
    rating8: 0,
    rating9: 0,
    rating10: 0,
  }

  watchedFilms.forEach((f) => {
    const rating = f.rating
    if (rating && rating >= 1 && rating <= 10) {
      const key = `rating${rating}`
      ratingDistribution[key]++
    }
  })

  const filmsRated6Plus =
    ratingDistribution.rating6 +
    ratingDistribution.rating7 +
    ratingDistribution.rating8 +
    ratingDistribution.rating9 +
    ratingDistribution.rating10

  const percentRated6Plus = watchedCount > 0 ? (filmsRated6Plus / watchedCount) * 100 : 0

  const yearScore = totalScore * (percentRated6Plus / 100)

  // Calculate top genres
  const genreCounts = {}
  films.forEach((f) => {
    f.genres.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })

  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const yearStatsData = {
    year,
    totalFilms,
    watchedFilms: watchedCount,
    averageRating,
    totalScore,
    filmsRated6Plus,
    percentRated6Plus,
    yearScore,
    ratingDistribution,
    topGenres,
  }

  await YearStats.findOneAndUpdate({ year }, yearStatsData, {
    upsert: true,
    new: true,
  })

  console.log(
    `Updated ${year}: ${watchedCount} watched, avg ${averageRating?.toFixed(2)}, score ${yearScore.toFixed(2)}`
  )
}

const updateAllYearStats = async () => {
  console.log("Updating year statistics...")

  await mongoose.connect(MONGODB_URI, { dbName: "films" })
  console.log("Connected to MongoDB")

  // Get all unique years
  const years = await Film.distinct("year")
  console.log(`Found ${years.length} unique years`)

  for (const year of years.sort()) {
    await updateYearStats(year)
  }

  await mongoose.disconnect()
  console.log("\nDisconnected from MongoDB")
  console.log("Year stats update complete!")
}

updateAllYearStats().catch((error) => {
  console.error("Error updating year stats:", error)
  process.exit(1)
})
