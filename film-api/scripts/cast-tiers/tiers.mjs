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
