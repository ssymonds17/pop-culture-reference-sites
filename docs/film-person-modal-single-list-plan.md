# Person modal: one list, with the filtering done in the API

Agreed on 25-10-2026. Part 1 (API) is committed; Part 2 (frontend) is written. It replaces the two-tab design from `docs/film-person-links-plan.md` (Part 3) and the client-side vote filter from `docs/film-imdb-vote-filter-plan.md`.

## Context
- **Before this plan:** the actor and director modal (`film/src/components/Modal/PersonFilmsModal.tsx`) had two tabs.
  - "All films" fetched the TMDb filmography.
  - Then it requested IMDb ratings in batches from a second endpoint (`/tmdb/imdb-ratings`).
  - Then it filtered by vote count in the browser.
- **What was wrong with that:**
  - Most of the logic sat in the frontend.
  - Unreleased and obscure films still reached the browser.
  - The two tabs split your films from the wider filmography.
- **The aim:**
  - One list in the modal.
  - Filtering done by the API in a single request.
  - OMDb is only used when you ask for it.

Checked on 25-10-2026: TMDb's person movie credits have no `status` field. The fields are `adult`, `backdrop_path`, `genre_ids`, `id`, `original_language`, `original_title`, `overview`, `popularity`, `poster_path`, `release_date`, `title`, `video`, `vote_average`, `vote_count`, `character`, `credit_id` and `order`. `status` is only on a film's details (`/movie/{id}`).

## Agreed layout
Changed on 25-10-2026: your films show your rating only, with no IMDb figures, so the API skips collection films entirely.

- **Your films, shown on open** from the database, as today's "Your films" does. No TMDb or OMDb calls are made. Columns:
  - Title, without a character, as the actor endpoint doesn't return the cast
  - Year
  - Role (Lead or Support, actors only)
  - Your rating (renamed from "Rating")
  - Owned
- **The button:** under an "Other films" heading below your films, "Load other films and IMDb ratings". Clicking it makes one API request, and the list replaces the button. Nothing already on screen moves.
- **Other films:** the person's filmography minus your collection. Columns:
  - Title, with "as <character>" for actors
  - Year
  - IMDb: a coloured box (`film/src/components/Rating/ImdbRatingBox.tsx`) holding the rating and vote count, linking to IMDb. It's red below 5.0, brown 5.0 to 5.9, yellow 6.0 to 6.9, green 7.0 to 7.9 and purple from 8.0. "Your rating" stays plain text.
  - Add. After an Add, the row stays and reads "In collection", and your films refresh.
- **Caching:** the result is kept per person and kind while the modal is mounted, so reopening the same person doesn't request again.
- **Hidden count:** a line under "Other films", for example "23 films hidden: unreleased, no IMDb data, fewer than 1,000 IMDb votes or couldn't be checked". There's no Show all, because the API never sends those films.

## Part 1: API
1. **Rework `GET /tmdb/person/{tmdbPersonId}?kind=actor|director`** (`film-api/lambda/get-tmdb-person-films.ts`).
   - **Auth:** it now requires a sign-in, through `requireAuth`, because it spends OMDb allowance.
   - **Steps:**
     1. Get the filmography from TMDb, as now: credited roles for actors, Director jobs for directors, merged by film.
     2. Leave out films already in the collection, using `findCollectedTmdbIds`. The modal lists those from the database, so they're neither looked up nor counted in `hiddenCount`.
     3. Drop films with no `release_date` or a future one. This is free, and removes most "Untitled …" projects.
     4. For each remaining film, call `GET /movie/{id}?append_to_response=external_ids`. That one call returns the `status` and the IMDb ID. Drop the film if its status isn't "Released" or it has no IMDb ID.
     5. For each remaining film, look up OMDb for the rating and votes. Drop the film when there's no rating, OMDb doesn't know it, the lookup failed or ran out of time, or it has fewer than `MIN_IMDB_VOTES = 1000` votes.
     6. Return `{ data: { films: [...], hiddenCount } }`. Each film has `tmdbId`, `title`, `year`, `character?`, `imdbId`, `imdbRating` and `imdbVotes`, none of them null apart from `character`.
     7. Return 502 instead when every lookup that ran failed, so an outage shows as an error with Try again rather than a cached empty list. When only some fail, those films are hidden and counted.
   - **Reused from `get-imdb-ratings.ts`:**
     - the concurrency of 10
     - the hard per-request timeouts
     - the 20-second budget, checked before each step
     - the 502 on a rejected OMDb key
     - OMDb's not-found handling
   - **Logging:** log how many films the time budget cut off, so a short list caused by slowness is visible in the logs.
