# Film API

Backend API for the Film Ratings Application. Built with AWS Lambda, API Gateway, and MongoDB.

## Architecture

- **Backend**: AWS Lambda + API Gateway
- **Database**: MongoDB
- **Infrastructure**: AWS CDK
- **Runtime**: Node.js 22

## Project Structure

```
film-api/
├── bin/              # CDK app entry point
├── lib/              # CDK infrastructure code
│   └── constructs/   # Reusable CDK constructs
├── lambda/           # Lambda function handlers
│   ├── mongodb/      # MongoDB models and services
│   │   ├── models/   # Mongoose schemas
│   │   └── services/ # Business logic
│   └── utils/        # Utility functions
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
# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
```

2. **MongoDB connection string** (can use existing cluster, e.g., MusicCluster)

3. **AWS account permissions** for:
   - Lambda functions
   - API Gateway
   - IAM roles
   - CloudFormation stacks

### Deployment Steps

1. Install dependencies:
```bash
npm install
```

2. Set environment variable for MongoDB connection (REQUIRED):
```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
```

**Important:** This environment variable must be set before running synth/deploy. The CDK will validate it's present and pass it to all Lambda functions automatically.

3. Build Lambda functions:
```bash
npm run build:all
```

4. Deploy to AWS:
```bash
npm run synth
npm run deploy
```

5. Note the API Gateway URL from the deployment output (e.g., `https://xxxxxxxxxx.execute-api.region.amazonaws.com/prod/`)

## API Endpoints

### Films

- `POST /film` - Create film
- `GET /films` - List films (with filters)
- `GET /film/{id}` - Get single film
- `PUT /film/{id}/rating` - Update film rating
- `DELETE /film/{id}` - Delete film

### Directors

- `GET /directors` - List directors
- `GET /director/{tmdbPersonId}` - Get director by TMDb ID
- `PUT /director/{tmdbPersonId}/stats` - Recalculate director stats

### Statistics

- `GET /stats` - Overall statistics
- `GET /years` - Year statistics
- `GET /year/{year}` - Single year stats
- `PUT /year/{year}/stats` - Recalculate year stats

### Search

- `GET /search` - Search films and directors

### Import

- `POST /import/films` - Bulk import endpoint

## Development

Run tests:

```bash
npm test
```

Build single Lambda:

```bash
npm run build:create-film
```

## MongoDB Models

- **Film**: Film documents with ratings, directors, and TMDb metadata
- **Director**: Director documents with aggregated statistics
- **YearStats**: Pre-computed year statistics with weighted scoring
