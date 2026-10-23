/**
 * Backfill: fetch the IMDb person ID from TMDb for every actor and director
 * that has never been looked up (no `imdbPersonId` field), and save it. People
 * TMDb has no IMDb ID for, or no longer knows at all, are saved as null, so
 * later runs skip them.
 *
 * Safe to run repeatedly: people already looked up are skipped, and a person is
 * only written while they still have no `imdbPersonId` field. Someone who is
 * both an actor and a director is fetched from TMDb once.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/backfill-person-imdb-ids.mjs --dry-run            # report only
 *   node --env-file=.env scripts/backfill-person-imdb-ids.mjs --dry-run --limit=5  # spot-check 5 per collection
 *   node --env-file=.env scripts/backfill-person-imdb-ids.mjs                      # apply
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
const COLLECTIONS = ["actors", "directors"]

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

const fetchExternalIds = async (tmdbPersonId, isRetry = false) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/person/${tmdbPersonId}/external_ids`, {
      params: { api_key: TMDB_API_KEY },
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 429 && !isRetry) {
      rateLimitedCount++
      const retryAfterSeconds = Number(error.response.headers?.["retry-after"]) || 1
      await sleep(retryAfterSeconds * 1000)
      return fetchExternalIds(tmdbPersonId, true)
    }
    throw error
  }
}

// TMDb IDs are shared across collections, so a person in both is fetched once per run.
const imdbPersonIdsByTmdbId = new Map()

const lookUpImdbPersonId = async (tmdbPersonId) => {
  if (!imdbPersonIdsByTmdbId.has(tmdbPersonId)) {
    try {
      const externalIds = await fetchExternalIds(tmdbPersonId)
      imdbPersonIdsByTmdbId.set(tmdbPersonId, externalIds.imdb_id || null)
    } catch (error) {
      // TMDb has no such person any more, so there is no IMDb ID to find; saving null stops refetching.
      if (error.response?.status !== 404) {
        throw error
      }
      imdbPersonIdsByTmdbId.set(tmdbPersonId, null)
    } finally {
      await sleep(TMDB_REQUEST_DELAY_MS)
    }
  }
  return imdbPersonIdsByTmdbId.get(tmdbPersonId)
}

async function backfillCollection(db, collectionName) {
  const collection = db.collection(collectionName)
  let cursor = collection.find(
    { imdbPersonId: { $exists: false } },
    { projection: { tmdbPersonId: 1, displayName: 1 } }
  )
  if (LIMIT > 0) {
    cursor = cursor.limit(LIMIT)
  }
  const pending = await cursor.toArray()
  console.log(
    `${collectionName}: ${pending.length} never looked up${LIMIT > 0 ? ` (limited to ${LIMIT})` : ""}\n`
  )

  let ops = []
  let updated = 0
  const noImdbId = []
  const failures = []

  const flush = async () => {
    if (!DRY_RUN && ops.length > 0) {
      const result = await collection.bulkWrite(ops)
      updated += result.modifiedCount
    }
    ops = []
  }

  for (const [index, person] of pending.entries()) {
    const label = `${person.displayName} (TMDb ${person.tmdbPersonId})`

    let imdbPersonId
    try {
      imdbPersonId = await lookUpImdbPersonId(person.tmdbPersonId)
    } catch (error) {
      const reason = error.response?.status ?? error.message
      failures.push(`${label}: ${reason}`)
      console.log(`  ✗ ${label}: TMDb request failed (${reason})`)
      continue
    }

    if (imdbPersonId) {
      console.log(`  [${index + 1}/${pending.length}] ${label}: ${imdbPersonId}`)
    } else {
      noImdbId.push(label)
    }

    ops.push({
      updateOne: {
        // Only fills a person still never looked up, so an ID saved by the API mid-run is kept.
        filter: { _id: person._id, imdbPersonId: { $exists: false } },
        update: { $set: { imdbPersonId } },
      },
    })

    if (ops.length >= BATCH_SIZE) {
      await flush()
    }
  }

  await flush()

  if (!DRY_RUN) {
    console.log(`\n  ✓ updated ${updated} ${collectionName}`)
  }
  if (noImdbId.length > 0) {
    console.log(
      `\n  ${noImdbId.length} ${collectionName} have no IMDb ID on TMDb and ${DRY_RUN ? "would be" : "were"} saved as null`
    )
  }
  if (failures.length > 0) {
    console.log(`\n  ${failures.length} ${collectionName} could not be fetched (re-run to retry):`)
    console.log(`    ${failures.join("\n    ")}`)
  }
  console.log("")
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

  for (const collectionName of COLLECTIONS) {
    await backfillCollection(mongoose.connection.db, collectionName)
  }

  if (rateLimitedCount > 0) {
    console.log(`TMDb rate limited ${rateLimitedCount} requests (each retried once)\n`)
  }

  await mongoose.disconnect()
  console.log(DRY_RUN ? "Dry run complete. No changes written." : "Done.")
}

run().catch(async (error) => {
  console.error("Backfill failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
