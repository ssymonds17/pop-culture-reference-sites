# Film cast tiers

Agreed on 23-11-2026. Changed on 24-11-2026 to run as Claude Code agents in a workflow, not the API, and to four tiers. Applied to the watched films on 27-11-2026.

## Context
- **Before this change:** each film stores its top 15 credited cast in TMDb billing order (`creditedCast` in `film-api/lambda/tmdb-cast.ts`).
  - Leads are tagged by hand with `cast[].lead`, through the Main toggle in `FilmDetailModal`.
  - An actor earns a film's full points as a lead and `SUPPORTING_ROLE_WEIGHT = 0.4` otherwise (`film-api/lambda/mongodb/services/actors.ts`).
- **What's wrong with that:**
  - Two levels is too coarse to score accurately.
  - Billing order can't tell a single-lead film from a two-hander or an ensemble.
  - Hand-tagging ~500 watched films isn't practical.
- **The aim:**
  - Four tiers per cast member per film.
  - The watched films are backfilled by Claude.
  - New films are tiered by hand.
- The existing Main flags are dropped.
- **Size of the job:** 509 watched films as of 23-11-2026.
  - Many silent and early sound films have fewer than 15 cast stored, as TMDb credits fewer. That's expected.
  - *The Adventures of Prince Achmed* has no cast stored and is skipped.

## Rejected alternatives
- **Billing order alone:** it can't tell a single lead from a two-hander, three co-leads or an ensemble, and it misses high-billed cameos and low-billed leads. Every film has to be judged on its own.
- **The Anthropic API with a classify script:** it needs `@anthropic-ai/sdk` and a separately paid key. Claude Code agents in a workflow run the same research and judging steps on the subscription. The test run's usage decides whether the full run fits the subscription's limits.
- **Asking about each actor separately:** a tier only makes sense relative to the rest of the cast, so each call covers the whole film.
- **Wikipedia as the only source:** its quality varies and it's thin for smaller films.
- **Other sources:** screenplay line counts, awards categories and fan screen-time lists each cover too few films to use alone. Awards are also skewed by studios campaigning leads as supporting.
- **A separate web search in each judging run:** each run could read different pages, so disagreements would reflect the sources found, not the model's uncertainty. Researching once gives all three runs the same evidence.
- **A separate cameo tier below minor (0.1 points):** the line between minor and cameo was too vague to label consistently. In the first test run, 61 of the 151 misses were between those two tiers, a difference of 0.1 points.
- **Averaging the answers, or always taking the lowest tier:** tiers aren't numbers, so there's nothing to average. Taking the lowest lets one stray answer override two that agree.
- **A marker for untiered cast in the film list:** list queries leave out `cast`, so it would need the cast back in every list response or a new stored flag. Once the watched films are tiered, only newly added films are untiered, and the note in the film detail modal covers them.
- **Hiding the untiered state in the frontend only:** the frontend can't tell an untiered role from a real supporting one if the API reports both as `supporting`, so the actor endpoint omits the tier instead.

## Tiers and points

| Tier | Value | Share of the film's points |
|---|---|---|
| Lead | `lead` | 1.0 |
| Major supporting | `major` | 0.7 |
| Supporting | `supporting` | 0.4 |
| Minor | `minor` | 0.2 |

- A tier reflects how much of the story belongs to the character, never billing, fame or character type.
- A film has as many leads as it needs: one, a pair, several, or none when an ensemble spreads the story thinly.
- Cast with no tier count as `supporting` (0.4) until set, but show as having no tier: the actor endpoint leaves `tier` out for them.
- An actor with several roles in a film takes their highest tier.

## How a film is classified
1. **Research agent:**
   - A Claude Code agent with web search and fetch, writing to `runs/<film_tmdb_id>/research.md`.
   - It writes notes: a plot summary and, for each cast member, their part in the story, how much of the film they're in, any lead or supporting award nominations, and the source URLs.
   - It writes "unknown" rather than guess.
2. **Judging agents:**
   - Three Sonnet agents on the same notes, told not to use the web.
   - Each writes JSON to `runs/<film_tmdb_id>/judge-<n>.json`: `{ cast: [{ tmdbId, tier, confidence, reason }] }`.
   - `score.mjs` checks that every cast member comes back exactly once.
3. **Final tier:**
   - The middle of the three answers, so a majority wins when two agree.
   - Cast are logged for review when all three answers differ, or any answer is low confidence and the final tier is above minor. A wrong minor tier moves an actor's points very little.

## Prompts
- **Research:** `film-api/scripts/cast-tiers/prompts/research.md`.
- **Judging:** `film-api/scripts/cast-tiers/prompts/judge.md`.
- The prompts have no example films for now.
- If the test shows a consistent drift, add examples from films labelled by hand, never from the test set.

