# Film Ratings Application

A Next.js web application for tracking and rating films, replacing Google Sheets with a performant MongoDB-backed solution.

## Features

- Browse and filter 2,400+ films
- Track watched/unwatched status and ratings (1-10)
- View 1,000+ director statistics and rankings
- Year-based analysis with weighted scoring
- Genre distribution and statistics
- TMDb integration for rich film metadata
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **API Client**: Axios
- **Backend**: Film API (AWS Lambda + MongoDB)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=https://your-api-gateway-url
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Pages

- **Dashboard** (`/`) - Overview statistics and charts
- **Films** (`/films`) - Browse and filter film collection
- **Directors** (`/directors`) - Director rankings and statistics
- **Years** (`/years`) - Year-based analysis and scoring

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── films/        # Films list page
│   ├── directors/    # Directors page
│   ├── years/        # Years analysis page
│   └── page.tsx      # Dashboard homepage
├── components/       # React components
│   ├── Filters/      # Filter components
│   ├── Navbar/       # Navigation
│   ├── Rating/       # Rating badges
│   ├── Stats/        # Statistics components
│   └── Table/        # Data tables
├── lib/              # Utilities and context
│   ├── context/      # React Context
│   ├── api.ts        # API configuration
│   └── utils.ts      # Helper functions
└── types/            # TypeScript types
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This application can be deployed to:
- Vercel (recommended for Next.js)
- AWS Amplify
- Any Node.js hosting platform

Make sure to set the `NEXT_PUBLIC_API_URL` environment variable in your deployment settings.
