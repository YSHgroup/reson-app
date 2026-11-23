# ResonApp

ResonApp is a collaborative project platform built with Next.js. It supports
project discovery and applications, user profiles, favorites, calendars, and
real-time direct and group messaging.

## Technology

- Next.js 16 with React 19 and TypeScript
- Node.js 20.19 or newer
- PostgreSQL as the only application database
- Prisma for database access and migrations
- NextAuth.js for authentication
- Express and Socket.IO for real-time chat
- Material UI for interface components

The `reference/` directory contains a separate Wova job-marketplace project. It
is not part of ResonApp's runtime or dependency installation.

## Requirements

- Node.js 20.19 or newer
- PostgreSQL 15 or newer

## Local development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local PostgreSQL database (for example `reson_test`), copy
   `.env.example` to `.env.local`, and set `DATABASE_URL` to that database. For
   example:

   ```text
   DATABASE_URL=postgresql://postgres:your-password@localhost:5432/reson_test?schema=public
   ```

   Set a private `NEXTAUTH_SECRET`. On PowerShell, generate one with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

   Generate the Prisma client, apply the schema, and seed the assessment bank:

   ```powershell
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   ```

   With SMTP settings left blank, local signups are immediately enabled; no
   email provider is required. If SMTP is configured, new users must verify
   their email before signing in.

3. Configure any optional integrations you use. Keep local values in
   `.env.local` and never commit credentials.

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string for the web and chat services |
   | `NEXTAUTH_SECRET` | Secret used to sign NextAuth sessions |
   | `NEXTAUTH_URL` | Public base URL used by NextAuth |
   | `NEXT_PUBLIC_BASE_URL` | Base URL used to construct email verification links |
   | `NEXT_PUBLIC_CHAT_URI` | URL of the Socket.IO chat service |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Optional email verification |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDIRECT_URI` | Google Contacts integration |
   | `CONTACT_REDIRECT_URI`, `SCOPES` | Google Contacts callback settings |
   | `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox maps and geocoding |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Places autocomplete |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Optional Stripe payments |
   | `CONNECT_PACK_PRICE_CENTS`, `CONNECT_PACK_SIZE` | Stripe Connect pack settings |
   | `CONNECTS_PER_APPLICATION` | Connects deducted per application (default 1) |
   | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Optional SMS phone verification |

4. Start the web app and chat service:

   ```sh
   npm run dev
   ```

   The Next.js app uses port 3000 and the chat service uses port 4000. Both
   services require the same `DATABASE_URL`.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Next.js app and chat service together |
| `npm run next:dev` | Run only the Next.js development server |
| `npm run chat:dev` | Run only the chat service with Nodemon |
| `npm run build` | Build the Next.js app |
| `npm run next:start` | Start the production Next.js server |
| `npm run chat:start` | Start the production chat service |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply a development PostgreSQL migration |
| `npm run db:deploy` | Apply committed PostgreSQL migrations |
| `npm run db:seed` | Add the built-in skill assessment question bank |

The production web and chat services can be started separately with
`npm run next:start` and `npm run chat:start`.

## Project layout

- `src/pages/` — Pages Router screens and API routes
- `src/app/` — App Router routes introduced alongside existing pages
- `src/components/` — Shared components and layouts
- `src/lib/` — Prisma and application helpers
- `server/` — Express and Socket.IO chat service
- `prisma/` — PostgreSQL schema, migrations, and seed data
- `public/` — Static assets

## Platform features

Email/password accounts, settings, profiles, projects, applications,
favorites, calendars, search history, contacts, and chat are all stored in
PostgreSQL. Prisma applies the same schema to local PostgreSQL and Neon
PostgreSQL.

The `/onboarding` page supports professional and project-owner profiles. Phone
verification sends one-time codes through Twilio when its credentials are
configured; codes are hashed, expire after five minutes, and are limited to
five attempts.

Professional accounts can take timed skill assessments at `/skills`.
Questions are selected from the seeded question bank, answers are graded on
the server, and a passing score awards the talent badge. Each category is
limited to three attempts per user per day.

Connect purchases use Stripe Checkout. Configure `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, and the Connect pack size and
price. Register `/api/connects/stripe-webhook` with Stripe for the
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`checkout.session.expired` events. Credits are granted only by a verified,
paid webhook and duplicate delivery cannot credit a purchase twice.
Applications consume `CONNECTS_PER_APPLICATION` Connects (default one).
