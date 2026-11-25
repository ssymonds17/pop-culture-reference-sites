/**
 * Writes each film's cast, without labels, to runs/<film_tmdb_id>/cast.md for the research and
 * judging agents.
 *
 * Default: the test films in test-labels.csv; prints the film list the workflow takes as args.
 * --all-watched: every watched film with a stored cast, except the test films, read from the
 * database without writing to it; the film list goes to runs/watched-films.json.
 *
 * Usage (from the film-api directory):
 *   node scripts/cast-tiers/prepare.mjs
 *   node --env-file=.env scripts/cast-tiers/prepare.mjs --all-watched
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import { castMarkdown, filmFromDocument, parseLabels } from "./tiers.mjs"

const DB_NAME = "films"

const here = dirname(fileURLToPath(import.meta.url))
const runsDir = join(here, "runs")

const parseArgs = (args) => {
  let allWatched = false
  for (const arg of args) {
    if (arg === "--all-watched") allWatched = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return { allWatched }
}

const writeCast = (film) => {
  const filmDir = join(runsDir, film.filmId)
  mkdirSync(filmDir, { recursive: true })
  writeFileSync(join(filmDir, "cast.md"), castMarkdown(film))
}

const loadWatchedFilms = async (testFilmIds) => {
  const { MONGODB_URI } = process.env
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set")
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME })
  try {
    const db = mongoose.connection.db
    const watched = await db
      .collection("films")
      .find({ watched: true }, { projection: { title: 1, year: 1, tmdbId: 1, cast: 1 } })
      .toArray()
    const actors = await db
      .collection("actors")
      .find({}, { projection: { tmdbPersonId: 1, displayName: 1 } })
      .toArray()
    const actorsById = new Map(actors.map((actor) => [String(actor._id), actor]))
    const withCast = watched.filter((film) => film.cast?.length > 0)
    const films = withCast
      .filter((film) => !testFilmIds.has(film.tmdbId))
      .map((film) => filmFromDocument(film, actorsById))
    return { watchedCount: watched.length, noCast: watched.filter((film) => !film.cast?.length), films }
  } finally {
    await mongoose.disconnect()
  }
}

const { allWatched } = parseArgs(process.argv.slice(2))
const testFilms = parseLabels(readFileSync(join(here, "test-labels.csv"), "utf8"))

if (allWatched) {
  const { watchedCount, noCast, films } = await loadWatchedFilms(new Set(testFilms.map((film) => film.filmId)))
  films.forEach(writeCast)
  const list = films.map(({ filmId, title, year, cast }) => ({
    filmId,
    title,
    year,
    castIds: cast.map((member) => member.tmdbId),
  }))
  writeFileSync(join(runsDir, "watched-films.json"), JSON.stringify(list, null, 2) + "\n")
  console.log(`Watched films: ${watchedCount}`)
  console.log(`Skipped, no cast: ${noCast.map((film) => film.title).join(", ") || "none"}`)
  console.log(`Skipped, test films: ${watchedCount - noCast.length - films.length}`)
  console.log(`Written: ${films.length} films to runs/watched-films.json`)
} else {
  testFilms.forEach(writeCast)
  console.log(JSON.stringify(testFilms.map(({ filmId, title, year }) => ({ filmId, title, year }))))
}
