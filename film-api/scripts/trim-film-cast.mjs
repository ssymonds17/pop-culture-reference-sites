/**
 * One-off: trim every film's stored cast to its top 10 credited members by
 * billing order, then delete actors who no longer appear in any film. Run
 * backfill-tmdb-credits.mjs afterwards to recalculate the remaining actors' stats.
 *
 * Safe to run repeatedly: films already at 10 or fewer are left alone, and a
 * second run finds no orphaned actors to delete.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/trim-film-cast.mjs --dry-run   # report only
 *   node --env-file=.env scripts/trim-film-cast.mjs             # apply
 *
 * Requires MONGODB_URI in the environment (loaded from .env above).
 */
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "films"

// Keep this identical to MAX_CAST in lambda/create-film.ts.
const MAX_CAST = 10

// Strict so a mistyped flag can never fall through to a write run against the live database.
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--dry-run")
if (unknownArgs.length > 0) {
  console.error(`Unknown argument "${unknownArgs[0]}". Expected --dry-run`)
  process.exit(1)
}
const DRY_RUN = process.argv.includes("--dry-run")

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set (expected in .env)")
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  console.log(
    `Connected to "${DB_NAME}" on ${mongoose.connection.host}${DRY_RUN ? " (dry run)" : ""}\n`
  )

  const db = mongoose.connection.db
  const films = db.collection("films")
  const actors = db.collection("actors")

  const oversized = { [`cast.${MAX_CAST}`]: { $exists: true } }
  const filmsToTrim = await films.countDocuments(oversized)
  console.log(`films: ${filmsToTrim} with more than ${MAX_CAST} cast members`)

  if (!DRY_RUN && filmsToTrim > 0) {
    const result = await films.updateMany(oversized, {
      $push: { cast: { $each: [], $sort: { order: 1 }, $slice: MAX_CAST } },
    })
    console.log(`  ✓ trimmed ${result.modifiedCount}`)
  }

  // Worked out from each film's top entries so a dry run reports what a real run would delete.
  const keptActorIds = await films
    .aggregate([
      { $match: { cast: { $exists: true, $ne: [] } } },
      {
        $project: {
          kept: {
            $slice: [{ $sortArray: { input: "$cast", sortBy: { order: 1 } } }, MAX_CAST],
          },
        },
      },
      { $unwind: "$kept" },
      { $group: { _id: "$kept.actor" } },
    ])
    .toArray()
    .then((rows) => rows.map((row) => row._id))

  // A later film that bills them in its top 10 recreates them through create-film.
  const orphaned = { _id: { $nin: keptActorIds } }
  const orphanCount = await actors.countDocuments(orphaned)
  const examples = await actors
    .find(orphaned, { projection: { displayName: 1 } })
    .limit(5)
    .toArray()

  console.log(`\nactors: ${keptActorIds.length} still in a film, ${orphanCount} in none`)
  if (examples.length > 0) {
    console.log(`    e.g. ${examples.map((actor) => actor.displayName).join(", ")}`)
  }

  if (!DRY_RUN && orphanCount > 0) {
    const result = await actors.deleteMany(orphaned)
    console.log(`  ✓ deleted ${result.deletedCount}`)
  }

  await mongoose.disconnect()
  console.log(
    DRY_RUN
      ? "\nDry run complete. No changes written."
      : "\nDone. Now run backfill-tmdb-credits.mjs to recalculate actor stats."
  )
}

run().catch(async (error) => {
  console.error("Trim failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
