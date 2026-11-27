export const meta = {
  name: 'cast-tier-classify',
  description: 'Research and triple-judge cast tiers for a batch of films',
  whenToUse: 'Run from Claude Code with args { baseDir, research, judge, films } after prepare.mjs',
  phases: [
    { title: 'Research', detail: 'one web-research agent per film' },
    { title: 'Judge', detail: 'three independent Sonnet judging agents per film', model: 'sonnet' },
  ],
}

const fill = (template, values) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template)

const results = await pipeline(
  args.films,
  async (film) => {
    const dir = `${args.baseDir}/${film.filmId}`
    const prompt = fill(args.research, {
      title: film.title,
      year: film.year,
      castFile: `${dir}/cast.md`,
      researchFile: `${dir}/research.md`,
    })
    const out = await agent(prompt, { label: `research:${film.title}`, phase: 'Research' })
    if (out === null) throw new Error(`research failed for ${film.title}`)
    return out
  },
  async (_, film) => {
    const dir = `${args.baseDir}/${film.filmId}`
    const judges = await parallel(
      [1, 2, 3].map((n) => () =>
        agent(
          fill(args.judge, {
            title: film.title,
            year: film.year,
            castFile: `${dir}/cast.md`,
            researchFile: `${dir}/research.md`,
            outputFile: `${dir}/judge-${n}.json`,
          }),
          { label: `judge-${n}:${film.title}`, phase: 'Judge', model: 'sonnet' },
        ),
      ),
    )
    return { film: film.title, judgesDone: judges.filter(Boolean).length }
  },
)

const failed = args.films.filter((film, i) => results[i] === null).map((film) => film.title)
const partial = results.filter((result) => result && result.judgesDone < 3)
if (failed.length) log(`Research failed: ${failed.join(', ')}`)
return { completed: results.filter(Boolean).length, failed, partial }
