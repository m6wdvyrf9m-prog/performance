# Team Performance by The Colour Works

Version 1 of **Team Performance by The Colour Works** is a persisted workshop learning platform focused on the Colour Cards activity inside each participant's **My Discovery Learning Experience**.

## What Is Included

- HQ Admin dashboard and group creation wizard.
- Facilitator dashboard scoped to assigned groups.
- Participant dashboard with live activity entry point.
- Colour Cards activity with 12 fixed random cards per participant: 3 Blue, 3 Red, 3 Green, and 3 Yellow.
- Keep, give, return, and accept-received-card flows with server-side authorization.
- Close/finalise flow that persists retained cards into MDLE and preserves activity history.
- Read-only MDLE history with My Cards and My Activities.
- Development auth boundary keyed by email.
- MockUserDirectoryProvider adapter for future Insights API replacement.
- Prisma PostgreSQL schema, generated migration, and seed data.
- Business-rule tests for distribution, permissions, transfer constraints, close immutability, privacy, and final persistence.

## Brand System

The requested local brand pack path, `/mnt/data/ColourWorks_BrandPack1.html`, was not present in this desktop workspace. The recoverable referenced-conversation guidance described Avenir-style typography and a purple/pink TCW palette, so Version 1 centralizes those visual tokens in:

- `tailwind.config.ts`
- `src/lib/theme.ts`
- `src/app/globals.css`

When the full brand pack is reattached locally, update those tokens rather than editing page-level styles.

## Local Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Set `DATABASE_URL` in `.env` to a PostgreSQL database.

4. Generate Prisma client:

   ```bash
   pnpm prisma:generate
   ```

5. Apply the schema:

   ```bash
   pnpm prisma:migrate
   ```

6. Seed demo data:

   ```bash
   pnpm db:seed
   ```

7. Run the app:

   ```bash
   pnpm dev
   ```

## Vercel Deployment

For a fresh Vercel project, import the GitHub repository, connect a PostgreSQL database, and make sure Vercel has a production environment variable named exactly:

```bash
DATABASE_URL
```

The value must be the full Postgres connection string and must start with `postgresql://` or `postgres://`.

The production build runs:

```bash
prisma generate && prisma migrate deploy && prisma db seed && next build
```

That creates the Prisma client, applies migrations, seeds the demo workshop data, and builds the Next.js app.

## Seed Logins

- HQ Admin: `admin@tcw.example`
- Facilitator: `andy.dowling@tcw.example`
- Facilitator: `luke.wiltshire@tcw.example`
- Facilitator: `matthew.cook@tcw.example`
- Demo participant: `amara.patel@participant.example`

The seeded demo group is **TCW Discovery Workshop Demo**. It starts with one facilitator, 10 participants, and a Colour Cards activity in `NOT_STARTED`.

## Routes

- `/login` - development sign in.
- `/admin` - HQ Admin dashboard.
- `/admin/groups/new` - group creation wizard.
- `/admin/groups/[groupId]` - HQ group overview and audit history.
- `/facilitator` - facilitator assigned groups.
- `/facilitator/groups/[groupId]` - activity start/close and live progress.
- `/participant` - participant dashboard.
- `/activity/[sessionId]` - live Colour Cards activity.
- `/mdle` - My Discovery Learning Experience.
- `/mdle/activity/[sessionId]` - read-only completed activity history.

## Architecture Notes

- Authentication is isolated in `src/lib/auth`. Replace `DevCookieAuthProvider` with a production provider without changing page or activity logic.
- User lookup is isolated behind `UserDirectoryProvider` in `src/lib/user-directory`.
- `ActivityDefinition` and `ActivitySession` separate reusable activity types from group-specific delivery.
- `CardDefinition` and `ActivityCardInstance` separate the shared statements from each participant's individual card ownership history.
- `CardTransfer` and `AuditEvent` preserve movement and administrative history.
- `LearningProfile`, `SavedCard`, and `LearningArtifact` form the MDLE persistence layer.
- `InsightsProfile`, `TPIAssessment`, and `Leadership360Assessment` are schema placeholders for later result sources.
- Auto-refresh polling is implemented through `src/lib/realtime/refresh.tsx` and can be swapped for SSE or WebSockets later.

## Verification

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```