## Test before the full run
- **The test set:** 30 watched films covering single-lead, two-hander, ensemble, cameo-heavy, animated and less familiar films, tiered by hand in `film-api/scripts/cast-tiers/test-labels.csv` as 1 (lead) to 4 (minor).
- **The bar:** at least 90% agreement with the hand labels, and nothing more than one tier out.
- **Checking labels:** the script stops on a blank or out-of-range label and names the row.
- **How the CSV was made:** generated once from the stored casts on 23-11-2026 by a throwaway script, which wasn't kept. Recently added films were chosen by date added, as no rating date is stored.
- **What the films test:**
  - **Single lead:** Lawrence of Arabia, Raging Bull, The Passion of Joan of Arc, Darkest Hour, Project Hail Mary
  - **Co-leads:** It Happened One Night, The Apartment, The Banshees of Inisherin, Trading Places, Some Like It Hot, The Lost City
  - **Villain as possible lead:** The Good, the Bad and the Ugly, Casino Royale
  - **Lead changes mid-film:** Psycho
  - **Ensembles:** Love Actually, Grand Hotel, Cool Runnings, A Time to Kill, The Hangover Part II
  - **Cameos:** Hot Fuzz, The Lost City
  - **Several roles, rule 1:** Austin Powers. Mickey 17 lists Robert Pattinson only once, so it's a weak test.
  - **Voice roles, rule 2:** Toy Story, Spirited Away (Japanese voice cast stored), Frozen II
  - **Different ages, rule 3:** Aftersun, 17 Again
  - **Thin sources:** Side Streets, Heroes for Sale
  - **Also in the set:** 21 Jump Street. Its well-known cameos aren't in the stored top 15, so it works only as a co-lead film.
  - **Not tested:** rule 4 (playing themselves) and rule 5 (off-screen narrator).
- **Iterating:** adjust the tier wording until the bar is met.
- **Usage:** compare `/usage` before and after the test run and scale by 17 to estimate the full run before starting it.

### Test outcome, 25-11-2026
- **Result:** the bar wasn't met. Opus judges reached 79.2% agreement and Sonnet judges 79.9%, with no row more than one tier out on Sonnet.
- **Decision:** accepted for the full run. On review, the labeller agreed with the model's call on every row more than one tier out, so most of the gap is noise in the hand labels.
- **Judging model:** Sonnet. It agreed with Opus's final tier on 89.4% of rows. Its judges split more often (61 rows against 31), so more cast is flagged for review.
- **Usage:** Sonnet judging of the 30 films took about 7% of a session and 2% of the week. Research cost is measured on the first full-run batch.

## Build order
1. **Agents and scoring:** in `film-api/scripts/cast-tiers/`.
   - `prepare.mjs` writes each test film's cast, without labels, to `runs/<film_tmdb_id>/cast.md`.
   - `classify.workflow.mjs` runs one research agent and three judging agents per film.
   - `score.mjs` validates the answers, writes final tiers to `runs/results.json` and scores them against the labels.
   - Nothing writes to the database.
2. **Data and app:**
   - Replace `cast[].lead` with `cast[].tier`.
   - Set the tier points in `updateActorStats`.
   - Replace `leadActorIds` on PATCH `/film/{id}` with `castTiers`, a partial map of actor ID to tier. Actors left out keep their tier, and an actor with several roles gets the tier on each.
   - Replace the Main toggle with a four-option tier picker.
   - Show the tier name in the person modal.
   - Flag films whose cast has no tiers, with a note in the film detail modal.
3. **Full run:**
   - `prepare.mjs --all-watched` exports the watched films' casts from the database, read-only, skipping the test films.
   - The workflow runs in batches of about 50 films, as one workflow is capped at 1,000 agents.
   - `score.mjs --all-watched` combines the answers into `runs/watched-results.json`.
4. **Apply:**
   - Review the logged cast, recording each decision in `film-api/scripts/cast-tiers/review.csv`.
   - `apply.mjs` writes `cast[].tier`: the hand labels for the test films, otherwise `runs/watched-results.json` with the review decisions in place of the flagged rows. It checks every film before writing, skips casts already up to date, and takes `--dry-run` and `--film=<TMDb id>`.
   - Deploy the API first, so nothing recalculates actor stats with the old lead weights.
   - Recalculate actor stats with `backfill-tmdb-credits.mjs`.
5. **Clean up:** remove `cast[].lead` from the schema and the stored films. `leadActorIds` and `SUPPORTING_ROLE_WEIGHT` went with the data and app changes.

## Full run and apply, 25-11-2026 to 27-11-2026
- **Full run:** 478 films in 10 batches, run two at a time. No answer was missing or invalid, no agent read the labels file, and no judge used the web.
- **Usage:** a two-batch run took 384 agents, about 19.5 million subagent tokens and 25 minutes.
- **Review:** 176 cast across 131 films were flagged, under 3% of the cast. The labeller kept the judges' tier for 149 and changed 27: 24 from supporting to minor, and the three shared voices of Wart in *The Sword in the Stone* to lead.
- **Drift:** at the line between supporting and minor, the judges lean towards supporting despite the rule to choose the lower tier.
- **Rollout:**
  1. The API was deployed and tested on *Hot Fuzz* through PATCH `/film/{id}`: tiers landed on the right cast, actor points matched the expected values, and a bad tier was rejected.
  2. `apply.mjs` ran on *Hot Fuzz* alone, then on every watched film: 508 films and 6,599 cast (785 lead, 734 major, 1,241 supporting, 3,839 minor).
  3. The stats backfill updated 3,491 of 24,536 actors, 420 up and 3,071 down. A second dry run found no drift.
- **Afterwards:** unwatched films stay untiered. The actor endpoint shows no tier for them, and the film detail modal notes untiered cast.
