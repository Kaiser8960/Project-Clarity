# Clarity v2 — Contract Risk Analysis

A web app for small businesses to analyze legal contracts, flag risky clauses, and manage team access without needing a lawyer.

## Features
- AI-powered contract clause analysis (high/medium/low risk)
- Document vault with OCR support for scanned files
- Knowledge graph showing relationships and conflicts between documents
- Admin dashboard with per-staff permission controls
- Invite code system for team onboarding
- Expiry date tracking and retention status
- Cross-document conflict detection

## Tech Stack
- Next.js 16 / TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Google Gemini 2.5 Flash
- Tesseract.js (OCR)
- React Force Graph

## Prerequisites
- Node.js v18+
- Supabase account (free tier works)
- Google AI Studio account for a Gemini API key

## Installation

**1. Install dependencies**
```bash
npm install
```

**2. Set up environment variables**
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your Supabase and Gemini credentials (see `.env.example` for what's needed and where to find each value).

**3. Set up the Supabase database**

In your Supabase project, go to **SQL Editor → New Query** and run the migration files in order:

```
supabase/migrations/001_create_tables.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_pgvector.sql
supabase/migrations/005_org_schema.sql
supabase/migrations/006_fix_rls.sql
```

> Skip `004_pg_cron.sql` unless you have pg_cron enabled.

Also enable the `vector` extension under **Database → Extensions**, and disable email confirmation under **Authentication → Settings** for local testing.

**4. Create storage buckets**

In **Storage**, create two private buckets named `contracts` and `documents`.

**5. Run the dev server**
```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Default Accounts

There are no hardcoded accounts. On first use:

- Go to `/register` to create an organization (Admin account)
- Share the invite code from the Admin dashboard
- Staff go to `/join` and use the invite code to create their account

## Notes
- Gemini API occasional 503 errors are normal on the free tier — just retry
- OCR runs locally via Tesseract.js; `eng.traineddata` in the root is required for it to work
- Migration `006_fix_rls.sql` must be run after `005` — skipping it breaks registration
