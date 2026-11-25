# Film cast tiers

Agreed on 23-11-2026. Changed on 24-11-2026 to run as Claude Code agents in a workflow, not the API, and to four tiers.

## Context
- **What happens today:** each film stores its top 15 credited cast in TMDb billing order (`creditedCast` in `film-api/lambda/tmdb-cast.ts`).
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

## Tiers and points

| Tier | Value | Share of the film's points |
|---|---|---|
| Lead | `lead` | 1.0 |
| Major supporting | `major` | 0.7 |
| Supporting | `supporting` | 0.4 |
| Minor | `minor` | 0.2 |

- A tier reflects how much of the story belongs to the character, never billing, fame or character type.
- A film has as many leads as it needs: one, a pair, several, or none when an ensemble spreads the story thinly.
- Cast with no tier count as `supporting` (0.4) until set.
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
   - Films where all three differ, or any answer is low confidence, are logged for review.

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
   - Replace `leadActorIds` on PATCH `/film/{id}` with an actor-to-tier map.
   - Replace the Main toggle with a four-option tier picker.
   - Show the tier name in the person modal.
   - Flag films whose cast has no tiers.
3. **Full run:**
   - `prepare.mjs --all-watched` exports the watched films' casts from the database, read-only, skipping the test films.
   - The workflow runs in batches of about 50 films, as one workflow is capped at 1,000 agents.
   - `score.mjs --all-watched` combines the answers into `runs/watched-results.json`.
4. **Apply:**
   - Review the logged films.
   - Apply the tiers from the file in a separate step.
   - Recalculate actor stats.
5. **Clean up:** remove `cast[].lead`, `leadActorIds` and `SUPPORTING_ROLE_WEIGHT`.
