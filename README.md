# ResonApp

ResonApp is a collaborative project platform built with Next.js. It supports
project discovery and applications, user profiles, favorites, calendars, and
real-time messaging, including group chat and calls.

## Technology

- Next.js 16 with React 19 and TypeScript
- Node.js 20.9 or newer (required by Next.js 16)
- MongoDB for application data
- NextAuth.js for authentication
- A separate Express and Socket.IO service for real-time chat
- Material UI for interface components

The `reference/` directory contains a separate Wova job-marketplace project. It
is not part of ResonApp's runtime or dependency installation.

## Requirements

- Node.js 20.9 or newer
- Access to a MongoDB database

## Local development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Set the environment variables required by the integrations you use. Keep
   local values in `.env.local` and never commit credentials. `.env.example`
   lists the supported variables without containing private values.

   | Variable | Purpose |
   | --- | --- |
   | `MONGO_URI` | MongoDB connection string |
   | `NEXT_PUBLIC_BASE_URL` | Public base URL used when constructing app links |
   | `NEXT_PUBLIC_CHAT_URI` | URL of the Socket.IO chat service |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIRECT_URI` | Google sign-in |
   | `CONTACT_REDIRECT_URI`, `SCOPES` | Google Contacts integration |
   | `NEXTAUTH_SECRET` | Secret used to sign NextAuth sessions |
   | `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox maps and geocoding |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Places autocomplete |

3. Start the web app and chat service:

   ```sh
   npm run dev
   ```

   The Next.js app uses port 3000 and the chat service uses port 4000.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Next.js app and chat service together |
| `npm run next:dev` | Run only the Next.js development server |
| `npm run chat:dev` | Run only the chat service with Nodemon |
| `npm run build` | Build the Next.js app |
| `npm run next:start` | Start the production Next.js server |
| `npm run chat:start` | Start the production chat service |
| `npm run lint` | Run the Next.js ESLint checks |

The production web and chat services are started separately with
`npm run next:start` and `npm run chat:start`.

## Project layout

- `src/pages/` — Pages Router screens and API routes
- `src/app/` — App Router routes introduced alongside existing pages
- `src/components/` — Shared UI components and layouts
- `src/lib/` — Database and application helpers
- `server/` — Express and Socket.IO chat service
- `public/` — Static assets

## Reference project

The Wova marketplace archive under `reference/` is a distinct application with
its own App Router, Prisma schema, and SQLite data model. Its code and database
are not wired into ResonApp.
