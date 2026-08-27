# 2IC Budget Management

A personalised, calm envelope-budget app for a household — a Combined view
plus one view per profile, built around 2IC's "Plan smarter. Spend wiser.
Live easier." identity. Each household sets up its own name, profiles and
photos from scratch; nothing here is tied to any one family.

Runs against a real Supabase backend when `.env` is configured (see
[Phase 2](#phase-2-live) below); without it, falls back to a fully navigable
frontend on mock data — handy for local UI work with no backend at hand.

## Tech stack

React · Vite · TypeScript · Tailwind CSS · React Router (`HashRouter`) ·
PapaParse · lightweight SVG progress rings · Recharts (where useful) ·
lucide-react icons.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Without `.env` configured, the mock login accepts anything — click **Sign
in** to enter the app. With `.env` configured (see below), sign-in is real
Supabase auth — create a household account first via "New household? Create
an account" on the sign-in screen.

## Deploying to GitHub Pages

This repo ships with `.github/workflows/deploy.yml`, which builds on every
push to `main` and publishes `dist/` via GitHub Pages.

1. Push this repo to GitHub.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow sets `VITE_BASE=/<repo-name>/` automatically. If you rename
   the repo, no changes are needed — it derives the base path at build time.
4. The app uses `HashRouter`, so client-side routes work correctly on Pages
   without any server rewrite rules.
5. To have the deployed site use real Supabase (not the mock-data fallback),
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository
   secrets: **Settings → Secrets and variables → Actions → New repository
   secret**, same two values as your local `.env`. Left unset, the deployed
   build just falls back to mock data, same as running locally with no `.env`.

## Environment variables

See `.env.example`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Leave these blank to run entirely on mock/local state (no backend needed).
Filled in, the app talks to that real Supabase project instead — see
[Phase 2](#phase-2-live) below for setup. Never put a Supabase
**service-role** key in frontend code — only the publishable/anon key
belongs here.

## Mock data

`src/data/mockData.ts` contains fictional sample data only:

- 3 cycles (previous, current, next), current = **25 Aug → 24 Sep 2026**
- 2 accounts (Cheque, Credit Card)
- 10 pools, including two **excluded** pools (Income, Transfers/CC Payment)
- 8 commitments
- **84 rules**, with intentionally preserved duplicates (e.g. `LEEUPOORT`
  appears more than once, and `LEEUPOORT WATER` is kept as a separate, more
  specific rule) — the UI never silently deduplicates rules
- ~26 transactions across the current and previous cycle, including several
  deliberately unmapped ones so you can see the "needs attention" flows
- 2 income sources

**Income is never hardcoded as a real figure.** Wherever a salary might
appear, the UI shows the masked placeholder `R 00 000,00`.

## Cycle logic

The budget cycle runs **25th → 24th**, and is *always* determined by date
range (`start_date <= date <= end_date`), never by calendar month. See
`src/utils/cycle.ts`:

- `cycleBoundsFor(date)` — computes the 25→24 bounds containing a date
- `isInCycle(date, cycle)` — range-based membership test
- `findCycleFor(date, cycles)` — locate the cycle for a date

## Income logic

Income is entered manually per income source (`src/pages/Settings.tsx` →
`IncomeSources`). `income_received` is intended to be derived from positive
transactions mapped to the Income pool within the active cycle (Phase 2 will
compute this against real data; the mock cycles carry illustrative
`income_expected` / `income_received` numbers so the dashboard's variance and
warning logic can be exercised without ever displaying a real number).

## Mapping order

Exactly, in this order (`src/utils/mapping.ts`):

1. **Commitment** — account-aware, cycle-aware, unpaid, case-insensitive
   "contains" match on `search_term`. A commitment can only be consumed once
   per cycle.
2. **Rule** — evaluated in ascending `priority`; first match wins;
   case-insensitive "contains". Search terms are **not** required to be
   unique, and more specific terms should be given a lower priority number so
   they're checked first (e.g. `RATES AND WATER` before `RATES`).
3. **Unmapped** — `pool_id = null` if nothing matches.

## Core calculations

All in `src/utils/calculations.ts`, guarded against divide-by-zero and
excluding `type = 'excluded'` pools from spending:

`spent_this_cycle`, `remaining`, `pct_used`, `still_to_go_off`,
`safe_to_spend`, `unbudgeted`, `unmapped_total`, `income_variance`,
`unallocated`.

**Safe to spend** = cheque balance − still-to-go-off (unpaid upcoming
commitments) − remaining budget of every `reserve_as_essential` pool. It is
**not** simply "balance minus spending so far".

## CSV import

`src/utils/csv.ts` handles real bank CSVs:

- Detects the true header row (the one mentioning Date/Amount/Description)
  and skips any junk rows before it (account holder, account number, opening
  / closing balance, etc.) — junk rows are never stored, displayed, logged,
  or counted.
- Converts dates from `DD/MM/YYYY` or Excel serial numbers to ISO.
- Duplicate detection = same date + same amount + same description; the raw
  description is preserved even after merchant cleaning
  (`src/utils/merchant.ts`).
- Runs the same commitment → rule → unmapped mapping pipeline as manual entry.

Try it with a CSV whose real header row contains columns like
`Date, Amount, Balance, Description` — a few junk rows above the header are
fine and will be ignored automatically.

## What should be reviewed before Phase 2

- Palette / type pairing (Fraunces + Inter) against your taste — the
  `SafeToSpendCard` hero is the one deliberately bold moment; everything else
  is intentionally quiet.
- Mobile bottom nav vs. desktop sidebar — check both breakpoints.
- Pool progress ring colour thresholds (`under` / `approaching` / `reached` /
  `over`) in `src/utils/calculations.ts` (`poolHealth`).
- Rule drag-and-drop reordering on `/rules` and pool drag-and-drop on
  `/pools`.
- Import wizard end-to-end with a real bank CSV export.
- Whether the mock cycle/account/pool numbers feel representative enough to
  judge the UI, given real salary and balances are intentionally never shown.

## Phase 2 (live)

The app now runs against a real Supabase project when `.env` is configured —
real email/password sign-up and sign-in (one login per household, matching
the "everyone shares one login" design), every entity persisted, and
household/profile photos uploaded to Supabase Storage. Without `.env`
configured, the app falls back to the original Phase 1 mock-data behaviour
unchanged (`isSupabaseConfigured` in `src/services/supabase.ts` is the
switch) — handy for local UI work with no backend at hand.

Setting up the database from scratch:

1. Create a free project at [supabase.com](https://supabase.com) → New project.
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**.
   Then a second query with all of `supabase/storage.sql` → **Run** (sets up
   the `avatars` Storage bucket). Both are safe to re-run.
3. **Settings → API** (or the newer **Settings → API Keys** page) → copy the
   **Project URL** and the **publishable** key.
4. Copy `.env.example` to `.env` and fill in those two values as
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

A fresh household starts genuinely empty (no seeded members/pools/etc.) — the
whole point of this rollout is letting a real family or friend group set up
their own household from scratch via Settings, not inherit demo data. New
sign-ups go through Supabase's default email-confirmation flow; if you want
frictionless testing, Supabase dashboard → **Authentication → Providers →
Email** has a toggle to disable "Confirm email".

`src/services/dataService.ts` is the seam: every function checks
`isSupabaseConfigured` and either talks to Postgres or falls back to the
original mock-clone behaviour. `src/store/AppStore.tsx` fetches everything
once per login and applies every mutation optimistically (instant locally,
persisted in the background, rolled back on failure).
