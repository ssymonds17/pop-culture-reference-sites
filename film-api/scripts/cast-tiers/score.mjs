/**
 * Reads the three judging answers per film in runs/ and takes the middle tier per cast member.
 *
 * Default: the test films; writes runs/results.json and scores it against test-labels.csv.
 * --all-watched: the films in runs/watched-films.json; writes runs/watched-results.json and
 * lists films not yet judged and cast flagged for review.
 *
 * Usage (from the film-api directory):
 *   node scripts/cast-tiers/score.mjs
 *   node scripts/cast-tiers/score.mjs --all-watched
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { finalTiers, parseLabels, scoreAgainstLabels, tierDistance, validateJudgement } from "./tiers.mjs"

const JUDGE_COUNT = 3
const AGREEMENT_BAR = 0.9

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

// Returns null when any answer is missing or invalid, with the reasons pushed to problems.
const combineFilm = (film, castIds, problems) => {
  const judgements = []
  for (let n = 1; n <= JUDGE_COUNT; n++) {
    const file = join(runsDir, film.filmId, `judge-${n}.json`)
    if (!existsSync(file)) {
      problems.push(`${film.title}: judge-${n}.json missing`)
      continue
    }
    let judgement
    try {
      judgement = JSON.parse(readFileSync(file, "utf8"))
    } catch (error) {
      problems.push(`${film.title}: judge-${n}.json is not valid JSON (${error.message})`)
      continue
    }
    const errors = validateJudgement(judgement, castIds)
    if (errors.length > 0) {
      problems.push(`${film.title}: judge-${n}.json ${errors.join("; ")}`)
      continue
    }
    judgements.push(judgement)
  }
  if (judgements.length < JUDGE_COUNT) return null
  return { filmId: film.filmId, title: film.title, year: film.year, cast: finalTiers(castIds, judgements) }
}

const scoreTestFilms = () => {
  const films = parseLabels(readFileSync(join(here, "test-labels.csv"), "utf8"))
  const problems = []
  const results = []
  const scored = []
  for (const film of films) {
    const result = combineFilm(film, film.cast.map((member) => member.tmdbId), problems)
    if (!result) continue
    results.push(result)
    for (const member of film.cast) {
      const final = result.cast.find((tier) => tier.tmdbId === member.tmdbId)
      scored.push({ film: film.title, actor: member.actor, label: member.label, tier: final.tier, review: final.review })
    }
  }
  writeFileSync(join(runsDir, "results.json"), JSON.stringify(results, null, 2) + "\n")

  const score = scoreAgainstLabels(scored)
  const pass = score.agreement >= AGREEMENT_BAR && score.moreThanOneOut.length === 0
  console.log(`Films scored: ${results.length} of ${films.length}`)
  for (const problem of problems) console.log(`  problem: ${problem}`)
  console.log(`Agreement: ${score.agreed}/${score.total} (${(score.agreement * 100).toFixed(1)}%)`)
  console.log(`More than one tier out: ${score.moreThanOneOut.length}`)
  console.log(`Flagged for review: ${scored.filter((row) => row.review).length}`)
  console.log(pass ? "PASS" : "FAIL")
  console.log("\nMismatches (label -> model):")
  for (const row of score.mismatches) {
    const marker = tierDistance(row.label, row.tier) > 1 ? " !!" : ""
    console.log(`  ${row.film} | ${row.actor}: ${row.label} -> ${row.tier}${row.review ? " (review)" : ""}${marker}`)
  }
}

const combineWatchedFilms = () => {
  const films = JSON.parse(readFileSync(join(runsDir, "watched-films.json"), "utf8"))
  const problems = []
  const notJudged = []
  const results = []
  for (const film of films) {
    if (!existsSync(join(runsDir, film.filmId, "judge-1.json"))) {
      notJudged.push(film.title)
      continue
    }
    const result = combineFilm(film, film.castIds, problems)
    if (result) results.push(result)
  }
  writeFileSync(join(runsDir, "watched-results.json"), JSON.stringify(results, null, 2) + "\n")

  const flagged = results.flatMap((film) => film.cast.filter((member) => member.review).map(() => film.title))
  console.log(`Films combined: ${results.length} of ${films.length}`)
  console.log(`Not yet judged: ${notJudged.length}`)
  console.log(`Problems: ${problems.length}`)
  for (const problem of problems) console.log(`  ${problem}`)
  console.log(`Cast flagged for review: ${flagged.length} across ${new Set(flagged).size} films`)
}

const { allWatched } = parseArgs(process.argv.slice(2))
if (allWatched) combineWatchedFilms()
else scoreTestFilms()
