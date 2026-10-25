# Music project rework: MusicBrainz import, liked songs, listened in full

**Status (09-10-2026):** planned, nothing built. The next step is Phase 0 on `main`. Resolve the open item at the end first.

## Context

Adding music is fully manual today. Values are copied from Rate Your Music into hand-typed Artist/Album/Song modals. There is no edit or delete, stored stats can drift, and there are auth and sorting bugs. The film project shows the better pattern: import from an external catalogue by ID (`film-api/lambda/search-tmdb.ts`, `create-film.ts`, `film/src/components/Modal/AddFilmModal.tsx`).

Goal: rework `music` + `music-api` around **MusicBrainz**:
- import an album with all its tracks
- mark **liked** songs (scores count liked songs only)
- flag albums **listened in full**.

There is only production (no dev environment), so v2 is built **alongside** v1 and v1 is never modified until a cut-over you can roll back.

## Decisions (09-10-2026)

| Topic | Decision |
|---|---|
| Approach | Refactor the existing code on a `music-v2` branch. Same stack (CDK, Lambda, Mongo, Next.js on Vercel, Clerk) |
| Data | New `music_v2` database rebuilt from `music` by a repeatable script. `music` is read-only until it's retired |
| Data source | MusicBrainz (no key; `User-Agent` with a contact; at most 1 request per second; retry on `503`) |
| Add flow | Search artist → browse albums → import album with **all** songs (`liked: false`) |
| Liked songs | All existing songs become `liked: true`. Score = liked songs + gold×15 + silver×5 |
| Listened in full | Boolean on Album, display only. Existing GOLD/SILVER = true, the rest false |
| Rating rule | Gold/Silver only allowed when listened in full. Unticking it on a rated album is rejected |
| Stats | Computed at read time with aggregation. No stored artist stats and no `YearStats` |
| Names | MusicBrainz: canonical name on Artist; release/track **artist credit** as printed on Album/Song `artistDisplayName`. `artists[]` links every credited artist |
| Singles | A song on any album is an album song. Album-less songs are only non-album singles, linked to their artists |
| Cover art | Built from the album's `musicBrainzId` at display time (Cover Art Archive). Nothing stored |
| Genres | MusicBrainz curated `genres`, top few stored on the album, filterable |
| Pages | Songs → liked songs list. Home → small dashboard |
| Manual entry | Keep a manual "add song" as a fallback. Retire manual add artist and add album |

## Phase 0: on `main`, against v1 (each change is safe on its own)
- **Owner-only writes:** `lambda/auth.ts` `requireAuth` checks `payload.sub === OWNER_USER_ID` (env var). Today any Clerk account can write.
- **Remove the two unauthenticated, unused endpoints:** `PUT /album/{id}/totalsongs` and `PUT /year/{year}/stats` (lambdas, routes, build scripts, Bruno).
- **Search fixes:** `lambda/search.ts` gets `await connectToDatabase()`, and the frontend wraps search strings in `encodeURIComponent`.
- **Years page:** the "Year" column sorts by year (`music/src/app/years/page.tsx`).
- **Make v1 configurable**, with no change in behaviour:
  - `lambda/mongodb/client.ts`: `dbName` comes from `DB_NAME` (default `music`).
  - `bin/music-api.ts` + `lib/api-stack.ts`: a stage suffix for the stack name and every hard-coded `functionName`, so `MusicApiStack-v2` can't collide with v1.
  - `music/src/constants.ts`: `API_URL` comes from `NEXT_PUBLIC_API_URL`. It is already in `.env.local` but unused.

Then branch `music-v2` from `main`.

## Phase 1: model and read-time stats (branch)
- **Models:**
  - `Song`: add `liked` and `musicBrainzId`.
  - `Album`: add `listenedInFull`, `genres` and `musicBrainzId`.
  - `Artist`: add `musicBrainzId`; drop the stored stat fields.
  - Delete the `YearStats` model.
  - Indexes: sparse unique on `musicBrainzId`; `songs {liked, artists}` and `{liked, year}`.
- **Services:** replace `updateArtistStats` / `updateYearStats` with aggregations reusing `calculateScore` (`lambda/utils/score.ts`). Remove all cascade calls and the unused `syncTopAlbumsWithGoldRatings`.
- **`update-album-rating.ts`:** enforce the rating rule. Keep its Top Albums add/remove.
- **Write lambdas:** retire `create-album.ts` and `create-artist.ts`. `create-song.ts` stays as the fallback, with `liked: true`. Delete `scripts/recompute-artist-stats.mjs`.

## Phase 2: MusicBrainz integration (branch)
- **`lambda/utils/musicbrainz.ts`:** a client using `MUSICBRAINZ_CONTACT`, with three helpers:
  - `buildArtistDisplayName(artistCredit)`
  - `pickCanonicalRelease(releases)`: earliest official release, preferring Digital or CD
  - `topGenres`.
- **Public endpoints:**
  - `GET /musicbrainz/artists?query=`
  - `GET /musicbrainz/artists/{mbid}/albums`: Album/EP release groups, with secondary types and `existsInDb`.
- **`POST /album/import { releaseGroupId }`** (owner only), following `create-film.ts`:
  - Artists: found by `musicBrainzId`, or created.
  - Album: found by `musicBrainzId`, or created, with genres, `totalSongs` and the credit string.
  - Tracks: created unliked. **Album-less songs by a credited artist that match a track are attached and stay liked.**
  - Returns `409` if nothing new was added.

