/**
 * One-off: removes the `cast[].lead` flag that cast tiers replaced from every film that has it.
 * Safe to run again: a second run finds no films to change.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/cast-tiers/unset-lead.mjs --dry-run   # report only
 *   node --env-file=.env scripts/cast-tiers/unset-lead.mjs             # apply
 */
import mongoose from "mongoose"

const DB_NAME = "films"
const HAS_LEAD = { "cast.lead": { $exists: true } }

// Strict so a mistyped flag can never fall through to a write run against the live database.
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--dry-run")
if (unknownArgs.length > 0) throw new Error(`Unknown argument "${unknownArgs[0]}". Expected --dry-run`)
const dryRun = process.argv.includes("--dry-run")

const { MONGODB_URI } = process.env
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set")
await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
try {
  console.log(`Connected to "${DB_NAME}" on ${mongoose.connection.host}${dryRun ? " (dry run)" : ""}`)
  const films = mongoose.connection.db.collection("films")
  console.log(`Films with cast[].lead: ${await films.countDocuments(HAS_LEAD)}`)

  if (dryRun) {
    console.log("Dry run: nothing written")
  } else {
    const result = await films.updateMany(HAS_LEAD, { $unset: { "cast.$[].lead": "" } })
    console.log(`Removed lead from ${result.modifiedCount} of ${result.matchedCount} films`)
    console.log(`Films with cast[].lead left: ${await films.countDocuments(HAS_LEAD)}`)
  }
} finally {
  await mongoose.disconnect()
}
