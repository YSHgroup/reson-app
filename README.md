# ResonApp

ResonApp is a collaborative project platform built with Next.js. It supports
project discovery and applications, user profiles, favorites, calendars, and
real-time messaging, including group chat and calls.

## Technology

- Next.js 16 with React 19 and TypeScript
- Node.js 20.19 or newer (required by Prisma's Neon driver)
- MongoDB for application data
- NextAuth.js for authentication
- Prisma with PostgreSQL (Neon) for new relational features
- A separate Express and Socket.IO service for real-time chat
- Material UI for interface components

The `reference/` directory contains a separate Wova job-marketplace project. It
is not part of ResonApp's runtime or dependency installation.

## Requirements

- Node.js 20.19 or newer
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
   | `DATABASE_URL` | Neon PostgreSQL connection string for Prisma |
   | `LEGACY_MONGO_URI`, `LEGACY_MONGO_DATABASE` | Optional legacy MongoDB source for data migration |
   | `NEXT_PUBLIC_BASE_URL` | Public base URL used when constructing app links |
   | `NEXT_PUBLIC_CHAT_URI` | URL of the Socket.IO chat service |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIRECT_URI` | Google sign-in |
   | `CONTACT_REDIRECT_URI`, `SCOPES` | Google Contacts integration |
   | `NEXTAUTH_SECRET` | Secret used to sign NextAuth sessions |
   | `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox maps and geocoding |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Places autocomplete |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Optional Stripe payments |
   | `CONNECT_PACK_PRICE_CENTS`, `CONNECT_PACK_SIZE` | Optional Stripe connect-pack settings |
   | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Optional SMS phone verification |

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
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply a development PostgreSQL migration |
| `npm run db:deploy` | Apply committed PostgreSQL migrations |
| `npm run db:import:mongodb` | Copy legacy MongoDB documents to PostgreSQL without modifying MongoDB |

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
its own App Router, Prisma schema, and SQLite data model. ResonApp retains its
routes and MongoDB integrations while adopting compatible patterns and adding
a Neon-backed relational foundation. New features use Prisma; legacy MongoDB
data remains intact. Set `DATABASE_URL`, run `npm run db:generate`, review and
apply migrations, then run `npm run db:import:mongodb` when ready to import
legacy data. Apply the committed schema with `npm run db:deploy` before running
the importer. It is resumable and never deletes or changes the source MongoDB
records; every source collection is also retained as JSON in `LegacyDocument`,
and users are mapped to relational `User` records. Back up both databases and
review the imported records before switching production features to
PostgreSQL.

The App Router `/onboarding` page supports professional and project-owner
profiles. Phone verification sends one-time codes through Twilio when its
credentials are configured; codes are hashed, expire after five minutes, and
are limited to five attempts. Existing signup continues to write to MongoDB
and, when `DATABASE_URL` is configured, synchronizes a new profile to
PostgreSQL. Imported accounts are not overwritten.