## Phase 3: edit, delete, toggles and lists (branch, owner-only writes)
- `PATCH /song/{id}` `{ liked?, displayTitle? }`
- `PATCH /album/{id}` `{ listenedInFull?, displayTitle?, artistDisplayName?, year? }`
- `PATCH /artist/{id}` `{ displayName? }`
- `DELETE /album/{id}` (deletes its songs and removes it from Top Albums) and `DELETE /song/{id}`
- `normalizeForSearch` is re-applied whenever a display value changes.
- `GET /songs?liked=true` (paginated) and `GET /dashboard`.

## Phase 4: frontend (branch)
- **Import modal** (`components/Modal/ImportAlbumModal.tsx`, modelled on `AddFilmModal`): artist search → albums with covers, year, type and "in collection" → import → album page.
- **Album page:**
  - cover and genres
  - full tracklist with like toggles
  - listened-in-full toggle
  - rating selector, disabled until listened in full
  - progress = liked / totalSongs
  - edit and delete.
- **Artist page:** score computed at read time, album covers, liked songs only.
- **Artists page:** loads on visit, paginates, hides artists with a score of 0 by default.
- **Albums page:** covers, plus filters for listened in full and genre.
- **Songs page:** liked songs, paginated, with links.
- **Home page:** dashboard.
- **Navbar:** "Import album" + "Add song". Retire the add-artist and add-album modals and the `Table/Blocks/` quick-add.
- **Tidy-up:** remove or use `DeleteIcon`; fix the `marginitems-center` typo; remove the `console.log`s in `Table/Years.tsx`; move the render-time `router.replace` calls into effects.

## Phase 5: data migration into `music_v2` (branch, scripts in `music-api/scripts/`)

Rules:
- Every existing album is kept.
- Every existing song is kept and becomes **liked**.
- Tracks pulled in from MusicBrainz are **unliked**.
- An artist is kept only while it is linked to an album or song.

**`link-musicbrainz-propose.mjs`** (reads `music` only, writes `link-review.json`; MusicBrainz responses cached on disk). For each album:
- Search release groups by title + artist + year, and pick the canonical release.
- Map your songs to its tracks by normalised title.
- Map your artists to the credited artists by position + fuzzy name (Rate Your Music names differ).
- Write an entry with status `confident`, `uncertain` or `no-match`, plus unmatched songs and the number of tracks to be added.

For each album-less song, also check for a studio album by that artist that contains it. These become `hidden-album` entries.

**Review (you edit `link-review.json`):** for each entry you can
- accept or reject it (a rejected album migrates as it is, with no ID)
- swap the release group or release (e.g. a deluxe edition)
- map each unmatched song to a track or mark it as an extra
- for `hidden-album` entries, choose import album or keep as single.

An album with any unmatched liked song stays held until resolved.

**`build-v2.mjs`** (repeatable; reads `music`, **empties and rebuilds `music_v2`**):
1. Copy artists, albums, songs and Top Albums, keeping the same `_id`s, so the review decisions still apply.
2. Set `liked: true` on every song, and `listenedInFull` from the rating.
3. Apply the accepted review entries from the cache:
   - set the IDs and take the MusicBrainz names and credits
   - set `totalSongs` and genres
   - add the remaining tracks unliked
   - attach matching album-less songs (they keep their existing year).
4. Report artists with no album or song (deleted when run with `--prune-orphans`).
5. Print, for each artist and year, the v1 score next to the v2 score. Steps 1 and 2 alone must give identical scores. Applying the review entries changes no score, because added tracks are unliked.

Anything you add on the v1 site during the build comes across on the next rebuild. Changes made only in v2 are disposable until the cut-over.

## Environments and cut-over
- **v2 API:** `MusicApiStack-v2` with `DB_NAME=music_v2` and its own API Gateway URL.
- **Clerk during the build:** v2 uses the **development** secret key and **your development user ID** as `OWNER_USER_ID`. Clerk production keys are tied to the production domain, which is why `.env.local` uses development keys.
- **v2 site:** Vercel preview deployments of `music-v2`. Set the Preview environment variables (scoped to that branch) to the v2 API URL and the Clerk development keys. Local `next dev` works the same way.
- **Cut-over** (a short pause on adding music; reads never stop):
  1. Stop adding on v1.
  2. Final `build-v2.mjs --prune-orphans`, then smoke checks on the preview.
  3. Point the v2 stack at the Clerk production secret key and your production user ID.
  4. Merge `music-v2` → `main`. Set the Production `NEXT_PUBLIC_API_URL` to the v2 API. Vercel deploys.
  5. **Rollback:** revert the merge and restore the URL. `MusicApiStack` and `music` were never modified.
  6. After a settling period, take a final `mongodump` of `music`, then delete `MusicApiStack` and the `music` database.

## Commits
- Small chunks with unit tests for new and changed code.
- Phase 0 on `main`.
- Phases 1–5 on `music-v2`.
- Phase 6 (docs: env vars `DB_NAME`, `OWNER_USER_ID`, `MUSICBRAINZ_CONTACT`; endpoints; migration and cut-over runbook; Bruno requests) on the branch before the merge.

## Verification
- **Unit tests** (run only on request):
  - aggregations vs `calculateScore`
  - rating rule
  - import (new artist, existing album by ID, album-less song attached, 409)
  - toggles, edit and delete
  - MusicBrainz helpers
  - owner-only auth
  - review-entry application.
- **`build-v2.mjs`:** v1 and v2 scores identical for every artist and year. Counts of albums and liked songs equal v1's.
- **Bruno against the v2 URL:** import an album, like two songs, and see the artist score, year songs and album progress each rise by 2. Gold before listened in full is rejected.
- **Vercel preview:** import → like → listened → rate → Top Albums save. Check the dashboard, the Songs page, covers and the genre filter.
- **After cut-over:** the production site loads and an owner write succeeds. A sign-in from another account cannot write.

## Open item
`MUSICBRAINZ_CONTACT`: a personal email or the repo URL, not a work address.
