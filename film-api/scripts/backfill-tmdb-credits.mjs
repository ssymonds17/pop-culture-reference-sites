/**
 * Backfill: fetch cast, production companies and collection from TMDb for every
 * film that has never had them (no `cast` field), then recompute every actor's
 * stats from the films they are cast in and report or fix any that have drifted.
 *
 * Safe to run repeatedly: films that already have `cast` are skipped, actors are
 * upserted by TMDb person ID, and actor stats are only written when they differ.
 * Film updates are written in batches, so an interrupted run keeps its progress.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/backfill-tmdb-credits.mjs --dry-run            # report only
 *   node --env-file=.env scripts/backfill-tmdb-credits.mjs --dry-run --limit=5  # spot-check 5 films
 *   node --env-file=.env scripts/backfill-tmdb-credits.mjs                      # apply
 *
 * Requires MONGODB_URI and TMDB_API_KEY in the environment (loaded from .env above).
 */
import axios from "axios"
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const DB_NAME = "films"

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

// Keep this identical to MAX_CAST in lambda/create-film.ts.
const MAX_CAST = 20
const TMDB_REQUEST_DELAY_MS = 100
const FILM_BATCH_SIZE = 100

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Keep this identical to normalizeForSearch in lambda/utils/search.ts.
const normalizeForSearch = (value) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim()

// Keep this identical to calculatePersonStats in lambda/mongodb/models/personStats.ts.
const calculatePersonStats = (films) => {
  const watchedFilms = films.filter((f) => f.watched && f.rating)
  const seenFilms = watchedFilms.length
  const totalScore = watchedFilms.reduce((sum, f) => sum + (f.rating || 0), 0)
  const ratingCounts = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [`rating${i + 1}`, 0])
  )
  watchedFilms.forEach((f) => {
    if (Number.isInteger(f.rating) && f.rating >= 1 && f.rating <= 10) {
      ratingCounts[`rating${f.rating}`]++
    }
  })

  return {
    totalFilms: films.length,
    seenFilms,
    averageRating: seenFilms > 0 ? totalScore / seenFilms : undefined,
    totalScore,
    ratingCounts,
    totalPoints:
      ratingCounts.rating6 * 1 +
      ratingCounts.rating7 * 3 +
      ratingCounts.rating8 * 6 +
      ratingCounts.rating9 * 10 +
      ratingCounts.rating10 * 15,
  }
}

// Keep this identical to buildCast in lambda/create-film.ts.
const creditedCast = (tmdbCast = []) =>
  tmdbCast
    .filter((member) => !member.character?.includes("(uncredited)"))
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_CAST)

// Keep this identical to the productionCompanies and tmdbCollection mapping in lambda/create-film.ts.
const mapCompanies = (companies = []) =>
  companies.map((company) => ({
    tmdbId: company.id.toString(),
    name: company.name,
    ...(company.logo_path && { logoPath: company.logo_path }),
    ...(company.origin_country && { originCountry: company.origin_country }),
  }))

const mapCollection = (collection) =>
  collection ? { tmdbId: collection.id.toString(), name: collection.name } : undefined

let rateLimitedCount = 0

const fetchTmdbDetails = async (tmdbId, isRetry = false) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY, append_to_response: "credits" },
    })
    return response.data
  } catch (error) {
    if (error.response?.status === 429 && !isRetry) {
      rateLimitedCount++
      const retryAfterSeconds = Number(error.response.headers?.["retry-after"]) || 1
      await sleep(retryAfterSeconds * 1000)
      return fetchTmdbDetails(tmdbId, true)
    }
    throw error
  }
}

// Keep this identical to findOrCreateActor in lambda/mongodb/services/actors.ts.
const upsertActor = async (actors, member) => {
  const tmdbPersonId = member.id.toString()
  const actor = await actors.findOneAndUpdate(
    { tmdbPersonId },
    {
      $setOnInsert: {
        tmdbPersonId,
        name: normalizeForSearch(member.name),
        displayName: member.name,
      },
      ...(member.profile_path && { $set: { profilePath: member.profile_path } }),
    },
    { upsert: true, returnDocument: "after" }
  )
  return actor._id
}

