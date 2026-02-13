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

| Variable         | Description                  | Example                   | Used By                                          |
| ---------------- | ---------------------------- | ------------------------- | ------------------------------------------------ |
| `FILM_ID`        | MongoDB ObjectId of a film   | `65abc123def456789012345` | Get Film By Id, Update Film Rating, Delete Film  |
| `TMDB_PERSON_ID` | TMDb person ID of a director | `5602` (Buster Keaton)    | Get Director By Person Id, Update Director Stats |
| `YEAR`           | Release year for testing     | `2020`                    | Get Year, Update Year Stats                      |

### How to Set Environment Variables

1. In Bruno, click the environment dropdown (top-right)
2. Select "Production"
3. Click "Configure"
4. Update the variable values
5. Save

## Collection Structure

### Films (5 endpoints)

- **Create Film** - POST /film
- **Get Films** - GET /films (with optional query params)
- **Get Film By Id** - GET /film/{id}
- **Update Film Rating** - PUT /film/{id}/rating
- **Delete Film** - DELETE /film/{id}

### Directors (3 endpoints)

- **Get Directors** - GET /directors
- **Get Director By Person Id** - GET /director/{tmdbPersonId}
- **Update Director Stats** - PUT /director/{tmdbPersonId}/stats

### Stats (4 endpoints)

- **Get Stats** - GET /stats
- **Get Years** - GET /years
- **Get Year** - GET /year/{year}
- **Update Year Stats** - PUT /year/{year}/stats

### Search (1 endpoint)

- **Search** - GET /search

### Import (1 endpoint)

- **Import Films** - POST /import/films

## Testing Workflow

### 1. After Initial Deployment

```bash
# Deploy the API
cd /Users/samuel.symonds/SideProjects/pop-culture-reference-sites/film-api
export MONGODB_URI="your-mongodb-uri"
npm run deploy

# Copy the API Gateway URL from the output
# Example: FilmApi.FilmApiEndpointXXXXXX = https://abc123.execute-api.eu-west-1.amazonaws.com/prod/
```

Update the `API_URL` variable in Bruno with this URL.

### 2. After Data Import

After running the data import scripts, test these endpoints:

1. **Get Stats** - Verify total film count (~2,398)
2. **Get Films** - Try different filters (watched, minRating, year, genre)
3. **Get Directors** - Check director rankings (should have ~1,073 directors)
4. **Get Years** - Verify year statistics are calculated

### 3. Get Sample IDs for Testing

To test endpoints that require IDs, first fetch some data:

```bash
# Get a film ID
curl "{{API_URL}}/films?watched=true" | jq '.[0]._id'

# Get a director's TMDb person ID
curl "{{API_URL}}/directors" | jq '.[0].tmdbPersonId'
```

Copy these IDs into your Bruno environment variables.

### 4. Test Individual Film Operations

1. **Get Film By Id** - View full film details with populated directors
2. **Update Film Rating** - Change rating, verify cascading updates
3. **Get Director By Person Id** - Confirm director stats updated
4. **Get Year** - Confirm year stats updated

### 5. Test Stats Recalculation

If stats get out of sync:

1. **Update Director Stats** - Recalculate specific director
2. **Update Year Stats** - Recalculate specific year

## Query Parameters

Many endpoints support query parameters. In Bruno, query parameters are prefixed with `~` to disable them.

### Get Films Query Params

```
?watched=true              # Only watched films
&minRating=7               # Minimum rating 7
&maxRating=10              # Maximum rating 10
&year=1994                 # Films from 1994
&genre=Drama               # Films with Drama genre
&directorId=65abc...       # Films by specific director
```

Toggle the `~` prefix in Bruno to enable/disable parameters.

### Get Directors Query Params

```
?sortBy=totalPoints        # Sort by weighted score (default)
?sortBy=seenFilms          # Sort by number of watched films
?sortBy=averageRating      # Sort by average rating
```

### Search Query Params

```
?searchString=chaplin      # Search term (required)
&itemType=director         # Filter by type (film | director)
```

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
