# Film API - Bruno Collection

This Bruno collection provides ready-to-use requests for testing all Film API endpoints.

## Setup

1. Install Bruno from https://www.usebruno.com/

2. Open Bruno and select "Open Collection"

3. Navigate to `/SideProjects/pop-culture-reference-sites/film-api/bruno`

4. Configure environment variables (see below)

## Environment Variables

Bruno requires you to manually set these environment variables in the **Production** environment:

### Required Variables

| Variable  | Description                          | Example                                                   |
| --------- | ------------------------------------ | --------------------------------------------------------- |
| `API_URL` | Your API Gateway URL from deployment | `https://abc123.execute-api.eu-west-1.amazonaws.com/prod` |

### Optional Variables (for specific endpoints)

| Variable         | Description                           | Example                   | Used By                                                                    |
| ---------------- | ------------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `CLERK_TOKEN`    | Clerk session token (see below)       | `eyJhbGciOi...`           | Create Film, Update Film, Delete Film, Update Year Stats, Update Top Films |
| `FILM_ID`        | MongoDB ObjectId of a film            | `65abc123def456789012345` | Get Film By Id, Update Film, Delete Film                                   |
| `TMDB_PERSON_ID` | TMDb person ID of a director or actor | `5602` (Buster Keaton)    | Get Director By Person Id, Get Actor By Person Id                          |
| `YEAR`           | Release year for testing              | `2020`                    | Get Year, Update Year Stats                                                |

### Getting a Clerk Token

Requests that change data send `CLERK_TOKEN` as a bearer token. Without a valid one they return 401.

1. Sign in to the film app in your browser
2. Open the developer console and run `await window.Clerk.session.getToken()`
3. Paste the result into `CLERK_TOKEN`

Clerk session tokens are short-lived, so fetch a fresh one just before sending the request. `CLERK_TOKEN` is a secret variable in `environments/Production.bru`, so Bruno stores its value locally and never writes it to the tracked file.

### How to Set Environment Variables

1. In Bruno, click the environment dropdown (top-right)
2. Select "Production"
3. Click "Configure"
4. Update the variable values
5. Save

## Collection Structure

### Films (7 requests)

- **Create Film** - POST /film (auth)
- **Get Films** - GET /films (with optional query params)
- **Get Film By Id** - GET /film/{id}
- **Update Film** - PATCH /film/{id} (auth)
- **Delete Film** - DELETE /film/{id} (auth)
- **Get Genres** - GET /genres
- **Get Random Films** - GET /random

### Directors (2 requests)

- **Get Directors** - GET /directors
- **Get Director By Person Id** - GET /director/{tmdbPersonId}

### Actors (2 requests)

- **Get Actors** - GET /actors
- **Get Actor By Person Id** - GET /actor/{tmdbPersonId}

### Stats (4 requests)

- **Get Stats** - GET /stats
- **Get Years** - GET /years
- **Get Year** - GET /year/{year}
- **Update Year Stats** - PUT /year/{year}/stats (auth)

### Top Films (2 requests)

- **Get Top Films** - GET /top-films
- **Update Top Films** - PUT /top-films (auth)

### Search (3 requests)

- **Search** - GET /search
- **Search TMDB** - GET /search/tmdb
- **Get TMDB Film Details** - GET /tmdb/{tmdbId}

## Testing Workflow

### 1. After Deployment

```bash
cd film-api
npm run build:all
npm run synth-vars
npm run deploy

# Copy the API Gateway URL from the output
# Example: FilmApiStack.FilmApiEndpointXXXXXX = https://abc123.execute-api.eu-west-1.amazonaws.com/prod/
```

Update the `API_URL` variable in Bruno with this URL.

### 2. Check the Data

1. **Get Stats** - Check the total film and director counts look right
2. **Get Films** - Try different filters (watched, minRating, year, genres)
3. **Get Directors** and **Get Actors** - Check the rankings
4. **Get Years** - Check year statistics are calculated

### 3. Get Sample IDs for Testing

To test endpoints that require IDs, first fetch some data:

```bash
# Get a film ID
curl "{{API_URL}}/films?watched=true" | jq '.data[0]._id'

# Get a director's TMDb person ID
curl "{{API_URL}}/directors" | jq '.data[0].tmdbPersonId'

# Get an actor's TMDb person ID
curl "{{API_URL}}/actors" | jq '.data[0].tmdbPersonId'
```

Copy these IDs into your Bruno environment variables.

### 4. Test Individual Film Operations

1. **Get Film By Id** - View full film details, including cast and production companies
2. **Update Film** - Change the rating (needs `CLERK_TOKEN`)
3. **Get Director By Person Id** and **Get Actor By Person Id** - Confirm their stats updated
4. **Get Year** - Confirm year stats updated

### 5. Test Stats Recalculation

If year stats get out of sync:

1. **Update Year Stats** - Recalculate specific year (needs `CLERK_TOKEN`)

## Query Parameters

Many endpoints support query parameters. In Bruno, query parameters are prefixed with `~` to disable them.

### Get Films Query Params

```
?watched=true              # Only watched films
&minRating=7               # Minimum rating 7
&maxRating=10              # Maximum rating 10
&year=1994                 # Films from 1994
&yearStart=1990            # Films from 1990 onwards (overrides year)
&yearEnd=1999              # Films up to 1999 (overrides year)
&genres=Drama,Crime        # Films with ANY of these genres
&directorId=65abc...       # Films by specific director (MongoDB ObjectId)
&owned=true                # Only owned films
&hasReview=true            # Only films with a review
```

Toggle the `~` prefix in Bruno to enable/disable parameters.

### Get Directors and Get Actors Query Params

```
?sortBy=totalPoints        # Sort by weighted score (default)
?sortBy=seenFilms          # Sort by number of watched films
?sortBy=totalFilms         # Sort by number of films
?sortBy=averageRating      # Sort by average rating
```

### Search Query Params

```
?searchString=chaplin      # Search term (required)
&itemType=director         # Filter by type (film | director | actor)
```

Without `itemType`, search covers films and directors. Actors are only searched when `itemType=actor`.

## Common TMDb Person IDs

For testing director endpoints:

| Director          | TMDb Person ID |
| ----------------- | -------------- |
| Buster Keaton     | 5602           |
| Stanley Kubrick   | 1037           |
| Nicolas Cage      | 2963           |
| Christopher Nolan | 525            |
| Quentin Tarantino | 138            |

## Tips

- Each request includes documentation in the "Docs" tab
- Use the "Body" tab to modify JSON payloads
- Response bodies are automatically formatted
- Failed requests show error details in the "Response" tab
- Use Bruno's collection runner to test multiple endpoints sequentially
