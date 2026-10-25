# Film person links plan

## Context
Actors were added recently. The asks are:
1. TMDb and IMDb links on actors and directors, present immediately (stored, backfilled).
2. Show a director's or actor's full filmography from TMDb, with TMDb's live score.
3. Add films to the collection from the director/actor modal.
4. Show IMDb ratings while browsing the "All films" tab. TMDb doesn't provide IMDb ratings, and the official IMDb API costs around $150k a year, so the ratings come live from OMDb.
5. Show whether an actor is a lead or support in each of their films on the "Your films" tab. This builds on the lead role work: `CastMember.lead` (`film-api/lambda/mongodb/models/film.ts`) is set by hand in the film detail modal, and an unset value means support.

Findings that shape the plan:
- Actors and directors already store `tmdbPersonId` (`film-api/lambda/mongodb/models/actor.ts:6`, `director.ts:5`), so the TMDb link needs no data: `https://www.themoviedb.org/person/{tmdbPersonId}`.
- IMDb person ids (`nm…`) are not stored. TMDb returns them from `GET /person/{id}/external_ids` (`imdb_id`, may be null).
- TMDb `GET /person/{id}?append_to_response=movie_credits` returns each credit with `vote_average` and `vote_count`, so the TMDb score comes free and live with the filmography.
- Both modals are one shared component, `film/src/components/Modal/PersonFilmsModal.tsx`, driven by `film/src/lib/personKinds.ts`.
- Add film only needs `POST /film { tmdbId }` (`create-film.ts`). It returns 409 on duplicates and is authenticated through `createAuthenticatedClient` (`film/src/lib/auth-api.ts`), as in `AddFilmModal.tsx` `handleCreateFilm` (the request is at lines 98-99).
- `getActorByTmdbPersonId` (`services/actors.ts`) selects `EXCLUDE_DETAIL_FIELDS`, so the actor's films come back without `cast` and there's no lead flag to show yet.
- Caveat: `create-film.ts` keeps only the top 10 billed cast (`MAX_CAST`). Adding a film where the actor is billed 11th or lower won't link them, so it won't appear under "Your films". "In collection" on the TMDb tab is therefore worked out by `tmdbId`, not by cast link.

## Agreed UX
- The person modal header shows `TMDB | IMDB` links, with IMDb only when the id exists.
- Two tabs:
  - "Your films": the current table, shown by default. For actors, it gains a "Role" column showing Lead or Support.
  - "All films": the TMDb filmography, loaded on first click. Each row shows the year, the TMDb score, a TMDb link, the IMDb rating (loaded automatically), and an Add button or an "In collection" label.

## Part 1: IMDb person ids (backend)
1. Add an optional `imdbPersonId: String` to the Actor and Director models (`actor.ts`, `director.ts`) and to the frontend `Person` type (`film/src/types/index.ts:58-64`).
2. `findOrCreateActor` and `findOrCreateDirector` (`services/actors.ts:6-24`, `services/directors.ts:6-20`): accept an optional `imdbPersonId` and `$set` it only when provided, matching the existing `profilePath` handling.
3. `create-film.ts`, before upserting the cast and directors:
   - Find which `tmdbPersonId`s have no `imdbPersonId` yet, with one `find` and `$in` per collection.
   - Fetch `/person/{id}/external_ids` for those people only, in parallel.
   - A failed lookup must not fail the film's creation; the backfill picks it up later.
   - That's typically 0 to 11 calls per film, fewer as the collection grows.
4. Script `film-api/scripts/backfill-person-imdb-ids.mjs`, modelled on `backfill-director-photos.mjs`:
   - The same strict argument parsing (`--dry-run`, `--limit=N`), 429 retry, 100 ms delay and `bulkWrite` batches.
   - It runs over both `actors` and `directors` where `imdbPersonId` doesn't exist, and the filter in each update repeats that condition.
   - People TMDb has no IMDb id for get `imdbPersonId: null`. The query uses `$exists: false`, so they aren't fetched again on every run.
