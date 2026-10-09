/**
 * Backfill: fetch a profile photo path from TMDb for every director that has
 * none stored (no `profilePath` field), and save it when TMDb has one.
 *
 * Safe to run repeatedly: directors that already have a photo are skipped, and
 * a director is only written while they still have none. Directors TMDb has no
 * photo for are left as they are and checked again on the next run.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/backfill-director-photos.mjs --dry-run            # report only
 *   node --env-file=.env scripts/backfill-director-photos.mjs --dry-run --limit=5  # spot-check 5 directors
 *   node --env-file=.env scripts/backfill-director-photos.mjs                      # apply
 *
 * Requires MONGODB_URI and TMDB_API_KEY in the environment (loaded from .env above).
 */
import axios from "axios"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const DB_NAME = "films"
const TMDB_REQUEST_DELAY_MS = 100
const BATCH_SIZE = 100

// Strict so a mistyped flag can never fall through to a full write run against the live database.
const parseArgs = (args) => {
  let dryRun = false
  let limit = 0
  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true
    } else if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length))
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error(`--limit must be a positive whole number, got "${arg}"`)
      }
    } else {
      throw new Error(`Unknown argument "${arg}". Expected --dry-run and/or --limit=N`)
    }
  }
  return { dryRun, limit }
}

let DRY_RUN, LIMIT
try {
  ;({ dryRun: DRY_RUN, limit: LIMIT } = parseArgs(process.argv.slice(2)))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let rateLimitedCount = 0

const fetchTmdbPerson = async (tmdbPersonId, isRetry = false) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/person/${tmdbPersonId}`, {
      params: { api_key: TMDB_API_KEY },
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 429 && !isRetry) {
      rateLimitedCount++
      const retryAfterSeconds = Number(error.response.headers?.["retry-after"]) || 1
      await sleep(retryAfterSeconds * 1000)
      return fetchTmdbPerson(tmdbPersonId, true)
    }
    throw error
  }
}

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set (expected in .env)")
  }
  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not set (expected in .env)")
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  console.log(
    `Connected to "${DB_NAME}" on ${mongoose.connection.host}${DRY_RUN ? " (dry run)" : ""}\n`
  )

  const directors = mongoose.connection.db.collection("directors")
  let cursor = directors.find(
    { profilePath: { $exists: false } },
    { projection: { tmdbPersonId: 1, displayName: 1 } }
  )
  if (LIMIT > 0) {
    cursor = cursor.limit(LIMIT)
  }
  const pending = await cursor.toArray()
  console.log(
    `directors: ${pending.length} without a photo${LIMIT > 0 ? ` (limited to ${LIMIT})` : ""}\n`
  )

  let ops = []
  let updated = 0
  const noPhoto = []
  const failures = []

  const flush = async () => {
    if (!DRY_RUN && ops.length > 0) {
      const result = await directors.bulkWrite(ops)
      updated += result.modifiedCount
    }
    ops = []
  }

  for (const [index, director] of pending.entries()) {
    const label = `${director.displayName} (TMDb ${director.tmdbPersonId})`

    let person
    try {
      person = await fetchTmdbPerson(director.tmdbPersonId)
    } catch (error) {
      const reason = error.response?.status ?? error.message
      failures.push(`${label}: ${reason}`)
      console.log(`  ✗ ${label}: TMDb request failed (${reason})`)
      continue
    } finally {
      await sleep(TMDB_REQUEST_DELAY_MS)
    }

    if (!person.profile_path) {
      noPhoto.push(label)
      continue
    }

    console.log(`  [${index + 1}/${pending.length}] ${label}: ${person.profile_path}`)
    ops.push({
      updateOne: {
        // Only fills a director still without a photo, so one saved by the API mid-run is kept.
        filter: { _id: director._id, profilePath: { $exists: false } },
        update: { $set: { profilePath: person.profile_path } },
      },
    })

    if (ops.length >= BATCH_SIZE) {
      await flush()
    }
  }

  await flush()

  if (!DRY_RUN) {
    console.log(`\n  ✓ updated ${updated} directors`)
  }
  if (noPhoto.length > 0) {
    console.log(`\n  ${noPhoto.length} directors have no photo on TMDb and were left as they are`)
  }
  if (failures.length > 0) {
    console.log(`\n  ${failures.length} directors could not be fetched (re-run to retry):`)
    console.log(`    ${failures.join("\n    ")}`)
  }
  if (rateLimitedCount > 0) {
    console.log(`\n  TMDb rate limited ${rateLimitedCount} requests (each retried once)`)
  }

  await mongoose.disconnect()
  console.log(DRY_RUN ? "\nDry run complete. No changes written." : "\nDone.")
}

run().catch(async (error) => {
  console.error("Backfill failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
