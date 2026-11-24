/**
 * Reads the three judging answers for every test film in runs/, takes the middle tier per cast
 * member, writes runs/results.json and scores the result against test-labels.csv.
 *
 * Usage (from the film-api directory):
 *   node scripts/cast-tiers/score.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { finalTiers, parseLabels, scoreAgainstLabels, tierDistance, validateJudgement } from "./tiers.mjs"

const JUDGE_COUNT = 3
const AGREEMENT_BAR = 0.9

const here = dirname(fileURLToPath(import.meta.url))
const runsDir = join(here, "runs")
const films = parseLabels(readFileSync(join(here, "test-labels.csv"), "utf8"))

const problems = []
const results = []
const scored = []

for (const film of films) {
  const castIds = film.cast.map((member) => member.tmdbId)
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
  if (judgements.length < JUDGE_COUNT) continue

  const tiers = finalTiers(castIds, judgements)
  results.push({ filmId: film.filmId, title: film.title, year: film.year, cast: tiers })
  for (const member of film.cast) {
    const final = tiers.find((tier) => tier.tmdbId === member.tmdbId)
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
