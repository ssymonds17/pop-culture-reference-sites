/**
 * Writes each test film's cast, without labels, to runs/<film_tmdb_id>/cast.md for the
 * research and judging agents, and prints the film list the workflow takes as its args.
 *
 * Usage (from the film-api directory):
 *   node scripts/cast-tiers/prepare.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { castMarkdown, parseLabels } from "./tiers.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const runsDir = join(here, "runs")
const films = parseLabels(readFileSync(join(here, "test-labels.csv"), "utf8"))

for (const film of films) {
  const filmDir = join(runsDir, film.filmId)
  mkdirSync(filmDir, { recursive: true })
  writeFileSync(join(filmDir, "cast.md"), castMarkdown(film))
}

console.log(JSON.stringify(films.map(({ filmId, title, year }) => ({ filmId, title, year }))))