2. **Remove the `/tmdb/imdb-ratings` endpoint,** which would have no callers left.
   - `get-imdb-ratings.ts` and its tests go, after the shared helpers move into the filmography Lambda or a small shared module.
   - Remove its route, throttle entry and build script from `lib/api-stack.ts` and `package.json`.
   - Remove its Bruno request and README row.
   - `OMDB_API_KEY` moves to the filmography Lambda only.
   - Remove `findStoredImdbIds`, which has no callers left.
3. **Throttle:** the filmography route keeps 2 a second with a burst of 5.
4. **Tests:**
   - the date filter, including no date, a future date and today
   - the status filter
   - the IMDb ID filter
   - each OMDb drop case, including 999 and 1,000 votes
   - collection films left out, with no lookups, and not counted as hidden
   - `hiddenCount`
   - auth
   - a rejected key giving a 502, and a 502 when every lookup that ran failed
   - the budget cut-off
   - the existing filmography cases: merged roles, sorting and validation

## Part 2: Frontend
1. **`PersonFilmsModal.tsx`:**
   - Replace the tabs with the two sections in the agreed layout.
   - Your films come from the existing detail fetch.
   - The "Load other films and IMDb ratings" button calls the reworked endpoint through `createAuthenticatedClient`.
   - On success, add "Other films" with the hidden count.
   - **States:**
     - The button shows "Loading…" while the request runs.
     - On failure, an error line with Try again.
   - **Keep:**
     - Add, with 409 handling and the refresh of your films
     - Lead or Support
     - the header links
     - `onFilmsAdded`
     - `formatVoteCount`
   - **Remove:**
     - the IMDb batching, the retry banner and status region
     - the request map
     - the client-side vote filter, its toggle and `MIN_IMDB_VOTES`
     - the tab state
2. **Types and endpoints:**
   - Update `TmdbPersonFilm` to the new response shape.
   - Remove `ImdbRating` if nothing else uses it.
   - Remove `API_ENDPOINTS.imdbRatings`.
3. **Tests in `PersonFilmsModal.test.tsx`:** this is mostly a rewrite.
   - your films shown on open, with Your rating and no IMDb column, and no call to the filmography endpoint
   - the button triggers one request
   - other films added below, with their IMDb figures
   - the hidden count
   - the loading, error and Try again states
   - Add and 409
   - Lead or Support for actors only
   - the result cached per person
   - Also update the client mocks in `FilmCard.test.tsx` and `PeopleRankings.test.tsx`.

## Open points
- **The hidden count:** it can be removed if it's not wanted.
- **Films you own outside the actor's stored cast:** a film in your collection where the actor was billed below 10th isn't in their "Your films" (only the top 10 are stored), and the API leaves it out of "Other films" too.
- **Very large filmographies:** someone with more released credits than fit in the 20-second budget will lose the films that weren't reached, though the logs record it. If it becomes a problem, the Lambda could prioritise films by TMDb popularity, which is in the credits.
- **OMDb cost:** there's no cap on lookups per request beyond the time budget, so one click for a prolific person can use a few hundred OMDb requests. That's acceptable against a limit of 100,000 a day.
- **The cache is per modal:** each `FilmCard` mounts its own modal, so a director shown on several cards is looked up once per card. Sharing the cache across the page would carry one user's collection over a sign-out and sign-in, so it's left as it is.

## Commits
1. API: the reworked filmography endpoint, removing the ratings endpoint, and updating the tests, Bruno and README.
2. Frontend: the single list, removing the tabs and batching, and the tests.

Deploy the frontend and API together. An old frontend can't read the new response, and the new frontend needs the new endpoint.

## Verification
- **Bruno:** `GET /tmdb/person/287?kind=actor`, signed in. Check:
  - no unreleased or low-vote films are returned
  - `hiddenCount` is present
  - films in your collection are absent
- **In the app:**
  - Opening an actor shows your films straight away, with no network call to `/tmdb/person`.
  - Clicking the button adds "Other films", with none of your films repeated.
  - Add a film from "Other films", and check it appears in your films while its row reads "In collection".
