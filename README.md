# HUSTLE Sales Copilot

A private, human-approved lead discovery and outreach workspace for finding hospitality and beauty businesses with evidence-backed website needs.

## What is implemented

- Nigeria and UK Google Places campaigns with result and budget caps
- Turso/libSQL database with Drizzle schema and versioned migrations
- Single-owner Google authentication through Auth.js
- SSRF-safe website auditing, deterministic opportunity scoring, and stored evidence
- Capped Gemini 2.5 Flash analysis using anonymized, schema-validated input/output
- Email and WhatsApp drafts that never send automatically
- Permanent opt-out suppression and UK compliance review gate
- One five-business-day follow-up reminder
- Proposal, staging-preview approval, payment, and handover-unlock states
- Responsive private dashboard plus read-only demo mode

## Local setup

Requirements: Node.js 20+ and pnpm 11.

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm db:migrate
pnpm dev
```

Fill `.env.local` with:

- Turso connection URL and auth token
- Google OAuth client ID/secret and the single `OWNER_EMAIL`
- Google Places API key
- Gemini API key
- strong `AUTH_SECRET` and `CRON_SECRET`

For a credential-free UI preview, set `DEMO_MODE=true`. Never enable demo mode in production.

## Database and deployment

Generate migrations after schema changes with `pnpm db:generate`. Review generated SQL, then apply with `pnpm db:migrate`. Add all variables from `.env.example` to Vercel. `vercel.json` invokes the protected reminder route on weekdays; Vercel must send `Authorization: Bearer $CRON_SECRET`.

Google Places costs vary by requested fields. Set `GOOGLE_PLACES_ESTIMATED_REQUEST_MINOR` to the expected per-search amount in the campaign budget's minor unit; the application stops a search that would exceed its cap.

Optional public-web enrichment uses the Brave Search API to discover candidate official websites and business-owned social profiles. Set `BRAVE_SEARCH_API_KEY` and keep `BRAVE_DAILY_LIMIT` bounded. Search results are never trusted automatically: website candidates require confirmation, while social links found directly on an existing business website are recorded as confirmed evidence.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Operating rules

- Inspect and edit every pitch before sending it yourself.
- Mark a draft sent only after using your real email or WhatsApp account.
- Honor objections immediately; suppression is permanent.
- For UK leads, confirm corporate status or complete manual compliance review.
- Customers inspect a restricted staging preview without a deposit. Production deployment, source code, credentials, and ownership transfer only after full payment.
