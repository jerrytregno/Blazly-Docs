# Blazly Local SEO

AI-powered local SEO SaaS platform for Google Maps visibility, competitor analysis, and optimization recommendations.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Firebase** — Authentication & Firestore database
- **Google Gemini 3.5 Flash** — AI SEO audits and keyword suggestions
- **SearchAPI** — Google Maps local search data

## Features

- User authentication (email/password + Google sign-in)
- Project management for businesses and target keywords
- Google Maps local pack search with real-time data
- AI-powered local SEO audits with scores and recommendations
- Dashboard with activity overview

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config |
| `GEMINI_API_KEY` | Google Gemini API key (server-only) |
| `SEARCHAPI_API_KEY` | SearchAPI key (server-only) |

### 3. Firebase setup

1. Enable **Authentication** → Email/Password and Google sign-in
2. Create a **Firestore** database
3. Deploy security rules and indexes:

```bash
firebase deploy --only firestore
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/maps/search/    # SearchAPI Google Maps proxy
│   ├── api/ai/audit/       # Gemini AI audit endpoint
│   ├── dashboard/          # Protected dashboard pages
│   ├── login/ & signup/    # Auth pages
│   └── page.tsx            # Landing page
├── components/             # UI components
├── lib/                    # Firebase, Gemini, SearchAPI clients
└── types/                  # TypeScript interfaces
```

## API Routes

All external API keys are kept server-side for security.

- `POST /api/maps/search` — Search Google Maps local results
- `POST /api/ai/audit` — Generate AI SEO audit (also supports `action: "keywords"`)

## Security

- API keys for Gemini and SearchAPI are never exposed to the client
- Firestore rules enforce per-user data isolation
- `.env.local` is gitignored

## Production

```bash
npm run build
npm start
```

Deploy to Vercel, Firebase Hosting, or any Node.js host. Set environment variables in your hosting provider.
