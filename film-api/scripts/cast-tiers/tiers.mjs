export const TIERS = ["lead", "major", "supporting", "minor"]
const CONFIDENCES = ["high", "medium", "low"]
const LABEL_COLUMN = 7

export const parseCsv = (text) => {
  const rows = []
  let row = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// Throws on the first blank or out-of-range label so a half-labelled set can never be scored.
export const parseLabels = (csvText) => {
  const [, ...rows] = parseCsv(csvText)
  const films = new Map()
  rows.forEach((columns, index) => {
    const [filmId, title, year, billing, actorId, actor, character] = columns
    const label = (columns[LABEL_COLUMN] ?? "").trim()
    const rank = Number(label)
    if (!/^[1-4]$/.test(label)) {
      throw new Error(`Row ${index + 2} (${title}, ${actor}): label "${label}" is not 1 to 4`)
    }
    if (!films.has(filmId)) films.set(filmId, { filmId, title, year, cast: [] })
    films.get(filmId).cast.push({
      billing: Number(billing),
      tmdbId: Number(actorId),
      actor,
      character,
      label: TIERS[rank - 1],
    })
  })
  return [...films.values()]
}

export const castMarkdown = (film) =>
  film.cast
    .map(
      (member) =>
        `${member.billing + 1}. ${member.tmdbId} | ${member.actor}` +
        (member.character ? ` as ${member.character}` : ""),
    )
    .join("\n") + "\n"

export const filmFromDocument = (film, actorsById) => ({
  filmId: film.tmdbId,
  title: film.title,
  year: String(film.year),
  cast: [...(film.cast ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((member) => {
      const actor = actorsById.get(String(member.actor))
      if (!actor) throw new Error(`${film.title}: actor ${member.actor} is not in the actors collection`)
      return {
        billing: member.order,
        tmdbId: Number(actor.tmdbPersonId),
        actor: actor.displayName,
        character: member.character,
      }
    }),
})

export const validateJudgement = (judgement, castIds) => {
  if (!Array.isArray(judgement?.cast)) return ["no cast array"]
  const errors = []
  const seen = new Set()
  for (const entry of judgement.cast) {
    if (!castIds.includes(entry.tmdbId)) errors.push(`unknown tmdbId ${entry.tmdbId}`)
    if (seen.has(entry.tmdbId)) errors.push(`tmdbId ${entry.tmdbId} appears more than once`)
    if (!TIERS.includes(entry.tier)) errors.push(`tmdbId ${entry.tmdbId}: invalid tier "${entry.tier}"`)
    if (!CONFIDENCES.includes(entry.confidence)) {
      errors.push(`tmdbId ${entry.tmdbId}: invalid confidence "${entry.confidence}"`)
    }
    seen.add(entry.tmdbId)
  }
  for (const id of castIds) {
    if (!seen.has(id)) errors.push(`tmdbId ${id} missing`)
  }
  return errors
}

export const middleTier = (tiers) => {
  const sorted = [...tiers].sort((a, b) => TIERS.indexOf(a) - TIERS.indexOf(b))
  return sorted[Math.floor(sorted.length / 2)]
}

// Low confidence on a minor part isn't flagged: a wrong minor tier moves an actor's points very little.
export const needsReview = (entries, tier) =>
  new Set(entries.map((entry) => entry.tier)).size === entries.length ||
  (tier !== "minor" && entries.some((entry) => entry.confidence === "low"))

export const finalTiers = (castIds, judgements) =>
  castIds.map((tmdbId) => {
    const entries = judgements.map((judgement) => judgement.cast.find((entry) => entry.tmdbId === tmdbId))
    const tier = middleTier(entries.map((entry) => entry.tier))
    return { tmdbId, tier, review: needsReview(entries, tier), answers: entries }
  })

export const tierDistance = (a, b) => Math.abs(TIERS.indexOf(a) - TIERS.indexOf(b))

export const scoreAgainstLabels = (rows) => {
  const agreed = rows.filter((row) => row.tier === row.label).length
  return {
    total: rows.length,
    agreed,
    agreement: rows.length === 0 ? 0 : agreed / rows.length,
    mismatches: rows.filter((row) => row.tier !== row.label),
    moreThanOneOut: rows.filter((row) => tierDistance(row.tier, row.label) > 1),
  }
}

const REVIEW_FILM_COLUMN = 0
const REVIEW_ACTOR_COLUMN = 4
const REVIEW_DECISION_COLUMN = 9

// Returns a Map of film TMDb id to a Map of actor TMDb id to tier: hand labels for the test films,
// otherwise the combined judges' tiers with review decisions in their place.
export const tiersToApply = ({ labelFilms, results, reviewCsv }) => {
  const errors = []
  const tiers = new Map()
  for (const film of results) {
    tiers.set(film.filmId, new Map(film.cast.map((member) => [member.tmdbId, member.tier])))
  }

  const [, ...reviewRows] = parseCsv(reviewCsv)
  reviewRows.forEach((columns, index) => {
    const filmId = columns[REVIEW_FILM_COLUMN]
    const tmdbId = Number(columns[REVIEW_ACTOR_COLUMN])
    const decision = (columns[REVIEW_DECISION_COLUMN] ?? "").trim()
    const filmTiers = tiers.get(filmId)
    if (!TIERS.includes(decision)) {
      errors.push(`review.csv row ${index + 2}: decision "${decision}" is not a tier`)
    } else if (!filmTiers?.has(tmdbId)) {
      errors.push(`review.csv row ${index + 2}: actor ${tmdbId} is not in the results for film ${filmId}`)
    } else {
      filmTiers.set(tmdbId, decision)
    }
  })

  for (const film of labelFilms) {
    if (tiers.has(film.filmId)) {
      errors.push(`${film.title}: in both the test labels and the results`)
      continue
    }
    tiers.set(film.filmId, new Map(film.cast.map((member) => [member.tmdbId, member.label])))
  }
  return { tiers, errors }
}

// Matches a stored cast, given as [{ tmdbId, tier }] in stored order, against the tiers for its film.
// Returns the changes by cast index, or errors when the two casts differ.
export const castTierChanges = (storedCast, filmTiers) => {
  const errors = []
  const storedIds = new Set(storedCast.map((member) => member.tmdbId))
  for (const tmdbId of filmTiers.keys()) {
    if (!storedIds.has(tmdbId)) errors.push(`actor ${tmdbId} has a tier but is not in the stored cast`)
  }
  const changes = []
  storedCast.forEach((member, index) => {
    const tier = filmTiers.get(member.tmdbId)
    if (!tier) errors.push(`actor ${member.tmdbId} is in the stored cast but has no tier`)
    else if (member.tier !== tier) changes.push({ index, tier })
  })
  return { changes: errors.length > 0 ? [] : changes, errors }
}
