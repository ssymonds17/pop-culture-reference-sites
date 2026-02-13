# Populate Film Database

Scripts to import film data from CSV + TMDb API into MongoDB.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Configure `.env`:

```
MONGODB_URI=mongodb://your-mongodb-uri/films
TMDB_API_KEY=your_tmdb_api_key_here
CSV_FILE_PATH=./film_list.csv
```

4. Get TMDb API key:

- Sign up at https://www.themoviedb.org/
- Request API key from account settings
- Free tier allows 40 requests/10sec, 500K requests/month

5. Place your CSV file in this directory as `film_list.csv`

## CSV Format

Expected columns:

- `Title` - Film title
- `Year` - Release year
- `Seen` - "TRUE" or "FALSE" (whether film has been watched)
- `Score` - 1-10 rating (optional if not watched)

## Usage

### Import Films

```bash
npm run import
```

This script will:

1. Read films from CSV
2. Search TMDb for each film
3. Get detailed film metadata and crew information
4. Extract directors from TMDb crew data
5. Create Film and Director documents in MongoDB
6. Update director statistics

**Rate Limiting**: 250ms delay between requests (4 req/sec)

**Estimated Time**: ~20 minutes for 2,415 films

### Update Year Statistics

```bash
node updateYearStats.mjs
```

This script recalculates statistics for all years based on current film data.

## What Gets Imported

### Film Data

- **From CSV**: watched status, user rating, original title
- **From TMDb**:
  - Official title
  - Directors (from crew data)
  - Genres
  - Language
  - Duration
  - TMDb ID (unique identifier)
  - IMDb ID
  - Poster path
  - Overview/description
  - TMDb vote average

### Director Data

- **From TMDb**:
  - TMDb person ID (unique identifier)
  - Display name
  - Films directed
  - Aggregated statistics (calculated from film ratings)

## Progress Tracking

The script provides real-time progress output:

- Current film being processed
- TMDb search results
- Directors found
- Genres added
- Success/skip/error counts

## Handling Import Issues

The import script tracks two types of issues:

### 1. Skipped Duplicates (`skipped-duplicates.json`)

Films that were skipped because they appear to already exist in the database (matching TMDb ID):

```json
[
  {
    "csvTitle": "Film Title from CSV",
    "csvYear": 1994,
    "watched": true,
    "rating": 8,
    "owned": true,
    "tmdbId": "278",
    "existingFilmTitle": "Film Title in Database",
    "existingFilmYear": 1994,
    "existingFilmId": "507f1f77bcf86cd799439011",
    "reason": "Already exists in database"
  }
]
```

**Action:** Review this file to verify these are actual duplicates. If a film was incorrectly flagged:
1. Check if the existing film is correct
2. If not, delete the existing film and re-run the import for that film

### 2. Failed Imports (`failed-imports.json`)

Films that couldn't be imported due to errors (not found on TMDb, API errors, etc.):

```json
[
  {
    "title": "Film Title",
    "year": 1994,
    "watched": true,
    "rating": 8,
    "owned": false,
    "reason": "Not found on TMDb"
  }
]
```

**Action:** Manually add these films:
1. Search for the film on https://www.themoviedb.org/ to get its TMDb ID
2. Use the Bruno collection's "Create Film" endpoint with the TMDb data
3. Fill in the film details including the TMDb ID, watched status, rating, and owned from failed-imports.json

## Troubleshooting

### Film not found on TMDb

- Check spelling in CSV
- Verify year is correct
- TMDb may not have the film
- Failed films will be tracked in `failed-imports.json`

### Rate limit errors

- Increase RATE_LIMIT_DELAY in importFilms.mjs
- Default is 250ms (4 req/sec), well within free tier limits

### MongoDB connection errors

- Verify MONGODB_URI is correct
- Ensure MongoDB is running
- Check network connectivity

### Films skipped as duplicates

- Check `skipped-duplicates.json` to verify these are actual duplicates
- Compare CSV title/year with existing database title/year
- If incorrectly flagged, delete the existing film from MongoDB and re-run import

## Re-running the Import

The import script is idempotent - it skips films that already exist (by TMDb ID):

1. **Partial re-run:** Simply run `npm run import` again - it will only import missing films
2. **Full re-run:** Delete all films from MongoDB first, then run the import
3. **Selective re-run:** Delete specific films from MongoDB, then run the import

All skipped duplicates are tracked in `skipped-duplicates.json` for verification.

## Data Validation

After import, verify:

```bash
# Total films
mongo films --eval "db.films.count()"

# Total directors
mongo films --eval "db.directors.count()"

# Sample film with directors
mongo films --eval "db.films.findOne()"
```

Expected results:

- ~2,415 films
- ~1,078 directors (extracted from TMDb)
- Films have director ObjectId references
- Directors have aggregated statistics
