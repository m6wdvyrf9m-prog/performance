# Team Performance by The Colour Works - Version 1 Implementation Plan

## Scope

Build the first working version of Team Performance by The Colour Works as a Next.js, TypeScript, Tailwind, Prisma, PostgreSQL, and Zod application. Version 1 focuses on the Colour Cards workshop activity inside each participant's My Discovery Learning Experience while keeping the platform modular for future Insights Discovery, TPI, Leadership 360, resources, and learning history modules.

## Architecture

- Use Next.js App Router with server actions for protected mutations and server-rendered pages for dashboards.
- Keep authentication behind a replaceable development auth boundary keyed by email.
- Keep user lookup behind a `UserDirectoryProvider` interface with `MockUserDirectoryProvider` now and a documented future `InsightsApiUserDirectoryProvider`.
- Model activity definitions separately from activity sessions so future activity types can be added without reshaping the platform.
- Model card definitions separately from card instances so duplicate statements can safely exist across participants and every movement can be audited.
- Use Prisma with PostgreSQL for relational persistence and transactions.
- Use a small polling-based realtime abstraction for facilitator progress, received cards, and closure updates. This keeps Version 1 simple while leaving room for SSE or WebSockets later.
- Centralize TCW theme tokens in code and Tailwind so brand values can be refined when the full brand pack file is available locally.

## Delivery Steps

1. Scaffold the Next.js application, styling system, linting, testing, Prisma, and environment templates.
2. Add Prisma schema, seed data, and the exact 100 Colour Cards statements.
3. Implement auth, permissions, audit logging, user directory, activity, and card service layers.
4. Build HQ Admin group creation and management, Facilitator dashboard, Participant dashboard, Colour Cards activity, and MDLE pages.
5. Add protected server actions for group creation, activity start/close, keep/give/return/accept card flows, and readonly completed activity access.
6. Add tests for the core business rules: distribution, idempotency, transfer constraints, close immutability, role permissions, MDLE privacy, and final persistence.
7. Run lint, typecheck, tests, and build; fix issues before handoff.

## Future Modules

- Insights Discovery profiles attach to the user learning profile through the future Insights adapter.
- TPI and Leadership 360 attach as separate assessment/result sources rather than being embedded in the card activity.
- Additional workshop activities plug in through `ActivityDefinition`, `ActivitySession`, `ActivityParticipation`, and learning artifact records.
