/**
 * One-off backfill: re-derive each record's search field (name/title) from its
 * display field (displayName/displayTitle) using the same accent-folding rule
 * the API uses at write time. The display fields (original case and accents)
 * are never touched.
 *
 * Safe to run repeatedly: it derives from the display field and only writes a
 * document when the value actually changes, so re-running is a no-op.
 *
 * Usage (from the music-api directory):
 *   node --env-file=.env scripts/normalise-search-fields.mjs --dry-run   # report only
 *   node --env-file=.env scripts/normalise-search-fields.mjs             # apply
 *
 * Requires MONGODB_URI in the environment (loaded from .env above).
 */
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "music"
const DRY_RUN = process.argv.includes("--dry-run")

// Keep this identical to normalizeForSearch in lambda/utils/search.ts.
const normalizeForSearch = (value) =>
  (value ?? "")
    .normalize("NFD") // decompose base letter + combining accent
    .replace(/\p{M}/gu, "") // strip all combining marks (the accents)
    .toLowerCase()
    .trim()

const COLLECTIONS = [
  { name: "artists", searchField: "name", displayField: "displayName" },
  { name: "albums", searchField: "title", displayField: "displayTitle" },
  { name: "songs", searchField: "title", displayField: "displayTitle" },
]

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set (expected in .env)")
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  console.log(`Connected to "${DB_NAME}"${DRY_RUN ? " (dry run)" : ""}\n`)

  const db = mongoose.connection.db

  for (const { name, searchField, displayField } of COLLECTIONS) {
    const collection = db.collection(name)
    const docs = await collection
      .find({}, { projection: { [searchField]: 1, [displayField]: 1 } })
      .toArray()

    const ops = []
    const examples = []
    for (const doc of docs) {
      const source = doc[displayField] ?? doc[searchField] ?? ""
      const next = normalizeForSearch(source)

      if (next !== doc[searchField]) {
        ops.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { [searchField]: next } },
          },
        })
        if (examples.length < 5) {
          examples.push(`    "${doc[searchField]}" -> "${next}"`)
        }
      }
    }

    console.log(
      `${name}: ${docs.length} docs, ${ops.length} need updating`
    )
    if (examples.length > 0) {
      console.log(examples.join("\n"))
    }

    if (!DRY_RUN && ops.length > 0) {
      const result = await collection.bulkWrite(ops)
      console.log(`  ✓ modified ${result.modifiedCount}`)
    }
    console.log("")
  }

  await mongoose.disconnect()
  console.log(DRY_RUN ? "Dry run complete. No changes written." : "Done.")
}

run().catch(async (error) => {
  console.error("Backfill failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
