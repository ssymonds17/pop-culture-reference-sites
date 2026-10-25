# IMDb-only "All films" tab with a vote filter

Agreed and implemented on 23-10-2026. It follows Part 4 of `docs/film-person-links-plan.md`, which added the IMDb column.

## Context
The "All films" tab in `film/src/components/Modal/PersonFilmsModal.tsx` loads every film's IMDb rating automatically. That makes the TMDb score redundant, and long filmographies are cluttered with obscure films. The asks:
1. Remove the TMDb score from the tab.
2. Hide films with fewer than 100 IMDb votes.

## Decisions
- **Films in the collection always show,** whatever their vote count.
- **Nothing shows until every rating has arrived.** The tab shows its loading state until the whole filmography's IMDb lookups finish, then shows the filtered list. Rows never drop out while you're looking at them.
- **The TMDb score fields are removed from the API too,** not just hidden.

## Commit 1: API, drop the TMDb score fields
- `film-api/lambda/get-tmdb-person-films.ts`: stop returning `tmdbRating` and `tmdbVoteCount`, and drop `vote_average` and `vote_count` from `TmdbMovieCredit`.
- `get-tmdb-person-films.test.ts`: update the expected responses.
- `film-api/bruno/Search/Get TMDB Person Films.bru`: update the field list and the example response.

## Commit 2: Frontend, IMDb-only tab with the vote filter
- **Types** (`film/src/types/index.ts`): remove `tmdbRating` and `tmdbVoteCount` from `TmdbPersonFilm`.
- **Remove the TMDb header and cell** from the "All films" table.
- **Loading:** keep "Loading films from TMDb..." (reworded to something like "Loading films...") until the filmography and every IMDb batch have finished. `loadImdbRatings` already resolves when all batches are done, so `loadAllFilms` can await it before marking the filmography loaded, or a per-key "ratings settled" flag can do the same.
- **The filter**, a `MIN_IMDB_VOTES = 100` constant. Keep a film when:
  - it's in the collection (`inCollection`, or added from this modal), or
  - its IMDb votes are 100 or more.
  - Films with no IMDb rating or no IMDb ID count as 0 votes, so they're hidden.
- **Failed lookups** (the retry banner case) are hidden with the low-vote films, as you'd rather not see films with no data. Show all reveals them, and the banner's Retry brings back any that turn out to have enough votes. Changed from "shown" on 23-10-2026 after seeing obscure unreleased titles listed with no data.
- **Hidden count and toggle:** a line above the table, "14 films with fewer than 100 IMDb votes hidden · Show all", with "Hide them" to switch back. Filtered by default each time the modal opens.
- **Empty result:** "No films with 100 or more IMDb votes · Show all", rather than an empty table.
- **Tests** (`PersonFilmsModal.test.tsx`):
  - no table until every batch has finished
  - the threshold, with 99 hidden and 100 shown
  - collection films always shown
  - no-rating films hidden
  - failed films shown
  - the hidden count and the Show all / Hide toggle
  - the empty state
  - no TMDb column

## Verification
- Bruno: `GET /tmdb/person/{id}?kind=actor` no longer returns TMDb score fields.
- In the app, open an actor with a long filmography and check:
  - the loading state lasts until the list appears, already filtered
  - the hidden count and Show all work
  - films in the collection are present whatever their votes
