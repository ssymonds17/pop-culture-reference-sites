# Film cast tiers

Agreed on 23-11-2026. Nothing is built yet.

## Context
- **What happens today:** each film stores its top 15 credited cast in TMDb billing order (`creditedCast` in `film-api/lambda/tmdb-cast.ts`).
  - Leads are tagged by hand with `cast[].lead`, through the Main toggle in `FilmDetailModal`.
  - An actor earns a film's full points as a lead and `SUPPORTING_ROLE_WEIGHT = 0.4` otherwise (`film-api/lambda/mongodb/services/actors.ts`).
- **What's wrong with that:**
  - Two levels is too coarse to score accurately.
  - Billing order can't tell a single-lead film from a two-hander or an ensemble.
  - Hand-tagging ~500 watched films isn't practical.
- **The aim:**
  - Five tiers per cast member per film.
  - The watched films are backfilled by Claude.
  - New films are tiered by hand.
- The existing Main flags are dropped.
- **Size of the job:** 509 watched films as of 23-11-2026.
  - Many silent and early sound films have fewer than 15 cast stored, as TMDb credits fewer. That's expected.
  - *The Adventures of Prince Achmed* has no cast stored and is skipped.

## Rejected alternatives
- **Billing order alone:** it can't tell a single lead from a two-hander, three co-leads or an ensemble, and it misses high-billed cameos and low-billed leads. Every film has to be judged on its own.
- **Your Claude subscription:** a subscription is only usable through Claude Code, which has usage limits and isn't meant for batch jobs. The API key is the supported route; `japanese-flashcards` already uses one.
- **Asking about each actor separately:** a tier only makes sense relative to the rest of the cast, so each call covers the whole film.
- **Wikipedia as the only source:** its quality varies and it's thin for smaller films.
- **Other sources:** screenplay line counts, awards categories and fan screen-time lists each cover too few films to use alone. Awards are also skewed by studios campaigning leads as supporting.
- **A separate web search in each judging run:** each run could read different pages, so disagreements would reflect the sources found, not the model's uncertainty. Researching once gives all three runs the same evidence.
- **Averaging the answers, or always taking the lowest tier:** tiers aren't numbers, so there's nothing to average. Taking the lowest lets one stray answer override two that agree.

## Tiers and points

| Tier | Value | Share of the film's points |
|---|---|---|
| Lead | `lead` | 1.0 |
| Major supporting | `major` | 0.7 |
| Supporting | `supporting` | 0.4 |
| Minor | `minor` | 0.2 |
| Cameo | `cameo` | 0.1 |

- A tier reflects how much of the story belongs to the character, never billing, fame or character type.
- A film has as many leads as it needs: one, a pair or a whole ensemble.
- Cast with no tier count as `supporting` (0.4) until set.
- An actor with several roles in a film takes their highest tier.

## How a film is classified
1. **Research call:**
   - Claude Opus 5.5 (`claude-opus-5-5`) with the server-side web search tool on (`web_search_20260209`), which is charged per search.
   - It writes notes: a plot summary and, for each cast member, their part in the story, how much of the film they're in, any lead or supporting award nominations, and the source URLs.
   - It writes "unknown" rather than guess.
2. **Judging calls:**
   - Three calls on the same notes, with no web search.
   - Each returns JSON: `{ cast: [{ tmdbId, tier, confidence, reason }] }`.
   - The script checks that every cast member comes back exactly once.
3. **Final tier:**
   - The middle of the three answers, so a majority wins when two agree.
   - Films where all three differ, or any answer is low confidence, are logged for review.

## Prompts

### Research call

```
You are researching a film's cast so that a separate step can judge how significant each
actor's part is. Do not judge or rank the parts yourself.

Film: {title} ({year})
TMDb overview: {overview}
Cast (billing position, actor, character):
{1. Actor Name as Character Name ... up to 15}

Search the web for the film's plot and for what each listed character does in it. Prefer the
film's Wikipedia article, reviews from established outlets and official studio material.

Write:
1. A plot summary of 150-300 words that names the characters involved.
2. For each cast member, in billing order:
   - Actor and character
   - What the character does in the story, in one to three sentences
   - How much of the film they are in: throughout / a large part / several scenes /
     one or two scenes / unknown
   - Any lead or supporting acting award nominations for this role
3. The URLs you relied on.

If you find nothing on a cast member, write "unknown". Do not fill gaps with guesses.
```

### Judging call

```
You will assign each cast member of a film to one tier according to how significant their
part is in this film. Use the research notes as your main evidence and your own knowledge of
the film to support them.

Tiers:
- lead: the film is substantially this character's story. They are central from start to
  finish and the plot cannot be told without them.
- major: a substantial part with a storyline of their own or a large effect on the plot,
  but the film is not principally their story.
- supporting: named, recurring and matters to the plot, but has no storyline of their own.
- minor: a handful of scenes with a small role in the plot.
- cameo: a single scene or brief appearance.

Rules:
- Judge the part, not the actor's fame or billing position. Billing is a hint you may
  overrule.
- The type of character never decides the tier. An antagonist, love interest, partner or
  mentor is a lead when the film is as much their story as the protagonist's, and may be
  supporting or minor when their part is small.
- There is no fixed number of leads. A film may have one, a pair, or an ensemble in which
  every central character is a lead.
- Several roles in the film: judge the combined part.
- Voice roles: judge them the same as on-screen roles.
- One character played by different actors at different ages: judge each actor's own share.
- Playing themselves or archive footage only: cameo, unless the part is substantial.
- Off-screen narrator: supporting if the narration runs throughout the film, otherwise minor.
- If the notes say "unknown" and you do not know the film well, use billing position and set
  confidence to low.

Film: {title} ({year})
Cast (billing position, TMDb id, actor, character):
{...}

Research notes:
{research summary}

Return one entry for every cast member listed, with tier, confidence (high/medium/low) and a
one-sentence reason.
```

- The prompt has no example films for now.
- If the test shows a consistent drift, add examples from films labelled by hand, never from the test set.

## Test before the full run
- **The test set:** 30 watched films covering single-lead, two-hander, ensemble, cameo-heavy, animated and less familiar films, tiered by hand in `film-api/scripts/cast-tiers/test-labels.csv` as 1 (lead) to 5 (cameo).
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
- **Cost:** measure the cost per film during the test and estimate the full run before starting it.

## Build order
1. **Script:** add a classify script in `film-api/scripts/` using `@anthropic-ai/sdk` with `ANTHROPIC_API_KEY`.
   - It writes notes, all three answers, reasons and final tiers to a local JSON file.
   - It never writes to the database.
   - Run it on the test set.
2. **Data and app:**
   - Replace `cast[].lead` with `cast[].tier`.
   - Set the tier points in `updateActorStats`.
   - Replace `leadActorIds` on PATCH `/film/{id}` with an actor-to-tier map.
   - Replace the Main toggle with a five-option tier picker.
   - Show the tier name in the person modal.
   - Flag films whose cast has no tiers.
3. **Full run:** run the script over all watched films, writing to the JSON file.
4. **Apply:**
   - Review the logged films.
   - Apply the tiers from the file in a separate step.
   - Recalculate actor stats.
5. **Clean up:** remove `cast[].lead`, `leadActorIds` and `SUPPORTING_ROLE_WEIGHT`.