5. Tests:
   - `actors.test.ts` and `directors.test.ts`: the IMDb id is set only when given.
   - `create-film.test.ts`: `external_ids` is fetched only for people missing an id, and a failed fetch is tolerated.

## Part 2: TMDb filmography endpoint (backend)
1. New Lambda `film-api/lambda/get-tmdb-person-films.ts`, modelled on `get-tmdb-film-details.ts`:
   - Calls `GET /person/{tmdbPersonId}?append_to_response=movie_credits`.
   - Takes `kind=actor|director` as a query parameter:
     - actor uses `movie_credits.cast`, dropping any `character` containing "(uncredited)" as `creditedCast` does
     - director uses `movie_credits.crew` where `job === "Director"`
   - Removes duplicate films by id and sorts by `release_date`, newest first, with undated films last.
   - Runs `Film.find({ tmdbId: { $in: ids } }, { tmdbId: 1 })` to set `inCollection`.
   - Returns `{ data: [{ tmdbId, title, year, character?, tmdbRating, tmdbVoteCount, inCollection }] }`, or 404 when TMDb returns 404.
   - Needs no sign-in, like `get-tmdb-film-details`.
2. Add the route `tmdb/person/{tmdbPersonId}` in `film-api/lib/api-stack.ts`, next to `tmdb/{tmdbId}` (around line 393).
3. Tests in `get-tmdb-person-films.test.ts`, in the style of `create-film.test.ts`: URL and params, actor and director filtering, uncredited roles dropped, duplicate removal, sorting, `inCollection`, and 404.
4. A Bruno request in `film-api/bruno/`.

## Part 2b: Lead or support in the actor's films (backend)
1. `getActorByTmdbPersonId` in `services/actors.ts`:
   - Select `-productionCompanies -tmdbCollection` instead of `EXCLUDE_DETAIL_FIELDS`, so `cast` is loaded.
   - Add `lead: boolean` to each film, true when any of the actor's cast entries in that film has `lead`. That's the same "any role" rule `updateActorStats` uses for points.
   - Remove `cast` before returning, so the response stays as small as it is now.
   - Directors are unchanged.
2. Tests in `actors.test.ts`: the select string, `lead` set for a lead, unset or false meaning support, an actor with several roles, and `cast` left out of the response.

## Part 3: Frontend (film)
1. `film/src/lib/api.ts`: add `tmdbPersonFilms: (tmdbPersonId) => .../tmdb/person/${id}`.
2. `PersonFilmsModal.tsx`:
   - Header (around lines 107-114): `TMDB` and `IMDB` links styled like `FilmDetailModal.tsx:670-697`, with `target="_blank" rel="noopener noreferrer"`. Take `imdbPersonId` from the detail fetch response, so `FilmCard`'s partial director object still works.
   - Tabs: "All films" is fetched once per `${kind}:${tmdbPersonId}`. Show the TMDb score to one decimal place, and hide it when `tmdbVoteCount` is 0.
   - Each "All films" row links to `themoviedb.org/movie/{tmdbId}`.
   - Add button: posts `{ tmdbId }` to `API_ENDPOINTS.createFilm` through `createAuthenticatedClient(getToken)`. Each row has its own adding and error state, and a 409 is shown as "In collection". On success, mark the row as in the collection and refetch "Your films".
   - A film added here works like one added through the Add film modal: every cast member starts as support, including the actor whose modal it was added from. Leads are tagged in the film detail modal.
   - "Your films" for actors: a "Role" column showing "Lead" or "Support" from the film's `lead` flag. Add `lead?: boolean` to the films the actor endpoint returns, not to `Film`, because only this endpoint sets it. The column is hidden for directors.
3. Tests in `PersonFilmsModal.test.tsx`:
   - The links render, with IMDb hidden when there's no id.
   - The tab fetches only when opened, and the score displays.
   - Add posts `{ tmdbId }`, and a 409 is handled.
   - The Role column shows Lead and Support for an actor and is absent for a director.

