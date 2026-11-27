# NYC Ready

NYC Ready helps people, starting with recent grads and early-career professionals, plan a financially sustainable move to New York City. Users set their starting point (take-home pay, savings), build a realistic weekly routine, look up everyday costs with clear sources, and see whether their income supports the life they want, with every number explained.

> **Status: MVP foundation.** All four modules work end to end. The price catalog currently contains **demonstration data only** (clearly labelled in the app). See [What's real and what's demo](#whats-real-and-whats-demo).

## Contents

- [Quick start (demo mode, no accounts)](#quick-start-demo-mode-no-accounts)
- [Running with Supabase](#running-with-supabase)
- [Scripts](#scripts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [How the numbers are calculated](#how-the-numbers-are-calculated)
- [Price data and sources](#price-data-and-sources)
- [What's real and what's demo](#whats-real-and-whats-demo)
- [Before real users](#before-real-users)

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui-style components on Radix · Lucide icons · Recharts · React Hook Form + Zod · Supabase (Postgres, Auth, Row Level Security) via `@supabase/ssr` · Vitest · Playwright.

## Quick start (demo mode, no accounts)

Requirements: Node.js 20.9+ (22 recommended) and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and choose **Explore the example plan** or **Start from scratch**.

With no Supabase keys, the app runs in **demo mode**:

- No sign-up. A random, anonymous session cookie identifies your browser.
- Your plan is kept **in server memory** for that session. It's gone when the server restarts.
- Every price is **demonstration data** from fictional merchants, and the UI says so on every page.

## Running with Supabase

1. **Create a project** at [supabase.com](https://supabase.com) (the free tier is fine).
2. **Create the schema.** Pick one:
   - **SQL editor (simplest):** open *SQL Editor* in the Supabase dashboard and run, in order:
     1. `supabase/migrations/20261127000000_initial_schema.sql`
     2. `supabase/seed.sql` (optional: the demo catalog, labelled as demo data)
   - **Supabase CLI:** `npx supabase login`, `npx supabase init` (keep the existing `supabase/` folder), `npx supabase link --project-ref <your-ref>`, then `npx supabase db push`. Run `seed.sql` from the SQL editor if you want the demo catalog.
3. **Configure the app:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in values from *Project Settings → API*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_…` key; the legacy anon key also works through `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` locally)
4. **Auth settings** (*Authentication → URL Configuration*): set **Site URL** to your `NEXT_PUBLIC_SITE_URL` and add `http://localhost:3000/auth/callback` (plus your production URL) to **Redirect URLs**. Email confirmation is on by default; new users confirm by email, then land on onboarding.
5. Run `npm run dev`. Sign up, confirm your email, and complete onboarding.

Setting only one of the two Supabase variables is treated as an error. That way a misconfigured deploy never quietly falls back to demo mode.

**Never** put the Supabase *secret* / service-role key in this app's environment. The app only needs the publishable key; Row Level Security protects user data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, against a demo-mode production build) |
| `npm run test:db` | Apply migrations + seed to a scratch Postgres and run the RLS tests |
| `npm run check` | Typecheck + lint + unit tests |
| `npm run db:seed:generate` | Regenerate `supabase/seed.sql` from the demo catalog |

## Testing

- **Unit tests** (`src/**/*.test.ts`) cover the financial calculations, money parsing, frequency conversion, freshness labels, unit pricing, catalog search, validation schemas, demo-session isolation, redirect safety, and checks that the SQL categories and seed match the code.
- **Database tests** (`supabase/tests/rls.test.sql`) prove that one user can't read, change or delete another user's profile, scenarios, budget items or schedule, and that reference data is read-only. They also check the integrity constraints. Run them against a **scratch** database (it is dropped and recreated):
  ```bash
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/nycr_test npm run test:db
  ```
  `supabase/tests/local/auth-stub.sql` provides the small slice of Supabase (roles, `auth.users`, `auth.uid()`) needed to run this on plain Postgres. Never run it against a real Supabase project.
- **E2E tests** (`e2e/`) cover the main journey (onboarding → budget → planner → summary), the Cost Explorer, protected routes, demo-session isolation and mobile navigation. Install a browser once with `npx playwright install chromium`, or point at an installed Chrome with `PLAYWRIGHT_CHROME_PATH=/path/to/chrome`.
- **CI** (`.github/workflows/ci.yml`) runs all three on every pull request.

## Project structure

```
src/
  app/                       Routes (App Router)
    page.tsx                 Landing page
    (auth)/login, signup     Auth pages (show a demo notice when Supabase is off)
    auth/callback/route.ts   Email confirmation handler
    (app)/                   Signed-in area: dashboard, budget, planner, explore, profile, settings, onboarding
  proxy.ts                   Session refresh + redirect for protected routes (Next 16 "proxy", formerly middleware)
  components/
    ui/                      Design-system primitives (shadcn/ui conventions)
    finance/                 Money, metric cards, price display, freshness badge, plan breakdown, status
    budget/ planner/ explorer/ profile/ charts/ layout/ marketing/ auth/ form/ settings/
  lib/
    domain/                  Domain types and the category list (single source of truth)
    finance/                 Pure, tested financial logic (money, frequency, schedule, plan summary)
    catalog/                 Provider-independent price catalog: types, freshness, unit price, search, demo data, providers
    data/                    User-data repositories (Supabase and demo) behind one interface
    validation/              Zod schemas shared by forms and server actions
    actions/                 Server Actions (the only place mutations happen)
    auth/                    Session lookup (Supabase JWT or demo cookie)
    supabase/                Supabase clients and database types
    env.ts                   Environment and data-mode selection
supabase/
  migrations/                SQL schema, indexes, constraints, RLS policies, category reference data
  seed.sql                   Generated demo catalog (labelled demo data)
  tests/                     RLS + integrity tests
e2e/                         Playwright tests
scripts/                     Seed generator, DB test runner
```

**Files to read first:** `src/lib/finance/plan.ts` (the accounting model), `src/lib/domain/types.ts`, `src/lib/data/repository.ts`, `src/lib/catalog/types.ts` + `freshness.ts`, `supabase/migrations/*_initial_schema.sql`, and `src/app/(app)/budget/page.tsx` as an example page.

## How the numbers are calculated

All money is stored and computed as **integer cents**. The rules live in `src/lib/finance/` and are unit-tested.

| Concept | Rule |
| --- | --- |
| Weekly → monthly | amount × 52 ÷ 12 |
| Yearly → monthly | amount ÷ 12 |
| Monthly → weekly allowance | amount × 12 ÷ 52 |
| One-time costs | Not in monthly totals; counted under move-in costs |
| Monthly income | take-home pay + additional income items |
| Monthly expenses | fixed + variable allowances + planner spending not covered by an allowance |
| Unallocated | income − expenses − planned savings |
| Total saved per month | planned savings + max(unallocated, 0) |
| % of income spent | expenses ÷ income × 100 (shown as "—" when income is 0) |
| Position before moving | current savings − one-time relocation costs |

**No double counting.** A *variable* budget item is an **allowance** ("$400/month for groceries"). A weekly-planner activity with a cost is a **planned expense** ("$60 grocery run on Tuesday"). For each top-level category, planner spending (monthly equivalent) is drawn from the allowance first, and **only the excess** is added to expenses. Fixed costs are never offset, so a $20 class fee is extra on top of a gym membership. The budget page shows this reconciliation in a table.

**Status** comes from explicit rules, which the UI prints alongside the result: *shortfall* (unallocated < 0), *thin margin* (unallocated < 5% of income), *fits*, or *missing income*. The app doesn't judge lifestyles; it shows the arithmetic.

## Price data and sources

- `data_sources` describes where prices come from (`official`, `licensed_provider`, `public_dataset`, `curated_manual`, `user_submission`, `demo`), with coverage, limitations and an expected refresh interval.
- `price_observations` is **append-only**: a new price is a new row, so history is kept for future trend features. Each observation records merchant, location, price in cents, package quantity, a generated unit price, observed/verified dates, price type, confidence, expiry and an `is_demo` flag (a constraint keeps `is_demo` and `price_type = 'demo'` in sync).
- The `latest_price_observations` view feeds the Cost Explorer.
- Freshness labels (`src/lib/catalog/freshness.ts`): **Demo data** always wins; then *Expired*, *User-submitted*, *Estimate*; verified observations are *Recently verified* inside the source's refresh window (default 90 days) and *Older observation* after it.
- The frontend only talks to a `CatalogProvider` (`src/lib/catalog/types.ts`). New sources are **imported into Supabase** as data sources + observations, so adding one doesn't touch the UI.

We don't scrape retailer websites. Integrations should use official APIs, licensed feeds, permitted public data or curated manual/CSV imports, and only after checking licensing and terms.

## What's real and what's demo

| Area | Status |
| --- | --- |
| Accounts, sessions, RLS-protected user data (Supabase mode) | Real |
| Profile, onboarding, budget, weekly planner, dashboard calculations | Real: computed from what the user enters |
| Cost Explorer search, filters, sorting, unit pricing, add-to-budget | Real functionality |
| **Catalog prices** | **Demonstration data only**: illustrative round numbers from fictional merchants (`src/lib/catalog/demo-data.ts`) |
| **Example plan** in demo mode | **Demonstration data**: made-up figures, labelled in the plan name, item notes and a site-wide banner |
| Demo-mode storage | Temporary server memory (resets on restart) |

## Before real users

1. **Real price data:** pick and license the first sources (for example, official MTA fares, entered by hand with a verification date), build the CSV/admin import, and set `refresh_interval_days` per source.
2. **Account lifecycle:** password reset, account deletion and data export (self-serve deletion is required in many jurisdictions).
3. **Legal and trust:** privacy policy, terms, a "not financial advice" notice, and cookie disclosure.
4. **Ops:** error monitoring (e.g. Sentry), rate limiting on auth, Supabase backups, a production deploy (e.g. Vercel) with a custom SMTP sender for auth email.
5. **Multiple scenarios:** the schema already supports them; the UI currently uses the primary scenario.

## License

Private. All rights reserved.
