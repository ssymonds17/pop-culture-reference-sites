/**
 * Writes cast[].tier to the watched films: the hand labels for the test films, and the combined
 * judges' tiers from runs/watched-results.json, with review.csv decisions in place of the
 * flagged rows, for the rest. Leaves actor stats alone; run backfill-tmdb-credits.mjs afterwards
 * to recalculate them.
 *
 * Checks every film before writing any: it stops if a film is missing or its stored cast differs
 * from the tiers. Safe to run again: casts whose tiers already match are skipped.
 *
 * Usage (from the film-api directory):
 *   node --env-file=.env scripts/cast-tiers/apply.mjs --dry-run           # report only
 *   node --env-file=.env scripts/cast-tiers/apply.mjs --film=4638         # one film, by TMDb id
 *   node --env-file=.env scripts/cast-tiers/apply.mjs                     # every film
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import { castTierChanges, parseLabels, TIERS, tiersToApply } from "./tiers.mjs"

const DB_NAME = "films"

const here = dirname(fileURLToPath(import.meta.url))

const parseArgs = (args) => {
  let dryRun = false
  let film
  for (const arg of args) {
    if (arg === "--dry-run") dryRun = true
    else if (arg.startsWith("--film=") && arg.length > "--film=".length) film = arg.slice("--film=".length)
    else throw new Error(`Unknown argument "${arg}". Expected --dry-run and/or --film=<TMDb id>`)
  }
  return { dryRun, film }
}

const loadTiers = () => {
  const { tiers, errors } = tiersToApply({
    labelFilms: parseLabels(readFileSync(join(here, "test-labels.csv"), "utf8")),
    results: JSON.parse(readFileSync(join(here, "runs", "watched-results.json"), "utf8")),
    reviewCsv: readFileSync(join(here, "review.csv"), "utf8"),
  })
  if (errors.length > 0) throw new Error(`The tier files disagree:\n  ${errors.join("\n  ")}`)
  return tiers
}

// Every cast index is in the filter, so a cast that changed since it was read is left alone.
const updateFor = (film, changes) => ({
  updateOne: {
    filter: {
      _id: film._id,
      ...Object.fromEntries(film.cast.map((member, index) => [`cast.${index}.actor`, member.actor])),
    },
    update: { $set: Object.fromEntries(changes.map(({ index, tier }) => [`cast.${index}.tier`, tier])) },
  },
})

const planUpdates = async (db, tiers) => {
  const films = await db
    .collection("films")
    .find({ tmdbId: { $in: [...tiers.keys()] } }, { projection: { title: 1, tmdbId: 1, cast: 1 } })
    .toArray()
  const actorIds = films.flatMap((film) => (film.cast ?? []).map((member) => member.actor))
  const actors = await db
    .collection("actors")
    .find({ _id: { $in: actorIds } }, { projection: { tmdbPersonId: 1 } })
    .toArray()
  const tmdbIdByActor = new Map(actors.map((actor) => [String(actor._id), Number(actor.tmdbPersonId)]))

  const filmsByTmdbId = new Map(films.map((film) => [film.tmdbId, film]))
  const problems = []
  const updates = []
  let unchanged = 0
  for (const [filmId, filmTiers] of tiers) {
    const film = filmsByTmdbId.get(filmId)
    if (!film) {
      problems.push(`film ${filmId}: not in the database`)
      continue
    }
    const storedCast = (film.cast ?? []).map((member) => ({
      tmdbId: tmdbIdByActor.get(String(member.actor)),
      tier: member.tier,
    }))
    const { changes, errors } = castTierChanges(storedCast, filmTiers)
    problems.push(...errors.map((error) => `${film.title}: ${error}`))
    if (errors.length === 0 && changes.length === 0) unchanged++
    if (changes.length > 0) updates.push({ film, changes })
  }
  return { problems, updates, unchanged }
}

const { dryRun, film: onlyFilm } = parseArgs(process.argv.slice(2))
const allTiers = loadTiers()
if (onlyFilm && !allTiers.has(onlyFilm)) throw new Error(`No tiers for film ${onlyFilm}`)
const tiers = onlyFilm ? new Map([[onlyFilm, allTiers.get(onlyFilm)]]) : allTiers

const { MONGODB_URI } = process.env
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set")
await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
try {
  const db = mongoose.connection.db
  const { problems, updates, unchanged } = await planUpdates(db, tiers)

  const counts = Object.fromEntries(TIERS.map((tier) => [tier, 0]))
  for (const { changes } of updates) for (const { tier } of changes) counts[tier]++
  console.log(`Films: ${tiers.size}`)
  console.log(`  already up to date: ${unchanged}`)
  console.log(`  to update: ${updates.length}, ${updates.reduce((sum, { changes }) => sum + changes.length, 0)} cast`)
  console.log(`  tiers to write: ${TIERS.map((tier) => `${tier} ${counts[tier]}`).join(", ")}`)

  if (problems.length > 0) {
    console.log(`\nStopped without writing: ${problems.length} problems`)
    for (const problem of problems) console.log(`  ${problem}`)
    process.exitCode = 1
  } else if (dryRun) {
    console.log("\nDry run: nothing written")
  } else if (updates.length > 0) {
    const result = await db.collection("films").bulkWrite(updates.map(({ film, changes }) => updateFor(film, changes)))
    console.log(`\nUpdated ${result.modifiedCount} of ${updates.length} films`)
    if (result.modifiedCount < updates.length) {
      console.log("Some casts changed since they were read; run again to see which")
      process.exitCode = 1
    }
  }
} finally {
  await mongoose.disconnect()
}
