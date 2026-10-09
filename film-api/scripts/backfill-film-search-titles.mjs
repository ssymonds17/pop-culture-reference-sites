/**
 * Backfill: derive each film's searchTitle from its title using the same
 * accent-folding rule the Film model applies on save. Titles are never touched.
 *
 * Safe to run repeatedly: it derives from the title and only writes a film when
 * the value actually changes, so re-running is a no-op.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/backfill-film-search-titles.mjs --dry-run   # report only
 *   node --env-file=.env scripts/backfill-film-search-titles.mjs             # apply
 *
 * Requires MONGODB_URI in the environment (loaded from .env above).
 */
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "films"

// Strict so a mistyped flag can never fall through to a write run against the live database.
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--dry-run")
if (unknownArgs.length > 0) {
  console.error(`Unknown argument "${unknownArgs[0]}". Expected --dry-run`)
  process.exit(1)
}
const DRY_RUN = process.argv.includes("--dry-run")

// Keep this identical to normalizeForSearch in lambda/utils/search.ts.
const normalizeForSearch = (value) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim()

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set (expected in .env)")
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  console.log(
    `Connected to "${DB_NAME}" on ${mongoose.connection.host}${DRY_RUN ? " (dry run)" : ""}\n`
  )

  const films = mongoose.connection.db.collection("films")
  const docs = await films
    .find({}, { projection: { title: 1, searchTitle: 1 } })
    .toArray()

  const ops = []
  const examples = []
  for (const doc of docs) {
    const next = normalizeForSearch(doc.title ?? "")

    if (next !== doc.searchTitle) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { searchTitle: next } },
        },
      })
      if (examples.length < 5) {
        examples.push(`    "${doc.title}" -> "${next}"`)
      }
    }
  }

  console.log(`films: ${docs.length} docs, ${ops.length} need updating`)
  if (examples.length > 0) {
    console.log(examples.join("\n"))
  }

  if (!DRY_RUN && ops.length > 0) {
    const result = await films.bulkWrite(ops)
    console.log(`  ✓ modified ${result.modifiedCount}`)
  }

  await mongoose.disconnect()
  console.log(DRY_RUN ? "\nDry run complete. No changes written." : "\nDone.")
}

run().catch(async (error) => {
  console.error("Backfill failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
