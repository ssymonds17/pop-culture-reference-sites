# Film Ratings Application

A Next.js web application for tracking and rating films, replacing Google Sheets with a performant MongoDB-backed solution.

## Features

- Browse and filter the film collection
- Track watched status, ratings (1-10), ownership and reviews
- Film details with cast, production companies and links to TMDb and IMDb
- Director and actor rankings and statistics
- A ranked top films list for films rated 8 to 10
- Year-based analysis with weighted scoring
- Random film picker from owned films
- Genre distribution and statistics
- Add films by searching TMDb
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Clerk
- **API Client**: Axios
- **Testing**: Jest and React Testing Library
- **Backend**: Film API (AWS Lambda + MongoDB)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (see `.env.local.example`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_API_URL=https://your-api-gateway-url
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Pages

Pages marked **Sign-in** show a sign-in prompt until you are signed in.

- **Dashboard** (`/`) - Overview statistics and charts
- **Films** (`/films`) - Browse and filter the film collection (Sign-in)
- **Top Films** (`/top-films`) - Ranked list of films rated 8 to 10 (Sign-in)
- **Directors** (`/directors`) - Director rankings and statistics (Sign-in)
- **Actors** (`/actors`) - Actor rankings and statistics (Sign-in)
- **Years** (`/years`) - Year-based analysis and scoring
- **Random** (`/random`) - Pick random films from the ones you own

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── actors/       # Actors page
│   ├── directors/    # Directors page
│   ├── films/        # Films list page
│   ├── random/       # Random film picker
│   ├── top-films/    # Top films ranking
│   ├── years/        # Years analysis page
│   └── page.tsx      # Dashboard homepage
├── components/       # React components
│   ├── Auth/         # Sign-in protection
│   ├── Films/        # Film cards and grid
│   ├── Filters/      # Filter components
│   ├── Modal/        # Film detail, add film and person films modals
│   ├── Navbar/       # Navigation
│   ├── People/       # Shared director and actor rankings
│   ├── Rating/       # Rating badges
│   ├── Stats/        # Statistics components
│   ├── Table/        # Data tables
│   └── Years/        # Year components
├── lib/              # Utilities
│   ├── api.ts        # API endpoints
│   ├── auth-api.ts   # Authenticated API client
│   ├── personKinds.ts # Labels and endpoints for directors and actors
│   └── utils.ts      # Helper functions
├── middleware.ts     # Clerk middleware
└── types/            # TypeScript types
```

## Testing

```bash
npm test
```

Tests sit next to the code they cover, as `*.test.ts` or `*.test.tsx`.

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

Make sure to set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in your deployment settings.
