import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  castMarkdown,
  castTierChanges,
  filmFromDocument,
  finalTiers,
  middleTier,
  needsReview,
  parseCsv,
  parseLabels,
  scoreAgainstLabels,
  tiersToApply,
  validateJudgement,
} from "./tiers.mjs"

const HEADER = "film_tmdb_id,film,year,billing,actor_tmdb_id,actor,character,tier\n"

describe("parseCsv", () => {
  it("handles quoted fields with commas and escaped quotes", () => {
    assert.deepEqual(parseCsv('a,"b, c","say ""hi"""\n1,2,3\n'), [
      ["a", "b, c", 'say "hi"'],
      ["1", "2", "3"],
    ])
  })
})

describe("parseLabels", () => {
  it("groups rows by film and maps labels to tiers", () => {
    const films = parseLabels(`${HEADER}1,Film,2000,0,10,A,Hero,1\n1,Film,2000,1,11,B,"Sidekick, the",4\n`)
    assert.equal(films.length, 1)
    assert.deepEqual(
      films[0].cast.map((member) => [member.tmdbId, member.character, member.label]),
      [
        [10, "Hero", "lead"],
        [11, "Sidekick, the", "minor"],
      ],
    )
  })

  it("names the row of a blank label", () => {
    assert.throws(() => parseLabels(`${HEADER}1,Film,2000,0,10,A,Hero,\n`), /Row 2 \(Film, A\)/)
  })

  it("rejects an out-of-range label", () => {
    assert.throws(() => parseLabels(`${HEADER}1,Film,2000,0,10,A,Hero,5\n`), /"5" is not 1 to 4/)
  })
})

describe("castMarkdown", () => {
  it("lists billing from 1 with id, actor and character", () => {
    const film = { cast: [{ billing: 0, tmdbId: 10, actor: "A", character: "Hero" }] }
    assert.equal(castMarkdown(film), "1. 10 | A as Hero\n")
  })

  it("leaves out the character when there is none", () => {
    const film = { cast: [{ billing: 0, tmdbId: 10, actor: "A" }] }
    assert.equal(castMarkdown(film), "1. 10 | A\n")
  })
})

describe("filmFromDocument", () => {
  const actorsById = new Map([
    ["a1", { tmdbPersonId: "10", displayName: "A" }],
    ["a2", { tmdbPersonId: "11", displayName: "B" }],
  ])

  it("orders the cast by billing and resolves actors", () => {
    const film = filmFromDocument(
      {
        tmdbId: "1",
        title: "Film",
        year: 2000,
        cast: [
          { actor: "a2", character: "Sidekick", order: 1 },
          { actor: "a1", character: "Hero", order: 0 },
        ],
      },
      actorsById,
    )
    assert.deepEqual(film, {
      filmId: "1",
      title: "Film",
      year: "2000",
      cast: [
        { billing: 0, tmdbId: 10, actor: "A", character: "Hero" },
        { billing: 1, tmdbId: 11, actor: "B", character: "Sidekick" },
      ],
    })
  })

  it("names the film when an actor is missing", () => {
    const film = { tmdbId: "1", title: "Film", year: 2000, cast: [{ actor: "a9", order: 0 }] }
    assert.throws(() => filmFromDocument(film, actorsById), /Film: actor a9/)
  })
})

describe("validateJudgement", () => {
  const entry = (tmdbId, tier = "lead", confidence = "high") => ({ tmdbId, tier, confidence, reason: "r" })

  it("accepts every cast member exactly once", () => {
    assert.deepEqual(validateJudgement({ cast: [entry(1), entry(2)] }, [1, 2]), [])
  })

  it("reports missing, duplicate, unknown and invalid entries", () => {
    const errors = validateJudgement({ cast: [entry(1), entry(1), entry(9, "star", "sure")] }, [1, 2])
    assert.deepEqual(errors, [
      "tmdbId 1 appears more than once",
      "unknown tmdbId 9",
      'tmdbId 9: invalid tier "star"',
      'tmdbId 9: invalid confidence "sure"',
      "tmdbId 2 missing",
    ])
  })

  it("rejects an answer with no cast array", () => {
    assert.deepEqual(validateJudgement({}, [1]), ["no cast array"])
  })
})

describe("middleTier", () => {
  it("takes the majority when two agree", () => {
    assert.equal(middleTier(["minor", "lead", "minor"]), "minor")
  })

  it("takes the middle tier when all three differ", () => {
    assert.equal(middleTier(["minor", "lead", "supporting"]), "supporting")
  })
})

