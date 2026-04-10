# Music API - Bruno Collection

This Bruno collection contains API requests for testing the Music API endpoints.

## Setup

1. Open this collection in Bruno
2. Configure the environment variables in `environments/Production.bru`:
   - `API_URL`: Base URL for the API (default: production)
   - `ARTIST_ID`: ID of an artist for testing GET/UPDATE operations
   - `ALBUM_ID`: ID of an album for testing GET/UPDATE operations
   - `SONG_ID`: ID of a song for testing GET operations
   - `YEAR`: Year for testing year statistics endpoints

## API Structure

### Artists
- **Get Artists**: Retrieve all artists sorted by score
- **Get Artist By Id**: Get a specific artist
- **Create Artist**: Add a new artist to the database

### Albums
- **Get Albums**: Retrieve all albums sorted by year
- **Get Album By Id**: Get a specific album with songs
- **Create Album**: Add a new album
- **Update Album Rating**: Change album rating (GOLD/SILVER/NONE)
- **Update Album Total Songs**: Set the total track count

### Songs
- **Get Song By Id**: Get a specific song
- **Create Song**: Add a new song (updates artist/album/year stats)

### Years
- **Get Years**: Retrieve statistics for all years
- **Update Year Stats**: Manually recalculate a year's statistics

### Search
- **Search**: Search for artists, albums, or songs by name/title

## Score Calculations

### Artist Score
- Each song: +1 point
- Gold album: +15 points
- Silver album: +5 points

### Year Score
- totalScore = (songs × 1) + (goldAlbums × 15) + (silverAlbums × 5)

## Data Flow

When creating content, the API automatically cascades updates:

1. **Creating a Song**:
   - Song is created
   - Added to album's songs array (if album specified)
   - Artist totalSongs += 1, totalScore += 1
   - Year statistics updated

2. **Creating an Album**:
   - Album is created
   - Artist goldAlbums/silverAlbums count updated
   - Artist totalScore updated based on rating
   - Year statistics updated

3. **Updating Album Rating**:
   - Album rating changed
   - Artist statistics recalculated
   - Year statistics updated

## YearStats Collection

The `/years` endpoint now reads from a pre-calculated `yearStats` collection for performance.
Use the **Update Year Stats** endpoint to populate or refresh statistics for a specific year.

### Populating YearStats

To populate the entire yearStats collection:
```bash
cd ../populate-music-db
node updateYearStats.mjs
```

This script iterates through all years (1950-present) and calls the Update Year Stats endpoint for each.
