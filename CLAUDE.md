# CLAUDE.md: NYC Ready

Guidance for Claude Code sessions working in this repository. Read this, then `README.md`.

@AGENTS.md

## What this is

NYC Ready is a SaaS planning tool for people moving to NYC (initial audience: recent grads and early-career professionals). There are four modules: **financial profile**, **Cost Explorer**, **weekly planner**, and **budget**, connected by a dashboard. The owner is a solo developer: favor simple, readable code over abstractions.

## Commands

```bash
npm run dev            # dev server (demo mode if no Supabase env)
npm run check          # typecheck + lint + unit tests (run before every commit)
npm run test:e2e       # Playwright (builds and serves demo mode on :3100)
npm run test:db        # migrations + seed + RLS tests on a SCRATCH Postgres (needs DATABASE_URL)
npm run db:seed:generate   # after editing src/lib/catalog/demo-data.ts
```

After a failing run, re-run only the failing tests while you fix them (e.g. `npx vitest run src/lib/finance`).

## Architecture (layers)

| Layer | Location | Rules |
| --- | --- | --- |
| Routes/pages | `src/app` | Thin. Load data via `loadPlan()` / `getRepository()` / `getCatalogProvider()`, render components. No business logic. |
| Components | `src/components` | `ui/` = primitives (shadcn conventions, `cn()` from `@/lib/utils`). Feature folders hold composed components. Client components only where interactivity needs it. |
| Business logic | `src/lib/finance`, `src/lib/catalog/{freshness,unit-price,query}.ts` | Pure functions, no I/O, unit-tested. |
| Domain types | `src/lib/domain` | `types.ts` (unions + labels), `categories.ts` (single source of category IDs). |
| Validation | `src/lib/validation` | Zod schemas take **form strings** and output domain values (cents, nulls). Used by forms (`zodResolver(schema, undefined, { raw: true })`) **and** re-run in server actions. |
| Mutations | `src/lib/actions` | `"use server"`. Always validate, get the repository via `getRepository()` (which authenticates), return `ActionResult`, call `revalidatePath("/", "layout")`. |
| User data access | `src/lib/data` | `PlanRepository` interface; `SupabaseRepository` and `DemoRepository`. A repository is scoped to the current user at construction, so never accept a user ID from the client. |
| Catalog access | `src/lib/catalog` | `CatalogProvider` interface; `supabase-provider.ts` and `demo-provider.ts`. The UI never knows the backend. |
| Auth/session | `src/lib/auth/session.ts`, `src/proxy.ts` | `getSession()` / `requireSession()`. Supabase mode verifies the JWT with `getClaims()`. |
| Database | `supabase/migrations` | Add a NEW timestamped migration for every schema change; never edit an applied one. Update `src/lib/supabase/database.types.ts` to match. |

## Data modes

- **Supabase mode:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set.
- **Demo mode:** neither is set. The demo session cookie maps to in-memory state (`src/lib/data/demo-store.ts`). The demo banner shows on every app page.
- Setting only one of the two variables throws (`src/lib/env.ts`). Keep it that way.

## Non-negotiable conventions

- **Money is integer cents** (`Cents`). Parse with `parseDollarsToCents`, display with `formatCents` / `<Money>`. Never use floats for money, and never `parseFloat` user input.
- **Frequency conversion only via `src/lib/finance/frequency.ts`** (weekly × 52 ÷ 12, etc.). All totals come from `calculatePlanSummary()` in `src/lib/finance/plan.ts`; read its header comment before changing the accounting model, and update the tests and README table with it.
- **Never fabricate prices or present demo data as real.** Demo observations must have `isDemo: true`, `priceType: "demo"`, the demo source, and fictional merchant names. Don't add real-looking prices without a real source, URL and verification date.
- **Price history is append-only.** Insert new `price_observations`; never update or delete old ones in app code.
- **No scraping** of retailer sites. New sources need an official API, a license, permitted public data, or a manual/CSV import.
- **Security:** every new user-owned table gets `user_id`, RLS enabled, owner-only policies, and a case in `supabase/tests/rls.test.sql`. Reference tables are read-only for `anon`/`authenticated`. Never use the service-role key in the Next.js app.
- **No dead buttons.** If a feature isn't built, say so in text (see Settings → "Coming later"), not with a disabled-looking button that does nothing.
- **Category IDs** live in `src/lib/domain/categories.ts` AND the migration's insert. A test fails if they drift; add new categories in a new migration.
- Days of week are ISO (1 = Monday). Times are `"HH:MM"`.
- Use `<NativeSelect>` for selects in forms (works with `register`, mobile friendly). Use `useWatch` instead of `form.watch` (React Compiler lint).
- Avoid `any`. Use the type guards and unions in `domain/types.ts`.

## Rendering model

- `cacheComponents` is **off** (see `next.config.ts`). Pages are dynamic and read the session per request. If you enable it, wrap session reads in `<Suspense>` and follow `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.
- Next 16 specifics: `middleware.ts` is now `src/proxy.ts`; `params`/`searchParams`/`cookies()` are async; `PageProps<"/route">` / `LayoutProps` are global route-typed helpers (run `npx next typegen` after adding routes). Check the bundled docs in `node_modules/next/dist/docs/` before using an unfamiliar API.

## UI and brand

Calm, credible financial product: neutral surfaces, one ink-blue accent (`--primary`), semantic colors only for meaning (`positive`, `caution`, `negative`, `demo`). No gradients, minimal animation, few cards per screen, tabular numbers (`.tabular`). Every financial number should be explainable: put derivations next to totals (see `PlanBreakdown`). Charts: single-series bars in `--chart-1`, hover tooltips, no dual axes.

shadcn's registry may be unreachable from sandboxes; components in `src/components/ui` were written by hand to shadcn conventions. `components.json` is present, so `npx shadcn add <component>` works where the registry is reachable.

## Testing expectations

- New calculation or label logic → unit tests next to it.
- New user-data table/policy → extend `supabase/tests/rls.test.sql` and run `npm run test:db`.
- New user journey → a Playwright test in `e2e/` (runs in demo mode).
- Prefer accessible locators (`getByRole`, `getByLabel`) and `data-testid` for repeated sections.

## Roadmap context (not built yet; don't build these unless asked)

Native apps, bank integrations, payments, AI recommendations, listing/rental integrations, neighborhood recommendation algorithms, real-time transit, scraping, tax calculation, social features. The architecture should keep them possible: scenarios already support comparisons, and the catalog supports more sources and history.