## Part 4: IMDb ratings on the "All films" tab
Changed on 23-10-2026 from click-per-row to loading every row automatically. The OMDb key allows 100,000 requests a day, not the free tier's 1,000, so a 50-film filmography costs 50 requests and still allows about 2,000 opens a day. Ratings are fetched live and nothing is stored.
1. `OMDB_API_KEY` is required in `film-api/lib/api-stack.ts`, like the other keys, and passed only to the ratings Lambda. OMDb is unofficial, so its figure can differ slightly from imdb.com.
2. New Lambda `film-api/lambda/get-imdb-ratings.ts`, wrapped in `requireAuth`, at `GET /tmdb/imdb-ratings?tmdbIds=…`:
   - Takes up to 100 TMDb IDs, removing duplicates. Anything else is a 400.
   - IMDb IDs come from the database for films in the collection (`findStoredImdbIds`), otherwise from TMDb `GET /movie/{tmdbId}/external_ids`.
   - Ratings and votes come from OMDb, with `"N/A"` read as null and "1,234,567" as a number.
   - Lookups run 10 at a time within a 20-second budget, under API Gateway's 29-second limit.
   - Returns `{ data: { [tmdbId]: { imdbId, imdbRating, imdbVotes } | null } }`. Null means that film's lookup failed or ran out of time, without failing the others.
   - A rejected OMDb key (HTTP 401, including a used-up daily allowance) fails the whole request with a 502 and stops the remaining lookups, since every film would fail.
   - Throttled to 2 requests a second with a burst of 5, as one request can make up to 200 upstream calls.
3. Frontend:
   - Add `API_ENDPOINTS.imdbRatings` to `film/src/lib/api.ts`.
   - Once a filmography loads, request its IMDb ratings through the authenticated client, in batches of 100. Keep them per `tmdbId` while the modal is mounted, like the filmography.
   - An IMDb column beside TMDb shows the rating and `formatVoteCount` votes with an IMDb link, a loading state until the batch arrives, "-" when IMDb has no rating, and a retry when the lookup failed.
4. Tests:
   - `get-imdb-ratings.test.ts`: the call sequence, stored IDs skipping TMDb, no IMDb ID, `"N/A"`, OMDb not knowing the title, a single failure, duplicates, concurrency, the time budget, validation and a 502.
   - `PersonFilmsModal.test.tsx`: ratings load after the filmography, in batches, are shown with votes and a link, and handle no rating, failure and retry.

## Effort
- Parts 1-3: roughly a day. Part 1 is about half of that (model fields, create-film lookups, backfill); Parts 2 and 3 are the rest.
- Part 2b and the Role column: roughly an hour more.
- Part 4: roughly two hours more.

## Commits
1. Person IMDb ids: models, services, create-film, tests.
2. The backfill script.
3. The TMDb person films Lambda, route, tests and Bruno request.
4. Lead or support on the actor endpoint, with tests.
5. Frontend links, tabs, the Add button and the Role column.
6. The IMDb ratings Lambda, route, OMDb environment variable and tests.
7. The frontend IMDb column.

## Verification
- Unit tests for new and changed code, run only when asked.
- Backfill: run `node --env-file=.env scripts/backfill-person-imdb-ids.mjs --dry-run --limit=5`, then a real run, and spot-check a few `nm` ids against IMDb.
- Add a new film through the existing modal and confirm the new actors and directors get an `imdbPersonId`.
- Bruno: `GET /tmdb/person/{id}?kind=actor` and `kind=director` for a known person.
- Bruno: `GET /tmdb/imdb-ratings?tmdbIds=348,679`, signed in, and compare the figures with imdb.com.
- In the app:
  - Open an actor modal and a director modal and check both links.
  - Open "All films" and check the scores.
  - Add a film, confirm it appears in /films and that the row shows "In collection".
  - Add the same film again and check it shows "In collection" rather than an error.
  - In an actor's "Your films", check that a film where they're tagged as a lead shows Lead and the rest show Support. Change a lead in the film detail modal, reopen the actor modal and check that the Role column follows.
  - Check that a director's modal has no Role column.
