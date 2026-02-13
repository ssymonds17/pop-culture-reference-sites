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

**Output:** The script will generate a single `import-issues.json` file containing all issues found during import. Each issue has a `type` field to categorize it:
- `FAILED` - Films that couldn't be imported
- `DUPLICATE` - Films already in database
- `WARNING` - Films imported with issues (missing directors, invalid ratings, etc.)

**Summary Example:**
```
Import Summary:
  Total films in CSV: 2,415
  Successfully imported: 2,350
  Skipped (duplicates): 48
  Failed: 12
  Warnings: 5
  Errors: 0

⚠️  65 total issues found during import
   Details saved to: ./import-issues.json
   Issue breakdown:
     - FAILED: 12 (films that couldn't be imported)
     - DUPLICATE: 48 (films already in database)
     - WARNING: 5 (films imported with issues)

   Filter by type field to review specific issues
```

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

All issues are tracked in a single `import-issues.json` file. Each issue has a `type` field indicating the category:

### Example `import-issues.json`:

```json
[
  {
    "type": "DUPLICATE",
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
  },
  {
    "type": "FAILED",
    "title": "Another Film",
    "year": 1994,
    "watched": true,
    "rating": 8,
    "owned": false,
    "reason": "Not found on TMDb"
  },
  {
    "type": "WARNING",
    "title": "Third Film",
    "year": 2000,
    "tmdbId": "123",
    "tmdbTitle": "Third Film",
    "reason": "No directors found in TMDb crew data, film imported without directors"
  }
]
```

### Issue Types:

#### 1. `FAILED` - Films that couldn't be imported

**Common reasons:**
- Not found on TMDb
- Could not get TMDb details (API error)
- Missing or empty title in CSV
- Invalid year in CSV
- Database/import error

**Action:** Manually add these films:
1. Search for the film on https://www.themoviedb.org/ to get its TMDb ID
2. Use the Bruno collection's "Create Film" endpoint
3. Fill in the details from the import-issues.json entry

#### 2. `DUPLICATE` - Films already in database

**Reason:** Film with matching TMDb ID already exists in database

**Action:** Review to verify these are actual duplicates:
1. Compare CSV title/year with existing database title/year
2. If incorrectly flagged, delete the existing film from MongoDB
3. Re-run the import to add the film again

#### 3. `WARNING` - Films imported with issues

**Common warnings:**
- No directors found in TMDb crew data
- Invalid rating (outside 1-10 range)

**Action:** Review warnings and use the API to correct any issues if needed

## Troubleshooting

### Missing or invalid CSV data

- **Missing title:** Row will be skipped and tracked with `type: "FAILED"`
- **Invalid year:** Row will be skipped if year is missing, non-numeric, or outside 1800-2100
- **Invalid rating:** Film will import but without rating (tracked with `type: "WARNING"`)
- Check your CSV for empty cells or incorrect data types

### Film not found on TMDb

- Check spelling in CSV
- Verify year is correct
- TMDb may not have the film
- Failed films will be tracked with `type: "FAILED"`

### Rate limit errors

- Increase RATE_LIMIT_DELAY in importFilms.mjs
- Default is 250ms (4 req/sec), well within free tier limits

### MongoDB connection errors

- Verify MONGODB_URI is correct
- Ensure MongoDB is running
- Check network connectivity

### Films skipped as duplicates

- Filter `import-issues.json` for `type: "DUPLICATE"` to verify these are actual duplicates
- Compare CSV title/year with existing database title/year
- If incorrectly flagged, delete the existing film from MongoDB and re-run import

## Re-running the Import

The import script is idempotent - it skips films that already exist (by TMDb ID):

1. **Partial re-run:** Simply run `npm run import` again - it will only import missing films
2. **Full re-run:** Delete all films from MongoDB first, then run the import
3. **Selective re-run:** Delete specific films from MongoDB, then run the import

All skipped duplicates are tracked in `import-issues.json` with `type: "DUPLICATE"` for verification.

### Filtering Issues by Type

To review specific issue types, filter the JSON:

```bash
# View only failed imports
cat import-issues.json | jq '.[] | select(.type == "FAILED")'

# View only duplicates
cat import-issues.json | jq '.[] | select(.type == "DUPLICATE")'

# View only warnings
cat import-issues.json | jq '.[] | select(.type == "WARNING")'

# Count by type
cat import-issues.json | jq 'group_by(.type) | map({type: .[0].type, count: length})'
```

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
