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

// Utility: Get director details from TMDb
const getTmdbPersonDetails = async (tmdbPersonId) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/person/${tmdbPersonId}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error getting TMDb person details for ID ${tmdbPersonId}:`, error.message)
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
  } else {
    console.log(`  Found existing director: ${director.displayName}`)
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

// Main function to add director to film
const addDirectorToFilm = async (filmTmdbId, directorTmdbPersonId) => {
  console.log(`\nAdding director to film...`)
  console.log(`Film TMDb ID: ${filmTmdbId}`)
  console.log(`Director TMDb Person ID: ${directorTmdbPersonId}`)

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { dbName: "films" })
    console.log("Connected to MongoDB")

    // 1. Find the film by TMDb ID
    console.log("\nLooking for film in database...")
    const film = await Film.findOne({ tmdbId: filmTmdbId.toString() })

    if (!film) {
      console.log(`\n❌ Film with TMDb ID ${filmTmdbId} not found in database`)
      console.log("   Make sure the film has been imported first")
      console.log("   Use: npm run manual-import <tmdbId> <watched> <rating> <owned>")
      await mongoose.disconnect()
      return
    }

    console.log(`Found film: ${film.title} (${film.year})`)

    // 2. Fetch director details from TMDb
    console.log("\nFetching director details from TMDb...")
    const directorDetails = await getTmdbPersonDetails(directorTmdbPersonId)

    if (!directorDetails) {
      console.log(`\n❌ Could not get director details from TMDb for person ID ${directorTmdbPersonId}`)
      console.log("   Verify the TMDb person ID is correct")
      await mongoose.disconnect()
      return
    }

    console.log(`Found director: ${directorDetails.name}`)

    // 3. Find or create director in database
    console.log("\nProcessing director record...")
    const director = await findOrCreateDirector(
      directorTmdbPersonId.toString(),
      directorDetails.name
    )

    // 4. Check if director is already linked to this film
    const directorAlreadyLinked = film.directors.some(
      (d) => d.toString() === director._id.toString()
    )

    if (directorAlreadyLinked) {
      console.log(`\n⚠️  Director "${director.displayName}" is already linked to this film`)
      await mongoose.disconnect()
      return
    }

    // 5. Add director to film's directors array
    console.log("\nLinking director to film...")
    film.directors.push(director._id)
    await film.save()

    // 6. Add film to director's films array if not already there
    const filmAlreadyInDirector = director.films.some(
      (f) => f.toString() === film._id.toString()
    )

    if (!filmAlreadyInDirector) {
      await Director.findByIdAndUpdate(director._id, {
        $push: { films: film._id },
      })
    }

    // 7. Update director statistics
    console.log("Updating director statistics...")
    await updateDirectorStats(director._id)

    // 8. Success output
    console.log(`\n✅ Successfully added director to film`)
    console.log(`   Film: ${film.title} (${film.year})`)
    console.log(`   Director: ${director.displayName}`)
    console.log(`   Film now has ${film.directors.length} director(s)`)

    await mongoose.disconnect()
    console.log("\nDisconnected from MongoDB")
    console.log("Done!")
  } catch (error) {
    console.error(`\n❌ Error:`, error.message)
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect()
    }
    process.exit(1)
  }
}

// Parse command line arguments
const filmTmdbId = process.argv[2]
const directorTmdbPersonId = process.argv[3]

// Validate arguments
if (!filmTmdbId || !directorTmdbPersonId) {
  console.log("Add Director to Existing Film")
  console.log("=" .repeat(50))
  console.log("\nUsage: node addDirectorToFilm.mjs <filmTmdbId> <directorTmdbPersonId>")
  console.log("\nArguments:")
  console.log("  filmTmdbId           - TMDb movie ID (required)")
  console.log("  directorTmdbPersonId - TMDb person ID (required)")
  console.log("\nExamples:")
  console.log("  node addDirectorToFilm.mjs 44315 4627")
  console.log("  node addDirectorToFilm.mjs 278 4027")
  console.log("\nHow to find IDs:")
  console.log("  Film TMDb ID:")
  console.log("    - Search film on https://www.themoviedb.org/")
  console.log("    - URL: themoviedb.org/movie/44315-october")
  console.log("    - ID: 44315")
  console.log("\n  Director TMDb Person ID:")
  console.log("    - Go to the film's page on TMDb")
  console.log("    - Click on the director's name in the cast/crew")
  console.log("    - URL: themoviedb.org/person/4627-sergei-eisenstein")
  console.log("    - ID: 4627")
  console.log("")
  process.exit(1)
}

// Run the function
addDirectorToFilm(filmTmdbId, directorTmdbPersonId).catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
