import fs from "fs"
import { parse } from "csv-parse"
import axios from "axios"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
const TMDB_API_KEY = process.env.TMDB_API_KEY
const CSV_FILE_PATH = process.env.CSV_FILE_PATH || "./Film List - List.csv"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const RATE_LIMIT_DELAY = 250 // 250ms = 4 requests per second

// MongoDB Schemas
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

// Utility: Delay for rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Utility: Search TMDb for a film
const searchTmdbFilm = async (title, year) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        year: year,
      },
    })

    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].id
    }

    return null
  } catch (error) {
    console.error(`Error searching TMDb for "${title}" (${year}):`, error.message)
    return null
  }
}

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

// Main import function
const importFilms = async () => {
  console.log("Starting film import process...")
  console.log(`Reading CSV from: ${CSV_FILE_PATH}`)

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI, { dbName: "films" })
  console.log("Connected to MongoDB")

  // Read and parse CSV
  const csvData = []
  const parser = fs
    .createReadStream(CSV_FILE_PATH)
    .pipe(parse({ columns: true, skip_empty_lines: true }))

  for await (const record of parser) {
    csvData.push(record)
  }

  console.log(`Loaded ${csvData.length} films from CSV`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  const failedImports = []
  const skippedDuplicates = []

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]

    const originalTitle = row.Title || row.title
    const year = parseInt(row.Year || row.year)

    // Parse 'Seen' column (TRUE/FALSE)
    const seenValue = (row.Seen || "").toString().toLowerCase()
    const watched = seenValue === "true" || seenValue === "yes"

    // Parse 'Score' column - only set if value exists and isn't empty
    let rating = undefined
    const scoreValue = row.Score
    if (scoreValue !== undefined && scoreValue !== null && scoreValue !== "") {
      rating = parseInt(scoreValue)
    }

    // Parse 'Link' column - owned if it says "Hard Drive"
    const linkValue = (row.Link || "").toString()
    const owned = linkValue === "Hard Drive"

    console.log(`\n[${i + 1}/${csvData.length}] Processing: ${originalTitle} (${year})`)
    console.log(`  Watched: ${watched}, Rating: ${rating || "N/A"}, Owned: ${owned}`)

    // Search TMDb for the film
    const tmdbId = await searchTmdbFilm(originalTitle, year)
    await delay(RATE_LIMIT_DELAY)

    if (!tmdbId) {
      console.log(`  ⚠️  Could not find on TMDb, skipping...`)
      failedImports.push({
        title: originalTitle,
        year: year,
        watched: watched,
        rating: rating,
        owned: owned,
        reason: "Not found on TMDb"
      })
      skipCount++
      continue
    }

    // Check if film already exists
    const existingFilm = await Film.findOne({ tmdbId: tmdbId.toString() })
    if (existingFilm) {
      console.log(`  ℹ️  Film already exists in database, skipping...`)
      console.log(`      Existing: "${existingFilm.title}" (${existingFilm.year})`)
      skippedDuplicates.push({
        csvTitle: originalTitle,
        csvYear: year,
        watched: watched,
        rating: rating,
        owned: owned,
        tmdbId: tmdbId.toString(),
        existingFilmTitle: existingFilm.title,
        existingFilmYear: existingFilm.year,
        existingFilmId: existingFilm._id.toString(),
        reason: "Already exists in database"
      })
      skipCount++
      continue
    }

    // Get detailed film information
    const tmdbDetails = await getTmdbFilmDetails(tmdbId)
    await delay(RATE_LIMIT_DELAY)

    if (!tmdbDetails) {
      console.log(`  ⚠️  Could not get TMDb details, skipping...`)
      failedImports.push({
        title: originalTitle,
        year: year,
        watched: watched,
        rating: rating,
        owned: owned,
        reason: "Could not get TMDb details",
        tmdbId: tmdbId
      })
      skipCount++
      continue
    }

    try {
      // Extract directors from crew
      const directors = []
      let directorCrew = []
      if (tmdbDetails.credits && tmdbDetails.credits.crew) {
        directorCrew = tmdbDetails.credits.crew.filter((c) => c.job === "Director")

        for (const directorData of directorCrew) {
          const director = await findOrCreateDirector(
            directorData.id.toString(),
            directorData.name
          )
          directors.push(director._id)
        }
      }

      // Create film document
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
        originalTitle: originalTitle,
      })

      // Add film to directors' film lists
      for (const directorId of directors) {
        await Director.findByIdAndUpdate(directorId, {
          $push: { films: film._id },
        })
      }

      console.log(`  ✅ Successfully imported: ${tmdbDetails.title}`)
      console.log(`     Directors: ${directorCrew.map((d) => d.name).join(", ")}`)
      console.log(`     Genres: ${film.genres.join(", ")}`)

      successCount++
    } catch (error) {
      console.error(`  ❌ Error importing film:`, error.message)
      failedImports.push({
        title: originalTitle,
        year: year,
        watched: watched,
        rating: rating,
        owned: owned,
        reason: `Import error: ${error.message}`,
        tmdbId: tmdbId
      })
      errorCount++
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("Import Summary:")
  console.log(`  Total films in CSV: ${csvData.length}`)
  console.log(`  Successfully imported: ${successCount}`)
  console.log(`  Skipped (duplicates): ${skippedDuplicates.length}`)
  console.log(`  Failed: ${failedImports.length}`)
  console.log(`  Errors: ${errorCount}`)
  console.log("=".repeat(60))

  // Write skipped duplicates to file for review
  if (skippedDuplicates.length > 0) {
    const duplicatesFile = "./skipped-duplicates.json"
    fs.writeFileSync(duplicatesFile, JSON.stringify(skippedDuplicates, null, 2))
    console.log(`\n⚠️  ${skippedDuplicates.length} films skipped (already in database)`)
    console.log(`   Details saved to: ${duplicatesFile}`)
    console.log(`   Review this file to verify these are actual duplicates`)
  }

  // Write failed imports to file for manual review
  if (failedImports.length > 0) {
    const failedImportsFile = "./failed-imports.json"
    fs.writeFileSync(failedImportsFile, JSON.stringify(failedImports, null, 2))
    console.log(`\n⚠️  ${failedImports.length} films failed to import`)
    console.log(`   Details saved to: ${failedImportsFile}`)
    console.log(`   You can review and manually add these films later`)
  }

  if (failedImports.length === 0 && skippedDuplicates.length === 0) {
    console.log(`\n✅ All films imported successfully!`)
  }

  // Update all director statistics
  console.log("\nUpdating director statistics...")
  const allDirectors = await Director.find({})
  for (const director of allDirectors) {
    await updateDirectorStats(director._id)
  }
  console.log(`Updated stats for ${allDirectors.length} directors`)

  await mongoose.disconnect()
  console.log("\nDisconnected from MongoDB")
  console.log("Import complete!")
}

// Run import
importFilms().catch((error) => {
  console.error("Fatal error during import:", error)
  process.exit(1)
})
