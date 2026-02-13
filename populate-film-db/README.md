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
CSV_FILE_PATH=./Film List - List.csv
```

4. Get TMDb API key:
- Sign up at https://www.themoviedb.org/
- Request API key from account settings
- Free tier allows 40 requests/10sec, 500K requests/month

5. Place your CSV file in this directory as `Film List - List.csv`

## CSV Format

Expected columns:
- `Title` - Film title
- `Year` - Release year
- `Watched` - "Yes" or "No"
- `Rating` - 1-10 rating (optional if not watched)

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

**Estimated Time**: ~20 minutes for 2,398 films

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

## Troubleshooting

### Film not found on TMDb
- Check spelling in CSV
- Verify year is correct
- TMDb may not have the film

### Rate limit errors
- Increase RATE_LIMIT_DELAY in importFilms.mjs
- Default is 250ms (4 req/sec), well within free tier limits

### MongoDB connection errors
- Verify MONGODB_URI is correct
- Ensure MongoDB is running
- Check network connectivity

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
- ~2,398 films
- ~1,073 directors (extracted from TMDb)
- Films have director ObjectId references
- Directors have aggregated statistics
