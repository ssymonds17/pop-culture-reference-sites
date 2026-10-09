# Film API

Backend API for the Film Ratings Application. Built with AWS Lambda, API Gateway, and MongoDB.

## Architecture

- **Backend**: AWS Lambda + API Gateway
- **Database**: MongoDB
- **Infrastructure**: AWS CDK
- **Runtime**: Node.js 22
- **Auth**: Clerk session tokens on the endpoints that change data
- **Film data**: The Movie Database (TMDb)

## Project Structure

```
film-api/
├── bin/              # CDK app entry point
├── lib/              # CDK infrastructure code
│   └── constructs/   # Reusable CDK constructs
├── lambda/           # Lambda function handlers (one per endpoint) and their tests
│   ├── mongodb/      # MongoDB models and services
│   │   ├── models/   # Mongoose schemas
│   │   └── services/ # Business logic
│   └── utils/        # Utility functions
├── scripts/          # One-off data backfill scripts
├── bruno/            # Bruno request collection (see bruno/README.md)
└── build/            # Compiled Lambda functions
```

## Setup

### Prerequisites

Before deploying, ensure you have:

1. **AWS CLI installed and configured**:
```bash
# Check if AWS CLI is installed
aws --version

# Configure AWS credentials (if not already done)
aws configure
```

2. **A MongoDB connection string**
3. **A TMDb API key**
4. **The Clerk secret key** for the film app
5. **AWS account permissions** for Lambda, API Gateway, IAM roles and CloudFormation

### Environment Variables

Create a `.env` file in `film-api/`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
TMDB_API_KEY=your-tmdb-api-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

The CDK stack refuses to synth if any of the three is missing, and passes them to every Lambda.

### Deployment Steps

1. Install dependencies:
```bash
npm install
```

2. Build the Lambda functions:
```bash
npm run build:all
```

3. Synth (loading `.env`) and deploy:
```bash
npm run synth-vars
npm run deploy
```

4. Note the API Gateway URL from the deployment output (e.g., `https://xxxxxxxxxx.execute-api.region.amazonaws.com/prod/`)

## API Endpoints

Endpoints marked **Auth** need a Clerk session token in an `Authorization: Bearer <token>` header and return 401 without one.

### Films

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `POST` | `/film` | Auth | Create a film from a TMDb ID (or from full film data) |
| `GET` | `/films` | | List films, with filters (up to 500) |
| `GET` | `/film/{id}` | | Get a single film with its cast, production companies and collection |
| `PATCH` | `/film/{id}` | Auth | Update a film's rating, owned status or review |
| `DELETE` | `/film/{id}` | Auth | Delete a film |
| `GET` | `/genres` | | List all genres |
| `GET` | `/random` | | Random owned films, with filters |

Film lists leave out `cast`, `productionCompanies` and `tmdbCollection` to keep responses small. Only `GET /film/{id}` returns them.

### Directors and Actors

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/directors` | | Directors ranked by a stat (up to 200) |
| `GET` | `/director/{tmdbPersonId}` | | A director with their films |
| `GET` | `/actors` | | Actors ranked by a stat (up to 200, only actors with films) |
| `GET` | `/actor/{tmdbPersonId}` | | An actor with the films they are credited in |

### Statistics

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/stats` | | Overall statistics |
| `GET` | `/years` | | Statistics for every year |
| `GET` | `/year/{year}` | | Statistics for one year |
| `PUT` | `/year/{year}/stats` | Auth | Recalculate one year's statistics |

### Top Films

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/top-films` | | The ranked list of films rated 8 to 10 |
| `PUT` | `/top-films` | Auth | Save a new ranking |

### Search

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/search` | | Search films, directors and actors in the database |
| `GET` | `/search/tmdb` | | Search TMDb for films to add |
| `GET` | `/tmdb/{tmdbId}` | | Preview a film's TMDb details without saving it |

## Keeping Stats in Step

Director, actor, year and top-film data is recalculated automatically when a film is created, is sent a rating update or is deleted. The scripts below cover data that predates a feature, or drift.

## Scripts

Run from `film-api/` with `.env` in place. Each supports `--dry-run`, skips records that are already up to date, prints the database host it connects to, and is safe to run again.

- **`scripts/backfill-tmdb-credits.mjs`**: Fetches cast, production companies and collection from TMDb for films that have never had them, then recalculates every actor's stats. Also accepts `--limit=N` for a spot check. Needs `TMDB_API_KEY`.
- **`scripts/backfill-film-search-titles.mjs`**: Sets each film's accent-folded `searchTitle` from its title.
- **`scripts/backfill-director-photos.mjs`**: Fetches a TMDb profile photo for every director without one. Also accepts `--limit=N`. Needs `TMDB_API_KEY`.

```bash
node --env-file=.env scripts/backfill-tmdb-credits.mjs --dry-run --limit=5
node --env-file=.env scripts/backfill-film-search-titles.mjs --dry-run
```

## Development

Run tests:

```bash
npm test
```

Type-check:

```bash
npx tsc --noEmit -p .
```

Build a single Lambda:

```bash
npm run build:create-film
```

## MongoDB Models

- **Film**: Ratings, ownership and review, plus TMDb metadata: directors, cast (top 20 credited, in billing order), production companies, collection, and an accent-folded `searchTitle`
- **Director**: TMDb person with their photo, films and aggregated statistics
- **Actor**: TMDb person with their photo and aggregated statistics. Their films are found through `Film.cast`
- **YearStats**: Pre-computed year statistics with weighted scoring
- **TopFilms**: The user's ranked order of films rated 8 to 10
