import axios from "axios"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

// MongoDB Schemas (same as importFilms.mjs)
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  directors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Director" }],
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

const directorSchema = new mongoose.Schema({
  tmdbPersonId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  films: [{ type: mongoose.Schema.Types.ObjectId, ref: "Film" }],
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

const Film = mongoose.model("Film", filmSchema, "films")
const Director = mongoose.model("Director", directorSchema, "directors")

// Utility: Get film details from TMDb
const getTmdbFilmDetails = async (tmdbId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: "credits,external_ids",
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error getting TMDb details for ID ${tmdbId}:`, error.message)
    return null
  }
}

// Utility: Find or create director
const findOrCreateDirector = async (tmdbPersonId, name) => {
  let director = await Director.findOne({ tmdbPersonId })

  if (!director) {
    director = await Director.create({
      tmdbPersonId,
      name: name.toLowerCase(),
      displayName: name,
      films: [],
    })
    console.log(`  Created director: ${name} (${tmdbPersonId})`)
  }

  return director
}

// Utility: Update director statistics
const updateDirectorStats = async (directorId) => {
  const director = await Director.findById(directorId).populate("films")

  if (!director) return

  const films = director.films
  const totalFilms = films.length
  const watchedFilms = films.filter((f) => f.watched && f.rating)
  const seenFilms = watchedFilms.length

  const totalScore = watchedFilms.reduce((sum, f) => sum + (f.rating || 0), 0)
  const averageRating = seenFilms > 0 ? totalScore / seenFilms : undefined

  const ratingCounts = {
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
    if (rating >= 1 && rating <= 10) {
      const key = `rating${rating}`
      ratingCounts[key]++
    }
  })

  const totalPoints =
    ratingCounts.rating6 * 1 +
    ratingCounts.rating7 * 3 +
    ratingCounts.rating8 * 6 +
    ratingCounts.rating9 * 10 +
    ratingCounts.rating10 * 15

  director.totalFilms = totalFilms
  director.seenFilms = seenFilms
  director.averageRating = averageRating
  director.totalScore = totalScore
  director.ratingCounts = ratingCounts
  director.totalPoints = totalPoints

  await director.save()
}

// Main manual import function
const manualImport = async (tmdbId, watched, rating, owned) => {
  console.log(`\nManually importing film with TMDb ID: ${tmdbId}`)
  console.log(`Watched: ${watched}, Rating: ${rating || "N/A"}, Owned: ${owned}`)

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { dbName: "films" })
    console.log("Connected to MongoDB")

    // 1. Check if film already exists
    const existingFilm = await Film.findOne({ tmdbId: tmdbId.toString() })
    if (existingFilm) {
      console.log(`\n❌ Film already exists in database:`)
      console.log(`   Title: ${existingFilm.title}`)
      console.log(`   Year: ${existingFilm.year}`)
      console.log(`   MongoDB ID: ${existingFilm._id}`)
      await mongoose.disconnect()
      return
    }

    // 2. Fetch film details from TMDb
    console.log("\nFetching film details from TMDb...")
    const tmdbDetails = await getTmdbFilmDetails(tmdbId)

    if (!tmdbDetails) {
      console.log(`\n❌ Could not get TMDb details for ID ${tmdbId}`)
      console.log("   Verify the TMDb ID is correct")
      await mongoose.disconnect()
      return
    }

    console.log(`Found: ${tmdbDetails.title} (${tmdbDetails.release_date?.substring(0, 4) || "Unknown year"})`)

    // 3. Extract directors from crew data
    const directors = []
    let directorCrew = []
    if (tmdbDetails.credits && tmdbDetails.credits.crew) {
      directorCrew = tmdbDetails.credits.crew.filter((c) => c.job === "Director")

      console.log(`\nProcessing ${directorCrew.length} director(s)...`)
      for (const directorData of directorCrew) {
        const director = await findOrCreateDirector(
          directorData.id.toString(),
          directorData.name
        )
        directors.push(director._id)
      }
    } else {
      console.log("\n⚠️  No directors found in TMDb crew data")
    }

    // 4. Extract year from release_date
    let year
    if (tmdbDetails.release_date) {
      year = new Date(tmdbDetails.release_date).getFullYear()
    } else {
      console.log("⚠️  No release date found in TMDb, year will be missing")
      year = null
    }

    // 5. Create film document
    const film = await Film.create({
      title: tmdbDetails.title,
      year: year,
      directors: directors,
      watched: watched,
      rating: rating,
      owned: owned,
      genres: tmdbDetails.genres ? tmdbDetails.genres.map((g) => g.name) : [],
      language: tmdbDetails.original_language,
      duration: tmdbDetails.runtime,
      tmdbId: tmdbId.toString(),
      imdbId: tmdbDetails.external_ids?.imdb_id,
      posterPath: tmdbDetails.poster_path,
      overview: tmdbDetails.overview,
      voteAverage: tmdbDetails.vote_average,
      originalTitle: tmdbDetails.title, // Store TMDb title as original
    })

    // 6. Link film to directors and update their stats
    for (const directorId of directors) {
      await Director.findByIdAndUpdate(directorId, {
        $push: { films: film._id },
      })
      await updateDirectorStats(directorId)
    }

    // 7. Success output
    console.log(`\n✅ Successfully imported: ${film.title} (${film.year})`)
    console.log(`   MongoDB ID: ${film._id}`)
    if (directorCrew.length > 0) {
      console.log(`   Directors: ${directorCrew.map((d) => d.name).join(", ")}`)
    }
    if (film.genres.length > 0) {
      console.log(`   Genres: ${film.genres.join(", ")}`)
    }
    console.log(`   Watched: ${film.watched}, Rating: ${film.rating || "N/A"}, Owned: ${film.owned}`)

    await mongoose.disconnect()
    console.log("\nDisconnected from MongoDB")
    console.log("Import complete!")
  } catch (error) {
    console.error(`\n❌ Error during import:`, error.message)
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
    }
    process.exit(1)
  }
}

// Parse command line arguments
const tmdbId = process.argv[2]
const watched = process.argv[3] === "true"
const ratingArg = process.argv[4]
const rating = ratingArg && ratingArg !== "null" && ratingArg !== "undefined" ? parseInt(ratingArg) : undefined
const owned = process.argv[5] === "true"

// Validate arguments
if (!tmdbId) {
  console.log("Manual Film Import by TMDb ID")
  console.log("=" .repeat(50))
  console.log("\nUsage: node manualImportByTmdbId.mjs <tmdbId> <watched> [rating] [owned]")
  console.log("\nArguments:")
  console.log("  tmdbId   - TMDb movie ID (required)")
  console.log("  watched  - true/false (required)")
  console.log("  rating   - 1-10 or null (optional)")
  console.log("  owned    - true/false (required)")
  console.log("\nExamples:")
  console.log("  node manualImportByTmdbId.mjs 44315 true 5 true")
  console.log("  node manualImportByTmdbId.mjs 278 true 9 false")
  console.log("  node manualImportByTmdbId.mjs 550 false null false")
  console.log("\nHow to find TMDb ID:")
  console.log("  1. Search for the film on https://www.themoviedb.org/")
  console.log("  2. The URL contains the ID: themoviedb.org/movie/44315-october")
  console.log("  3. The ID is the number: 44315")
  console.log("")
  process.exit(1)
}

// Validate rating if provided
if (rating !== undefined && (rating < 1 || rating > 10)) {
  console.error(`Error: Rating must be between 1 and 10 (got: ${rating})`)
  process.exit(1)
}

// Run the import
manualImport(tmdbId, watched, rating, owned).catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