async function backfillFilms(db) {
  const films = db.collection("films")
  const actors = db.collection("actors")

  let cursor = films.find(
    { cast: { $exists: false }, tmdbId: { $exists: true, $ne: "" } },
    { projection: { title: 1, year: 1, tmdbId: 1 } }
  )
  if (LIMIT > 0) {
    cursor = cursor.limit(LIMIT)
  }
  const pending = await cursor.toArray()
  console.log(`films: ${pending.length} without cast${LIMIT > 0 ? ` (limited to ${LIMIT})` : ""}\n`)

  let ops = []
  let updated = 0
  const failures = []
  const notFound = []

  // Only fills films still without cast, so a cast written by the API mid-run is never overwritten.
  const queueUpdate = (film, fields) =>
    ops.push({
      updateOne: {
        filter: { _id: film._id, cast: { $exists: false } },
        update: { $set: fields },
      },
    })

  const flush = async () => {
    if (!DRY_RUN && ops.length > 0) {
      const result = await films.bulkWrite(ops)
      updated += result.modifiedCount
    }
    ops = []
  }

  for (const [index, film] of pending.entries()) {
    const label = `${film.title} (${film.year}, TMDb ${film.tmdbId})`

    let details
    try {
      details = await fetchTmdbDetails(film.tmdbId)
    } catch (error) {
      // TMDb has no record to fetch, so mark it fetched with no credits rather than retry it forever.
      if (error.response?.status === 404) {
        notFound.push(label)
        console.log(`  ✗ ${label}: not found on TMDb, storing an empty cast`)
        queueUpdate(film, { cast: [], productionCompanies: [] })
        continue
      }
      const reason = error.response?.status ?? error.message
      failures.push(`${label}: ${reason}`)
      console.log(`  ✗ ${label}: TMDb request failed (${reason})`)
      continue
    } finally {
      await sleep(TMDB_REQUEST_DELAY_MS)
    }

    const credited = creditedCast(details.credits?.cast)
    const productionCompanies = mapCompanies(details.production_companies)
    const tmdbCollection = mapCollection(details.belongs_to_collection)

    console.log(
      `  [${index + 1}/${pending.length}] ${label}: ${credited.length} cast, ` +
        `${productionCompanies.length} ${productionCompanies.length === 1 ? "company" : "companies"}${tmdbCollection ? `, collection "${tmdbCollection.name}"` : ""}`
    )

    if (DRY_RUN) {
      continue
    }

    const cast = []
    for (const member of credited) {
      cast.push({
        actor: await upsertActor(actors, member),
        ...(member.character && { character: member.character }),
        order: member.order,
      })
    }

    queueUpdate(film, { cast, productionCompanies, ...(tmdbCollection && { tmdbCollection }) })

    if (ops.length >= FILM_BATCH_SIZE) {
      await flush()
    }
  }

  await flush()

  if (!DRY_RUN) {
    console.log(`\n  ✓ updated ${updated} films`)
  }
  if (notFound.length > 0) {
    console.log(`\n  ${notFound.length} films not found on TMDb${DRY_RUN ? " would be" : " were"} given an empty cast:`)
    console.log(`    ${notFound.join("\n    ")}`)
  }
  if (failures.length > 0) {
    console.log(`\n  ${failures.length} films could not be fetched and were left without cast (re-run to retry):`)
    console.log(`    ${failures.join("\n    ")}`)
  }
  if (rateLimitedCount > 0) {
    console.log(`\n  TMDb rate limited ${rateLimitedCount} requests (each retried once)`)
  }

  return pending.length
}

const sameStats = (actor, expected) =>
  actor.totalFilms === expected.totalFilms &&
  actor.seenFilms === expected.seenFilms &&
  actor.averageRating === expected.averageRating &&
  actor.totalScore === expected.totalScore &&
  actor.totalPoints === expected.totalPoints &&
  Object.keys(expected.ratingCounts).every(
    (key) => actor.ratingCounts?.[key] === expected.ratingCounts[key]
  )

async function recomputeActorStats(db) {
  // An actor playing several roles in one film must count that film once.
  const filmsByActor = await db
    .collection("films")
    .aggregate([
      { $match: { cast: { $exists: true, $ne: [] } } },
      { $project: { watched: 1, rating: 1, actorIds: { $setUnion: ["$cast.actor", []] } } },
      { $unwind: "$actorIds" },
      { $group: { _id: "$actorIds", films: { $push: { watched: "$watched", rating: "$rating" } } } },
    ])
    .toArray()
    .then((rows) => new Map(rows.map((row) => [String(row._id), row.films])))

  const actors = await db.collection("actors").find({}).toArray()

  const ops = []
  for (const actor of actors) {
    const expected = calculatePersonStats(filmsByActor.get(String(actor._id)) ?? [])
    if (sameStats(actor, expected)) {
      continue
    }

    const { averageRating, ...rest } = expected
    const update =
      averageRating === undefined
        ? { $set: rest, $unset: { averageRating: "" } }
        : { $set: expected }
    ops.push({ updateOne: { filter: { _id: actor._id }, update } })
    console.log(
      `  ${actor.displayName} (${actor.tmdbPersonId}): totalFilms ${actor.totalFilms ?? "-"} -> ${expected.totalFilms}, ` +
        `seenFilms ${actor.seenFilms ?? "-"} -> ${expected.seenFilms}, totalPoints ${actor.totalPoints ?? "-"} -> ${expected.totalPoints}`
    )
  }

  console.log(`\nactors: ${actors.length} docs, ${ops.length} need stats updating`)

  if (!DRY_RUN && ops.length > 0) {
    const result = await db.collection("actors").bulkWrite(ops)
    console.log(`  ✓ modified ${result.modifiedCount}`)
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

  const db = mongoose.connection.db

  console.log("Phase 1: fetch credits from TMDb\n")
  const pendingFilms = await backfillFilms(db)

  console.log("\nPhase 2: recompute actor stats\n")
  if (DRY_RUN && pendingFilms > 0) {
    console.log(
      "  Note: phase 1 wrote nothing in this dry run, so this reflects current data only.\n" +
        "  A real run will also create actors and update stats for the films above.\n"
    )
  }
  await recomputeActorStats(db)

  await mongoose.disconnect()
  console.log(DRY_RUN ? "\nDry run complete. No changes written." : "\nDone.")
}

run().catch(async (error) => {
  console.error("Backfill failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
