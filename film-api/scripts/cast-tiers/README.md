# Cast tiers

Scripts that tiered the cast of every watched film with Claude Code agents. Tier meanings and points are in the [film-api README](../../README.md#keeping-stats-in-step). Newly watched films are tiered by hand in the film detail modal, so these scripts are only needed to re-judge the collection.

Run from `film-api/`. Agent output goes to `scripts/cast-tiers/runs/`, which is gitignored.

## Pipeline

1. **`prepare.mjs`** writes each film's cast to `runs/<film_tmdb_id>/cast.md`. By default it covers the 30 hand-labelled films in `test-labels.csv`. With `--all-watched` (needs `.env`), it reads every other watched film with a cast and lists them in `runs/watched-films.json`. It never writes to the database.
2. **`classify.workflow.mjs`** is a Claude Code workflow. For each film, one research agent writes notes to `research.md` using the web and `prompts/research.md`. Three Sonnet judges then each write `judge-<n>.json` from those notes, using `prompts/judge.md` and no web access.
3. **`score.mjs`** takes the middle of the three judges' tiers for each cast member. By default it scores the test films against `test-labels.csv`. With `--all-watched`, it writes `runs/watched-results.json` and flags for review any cast where the judges all disagree, or where a low-confidence answer lands above minor.
4. **`review.csv`** records the hand decision for each flagged cast member.
5. **`apply.mjs`** writes the tiers to the database. It checks every film first and skips casts already up to date. It takes `--dry-run` and `--film=<TMDb id>`.
6. **`../backfill-tmdb-credits.mjs`** recalculates actor stats afterwards.

`tiers.mjs` holds the shared logic, and `tiers.test.mjs` tests it.

## Running notes

- A workflow is capped at 1,000 agents, so run films in batches of about 50. A two-batch run used 384 agents, about 19.5 million subagent tokens and 25 minutes.
- The judges lean towards `supporting` where a role sits between supporting and minor, even though the prompt says to pick the lower tier. Expect most review changes to be supporting moved down to minor.
- On the test set, Sonnet judges agreed with the hand labels 79.9% of the time, and no answer was more than one tier out. Most of the disagreements were noise in the hand labels.
