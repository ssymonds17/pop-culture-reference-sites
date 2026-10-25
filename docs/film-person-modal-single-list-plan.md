# Person modal: one list, with the filtering done in the API

Agreed on 25-10-2026, not yet started. It replaces the two-tab design from `docs/film-person-links-plan.md` (Part 3) and the client-side vote filter from `docs/film-imdb-vote-filter-plan.md`.

## Context
- **Today:** the actor and director modal (`film/src/components/Modal/PersonFilmsModal.tsx`) has two tabs.
  - "All films" fetches the TMDb filmography.
  - Then it requests IMDb ratings in batches from a second endpoint (`/tmdb/imdb-ratings`).
  - Then it filters by vote count in the browser.
- **What's wrong with that:**
  - Most of the logic sits in the frontend.
  - Unreleased and obscure films still reach the browser.
  - The two tabs split your films from the wider filmography.
- **The aim:**
  - One list in the modal.
  - Filtering done by the API in a single request.
  - OMDb is only used when you ask for it.

Checked on 25-10-2026: TMDb's person movie credits have no `status` field. The fields are `adult`, `backdrop_path`, `genre_ids`, `id`, `original_language`, `original_title`, `overview`, `popularity`, `poster_path`, `release_date`, `title`, `video`, `vote_average`, `vote_count`, `character`, `credit_id` and `order`. `status` is only on a film's details (`/movie/{id}`).

## Agreed layout
- **One list, with the same columns throughout:**
  - Title, with "as <character>" for actors
  - Year
  - Role (Lead or Support, actors only)
  - IMDb rating and votes
  - Your rating
  - Owned
  - Add or "In collection"
- **On open:** your films show straight away from the database, as today's "Your films" does. No TMDb or OMDb calls are made. Their IMDb column is blank.
- **The button:** under your films, "Load other films and IMDb ratings". Clicking it makes one API request that:
  - fills in your films' IMDb figures
  - adds an "Other films" section below, with the same columns
  - Nothing already on screen moves.
- **Caching:** the result is kept per person and kind while the modal is mounted, so reopening the same person doesn't request again.
- **Hidden count:** a line under "Other films", for example "23 films hidden: unreleased, no IMDb data or fewer than 1,000 IMDb votes". There's no Show all, because the API never sends those films.

## Part 1: API
1. **Rework `GET /tmdb/person/{tmdbPersonId}?kind=actor|director`** (`film-api/lambda/get-tmdb-person-films.ts`).
   - **Auth:** it now requires a sign-in, through `requireAuth`, because it spends OMDb allowance.
   - **Steps:**
     1. Get the filmography from TMDb, as now: credited roles for actors, Director jobs for directors, merged by film.
     2. Drop films with no `release_date` or a future one. This is free, and removes most "Untitled …" projects.
     3. Split the rest into collection films and the others, using `findStoredImdbIds` and `findCollectedTmdbIds`.
     4. For each other film, call `GET /movie/{id}?append_to_response=external_ids`. That one call returns the `status` and the IMDb ID. Drop the film if its status isn't "Released" or it has no IMDb ID.
     5. For each remaining film, including collection films with a stored IMDb ID, look up OMDb for the rating and votes.
        - Drop a non-collection film when there's no rating, OMDb doesn't know it, the lookup failed or ran out of time, or it has fewer than `MIN_IMDB_VOTES = 1000` votes.
        - Collection films are never dropped. Their IMDb figures are null when the lookup fails.
     6. Return `{ data: { films: [...], hiddenCount } }`. Each film has `tmdbId`, `title`, `year`, `character?`, `inCollection`, `imdbId`, `imdbRating` and `imdbVotes`.
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
3. **Throttle:** the filmography route keeps 2 a second with a burst of 5.
4. **Tests:**
   - the date filter, including no date, a future date and today
   - the status filter
   - the IMDb ID filter
   - each OMDb drop case, including 999 and 1,000 votes
   - collection films kept with null figures on failure
   - `hiddenCount`
   - auth
   - a rejected key giving a 502
   - the budget cut-off
   - the existing filmography cases: merged roles, sorting and validation

## Part 2: Frontend
1. **`PersonFilmsModal.tsx`:**
   - Replace the tabs with the single list.
   - Your films come from the existing detail fetch.
   - The "Load other films and IMDb ratings" button calls the reworked endpoint through `createAuthenticatedClient`.
   - On success, merge the IMDb figures into your films by `tmdbId`, and add "Other films" with the hidden count.
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
   - your films shown on open with no API call to the filmography endpoint
   - the button triggers one request
   - the IMDb figures merged into your films
   - other films added below
   - the hidden count
   - the loading, error and Try again states
   - Add and 409
   - Lead or Support for actors only
   - the result cached per person
   - Also update the client mocks in `FilmCard.test.tsx` and `PeopleRankings.test.tsx`.

## Open points
- **Failed lookups:** non-collection films whose lookup failed are dropped, and counted in `hiddenCount`, rather than offered for retry. Confirm this is acceptable.
- **The hidden count:** it can be removed if it's not wanted.
- **Very large filmographies:** someone with more released credits than fit in the 20-second budget will lose the films that weren't reached, though the logs record it. If it becomes a problem, the Lambda could prioritise films by TMDb popularity, which is in the credits.

## Commits
1. API: the reworked filmography endpoint, removing the ratings endpoint, and updating the tests, Bruno and README.
2. Frontend: the single list, removing the tabs and batching, and the tests.

Deploy the frontend and API together. An old frontend can't read the new response, and the new frontend needs the new endpoint.

## Verification
- **Bruno:** `GET /tmdb/person/287?kind=actor`, signed in. Check:
  - no unreleased or low-vote films are returned
  - `hiddenCount` is present
  - collection films are present with their figures
- **In the app:**
  - Opening an actor shows your films straight away, with no network call to `/tmdb/person`.
  - Clicking the button fills in the IMDb figures and adds "Other films".
  - Add a film from "Other films", and check it moves to your films.