describe("needsReview", () => {
  it("flags three different answers", () => {
    assert.equal(needsReview([{ tier: "lead" }, { tier: "major" }, { tier: "minor" }], "major"), true)
  })

  it("flags three different answers even when the final tier is minor", () => {
    const entries = [{ tier: "supporting" }, { tier: "minor" }, { tier: "major" }]
    assert.equal(needsReview(entries, "minor"), true)
  })

  it("flags a low-confidence answer when the final tier is above minor", () => {
    const entries = [{ tier: "lead" }, { tier: "lead" }, { tier: "lead", confidence: "low" }]
    assert.equal(needsReview(entries, "lead"), true)
  })

  it("passes a low-confidence answer when the final tier is minor", () => {
    const entries = [{ tier: "minor" }, { tier: "minor", confidence: "low" }, { tier: "minor" }]
    assert.equal(needsReview(entries, "minor"), false)
  })

  it("passes a confident majority", () => {
    const entries = [{ tier: "lead" }, { tier: "lead" }, { tier: "major", confidence: "medium" }]
    assert.equal(needsReview(entries, "lead"), false)
  })
})

describe("finalTiers", () => {
  it("combines the answers per cast member", () => {
    const judge = (tier) => ({ cast: [{ tmdbId: 1, tier, confidence: "high" }] })
    const [result] = finalTiers([1], [judge("lead"), judge("major"), judge("lead")])
    assert.equal(result.tier, "lead")
    assert.equal(result.review, false)
    assert.equal(result.answers.length, 3)
  })
})

describe("scoreAgainstLabels", () => {
  it("counts agreement and rows more than one tier out", () => {
    const score = scoreAgainstLabels([
      { label: "lead", tier: "lead" },
      { label: "lead", tier: "major" },
      { label: "lead", tier: "minor" },
    ])
    assert.equal(score.agreed, 1)
    assert.equal(score.mismatches.length, 2)
    assert.equal(score.moreThanOneOut.length, 1)
  })

  it("scores an empty set as zero rather than dividing by zero", () => {
    assert.equal(scoreAgainstLabels([]).agreement, 0)
  })
})

describe("tiersToApply", () => {
  const REVIEW_HEADER = "film_tmdb_id,film,year,billing,actor_tmdb_id,actor,character,model_tier,judge_answers,decision\n"
  const results = [{ filmId: "1", cast: [{ tmdbId: 10, tier: "lead" }, { tmdbId: 11, tier: "supporting" }] }]
  const labelFilms = [{ filmId: "2", title: "Test", cast: [{ tmdbId: 20, label: "major" }] }]

  it("puts review decisions in place of the judges' tiers and adds the test labels", () => {
    const { tiers, errors } = tiersToApply({
      labelFilms,
      results,
      reviewCsv: `${REVIEW_HEADER}1,Film,2000,2,11,B,Sidekick,supporting,x,minor\n`,
    })
    assert.deepEqual(errors, [])
    assert.deepEqual([...tiers.get("1")], [[10, "lead"], [11, "minor"]])
    assert.deepEqual([...tiers.get("2")], [[20, "major"]])
  })

  it("reports a decision that is not a tier or not in the results", () => {
    const { errors } = tiersToApply({
      labelFilms: [],
      results,
      reviewCsv: `${REVIEW_HEADER}1,Film,2000,2,11,B,,supporting,x,\n1,Film,2000,9,99,Z,,minor,x,minor\n`,
    })
    assert.deepEqual(errors, [
      'review.csv row 2: decision "" is not a tier',
      "review.csv row 3: actor 99 is not in the results for film 1",
    ])
  })

  it("reports a film in both the test labels and the results", () => {
    const { errors } = tiersToApply({
      labelFilms: [{ ...labelFilms[0], filmId: "1" }],
      results,
      reviewCsv: REVIEW_HEADER,
    })
    assert.deepEqual(errors, ["Test: in both the test labels and the results"])
  })
})

describe("castTierChanges", () => {
  const filmTiers = new Map([
    [10, "lead"],
    [11, "minor"],
  ])

  it("returns the cast indexes whose tier differs, giving every role of an actor the tier", () => {
    const stored = [{ tmdbId: 10, tier: "lead" }, { tmdbId: 11 }, { tmdbId: 11, tier: "major" }]
    assert.deepEqual(castTierChanges(stored, filmTiers), {
      changes: [
        { index: 1, tier: "minor" },
        { index: 2, tier: "minor" },
      ],
      errors: [],
    })
  })

  it("returns no changes when the stored cast and the tiers differ", () => {
    const { changes, errors } = castTierChanges([{ tmdbId: 10 }, { tmdbId: 12 }], filmTiers)
    assert.deepEqual(changes, [])
    assert.deepEqual(errors, [
      "actor 11 has a tier but is not in the stored cast",
      "actor 12 is in the stored cast but has no tier",
    ])
  })
})
