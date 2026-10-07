/**
 * One-off repair: recount every artist's stats and album/song links from the
 * albums and songs collections, the same way updateArtistStats does at write
 * time, and report or fix any artist whose stored values have drifted.
 *
 * Safe to run repeatedly: it derives everything from albums and songs and only
 * writes an artist when something actually differs, so re-running is a no-op.
 *
 * Usage (from the music-api directory):
 *   node --env-file=.env scripts/recompute-artist-stats.mjs --dry-run   # report only
 *   node --env-file=.env scripts/recompute-artist-stats.mjs             # apply
 *
 * Requires MONGODB_URI in the environment (loaded from .env above).
 */
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = "music"
const DRY_RUN = process.argv.includes("--dry-run")

// Keep this identical to calculateScore in lambda/utils/score.ts.
const calculateScore = (songs, goldAlbums, silverAlbums) =>
  songs + goldAlbums * 15 + silverAlbums * 5

const STAT_FIELDS = ["goldAlbums", "silverAlbums", "totalSongs", "totalScore"]

const sameIds = (a = [], b = []) => {
  const left = new Set(a.map(String))
  const right = new Set(b.map(String))
  return left.size === right.size && [...left].every((id) => right.has(id))
}

const groupByArtist = (collection, extraFields = {}) =>
  collection
    .aggregate([
      { $unwind: "$artists" },
      { $group: { _id: "$artists", ids: { $push: "$_id" }, ...extraFields } },
    ])
    .toArray()
    .then((rows) => new Map(rows.map((row) => [String(row._id), row])))

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set (expected in .env)")
  }

  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  console.log(`Connected to "${DB_NAME}"${DRY_RUN ? " (dry run)" : ""}\n`)

  const db = mongoose.connection.db
  const ratingCount = (rating) => ({
    $sum: { $cond: [{ $eq: ["$rating", rating] }, 1, 0] },
  })

  const albumsByArtist = await groupByArtist(db.collection("albums"), {
    goldAlbums: ratingCount("GOLD"),
    silverAlbums: ratingCount("SILVER"),
  })
  const songsByArtist = await groupByArtist(db.collection("songs"))
  const artists = await db.collection("artists").find({}).toArray()

  const ops = []
  for (const artist of artists) {
    const albums = albumsByArtist.get(String(artist._id))
    const songs = songsByArtist.get(String(artist._id))

    const expected = {
      goldAlbums: albums?.goldAlbums ?? 0,
      silverAlbums: albums?.silverAlbums ?? 0,
      totalSongs: songs?.ids.length ?? 0,
    }
    expected.totalScore = calculateScore(
      expected.totalSongs,
      expected.goldAlbums,
      expected.silverAlbums
    )

    const update = {}
    const changes = []
    for (const field of STAT_FIELDS) {
      if (artist[field] !== expected[field]) {
        update[field] = expected[field]
        changes.push(`${field} ${artist[field]} -> ${expected[field]}`)
      }
    }
    for (const [field, ids] of [
      ["albums", albums?.ids ?? []],
      ["songs", songs?.ids ?? []],
    ]) {
      if (!sameIds(artist[field], ids)) {
        update[field] = ids
        changes.push(`${field} ${artist[field]?.length ?? 0} -> ${ids.length} linked`)
      }
    }

    if (changes.length > 0) {
      ops.push({ updateOne: { filter: { _id: artist._id }, update: { $set: update } } })
      console.log(`  ${artist.displayName ?? artist.name} (${artist._id})`)
      console.log(`    ${changes.join("\n    ")}`)
    }
  }

  console.log(`\nartists: ${artists.length} docs, ${ops.length} need updating`)

  if (!DRY_RUN && ops.length > 0) {
    const result = await db.collection("artists").bulkWrite(ops)
    console.log(`  ✓ modified ${result.modifiedCount}`)
  }

  await mongoose.disconnect()
  console.log(DRY_RUN ? "\nDry run complete. No changes written." : "\nDone.")
}

run().catch(async (error) => {
  console.error("Recompute failed:", error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
