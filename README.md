# Remote Roles — Programmatic SEO Job Board

Automated remote-jobs directory. A daily GitHub Action pulls listings into
Supabase; Next.js serves them as statically-generated, ISR-revalidated pages.
Goal: build pSEO traffic, then monetize via Google AdSense.

## 📍 Status (update this every session — read this first)

**Last updated:** 2026-09-12

**Repo:** https://github.com/eanxzii2503/pseo-jobs.git (remote already configured
locally as `origin`, but not pushed yet as of last update — the AI sandbox that
prepped this repo has no internet access, so the push has to be run from your
own machine: `git add -A && git commit -m "..." && git push -u origin main`,
using a GitHub Personal Access Token as the password if prompted).

**Confirmed:** the `remote_jobs` table already exists live in Supabase and
matches `supabase/schema.sql` exactly (verified 2026-09-12) — schema step is
done, don't re-run it.

**Done:**
- Full app built: `app/page.tsx` (listing), `app/remote-jobs/[slug]/page.tsx`
  (detail), sitemap, robots, Supabase schema + RLS, sync script.
- `.env.local` filled in — Supabase project already created and connected.
- Local git repo initialized, 1 commit (`Initial commit: pSEO job board`).
- `.github/workflows/daily-sync.yml` exists (daily cron + manual trigger).
- Ad slots are **placeholders only** (`AdSlot` component in `app/page.tsx`,
  `min-h-[250px]` divs) — no real AdSense script/`<ins>` tag wired in yet.

**NOT done yet:**
- [ ] Repo not pushed to GitHub yet.
- [ ] Not deployed to Vercel yet.
- [ ] Env vars not added to Vercel project settings yet.
- [ ] Never run `npm run sync-jobs` for real yet — Supabase table is likely
      still empty. Run this once locally (or trigger the Action manually)
      before checking the live site, or every page will look empty.
- [ ] Not applied to Google AdSense yet. AdSense requires a **live** site
      with real content and some traffic history before approval — can't
      apply meaningfully until deployed and the DB is populated. Apply only
      after the site is live at its real domain.
- [ ] After AdSense approval: swap the placeholder `AdSlot` divs in
      `app/page.tsx` for real `<ins class="adsbygoogle">` tags + the
      AdSense loader script in `app/layout.tsx`. Keep the `min-h-[250px]`
      sizing — that's what keeps CLS low, don't remove it.

**Next action for whoever picks this up:** push to GitHub → import into
Vercel → add the 5 env vars from `.env.local` to Vercel → run the sync →
verify the live site shows jobs → then start the AdSense application.

**Rule for future sessions:** whenever a decision changes or a step gets
done, update this Status section (move the item, add new TODOs) *before*
running out of context, so the next session/AI doesn't have to re-derive
project state from scratch.

## Stack
- Next.js 14 (App Router, ISR)
- Supabase (Postgres) — free tier
- GitHub Actions — daily cron sync, no server to keep running
- Tailwind CSS

## Setup

1. **Create the database.** In the Supabase SQL editor, run `supabase/schema.sql`.
   This creates the `remote_jobs` table, indexes, an `updated_at` trigger, and a
   read-only Row Level Security policy for the anon key.

2. **Install dependencies.**
   ```bash
   npm install
   ```

3. **Environment variables.** Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project settings, used client-side by the app (RLS keeps this read-only).
   - `NEXT_PUBLIC_SITE_URL` — your production domain, used by the sitemap.
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — used **only** by `scripts/sync-jobs.js`. Never expose these to the browser or commit them.

4. **First data sync (local test):**
   ```bash
   npm run sync-jobs
   ```

5. **Run locally:**
   ```bash
   npm run dev
   ```

6. **Deploy to Vercel** (free Hobby plan) and add the same env vars there.

7. **Automate the sync.** In your GitHub repo, add `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` as Actions secrets. `.github/workflows/daily-sync.yml`
   runs the sync every day at 00:00 UTC, or on demand via "Run workflow".

## What was changed from the original spec

- **`scripts/sync-jobs.js`** was calling `fetch('https://remotive.com')`, which
  returns the marketing homepage HTML, not JSON — `data.jobs` would always be
  undefined and the script would silently do nothing. Fixed to call the real
  endpoint, `https://remotive.com/api/remote-jobs`.
- Upserts are now **batched** (500 rows/call) instead of one call for the
  entire dataset, since a single huge payload is more likely to hit
  PostgREST/Supabase request-size limits as the dataset grows.
- Slugs now include the provider's job id, so two postings with an identical
  title/company/location (more common than you'd think) never collide on the
  unique `slug` column.
- Added an explicit **Row Level Security** read-only policy — the frontend
  uses the anon key, so RLS should be the thing stopping writes, not just
  "the anon key happens not to be used for writes."
- Job descriptions come from a third-party API. Before enabling
  `dangerouslySetInnerHTML` in production, sanitize `description` server-side
  (e.g. with `isomorphic-dompurify`) — rendering raw third-party HTML directly
  is an XSS risk if the provider's data is ever compromised or malformed.
- Ad and affiliate slots are fixed-height (`min-h-[250px]`) placeholders so
  they don't shift layout once ad scripts load (this is what actually keeps
  CLS low, not any particular ad network setting).

## Staying on free tiers
- Supabase free tier: 500 MB DB / 5 GB egress per month. A few thousand job
  rows is a few MB; the ISR cache means Vercel serves most requests from its
  edge cache rather than hitting Supabase on every page view.
- Vercel Hobby: 100 GB bandwidth/month, native ISR support.
- GitHub Actions: cron jobs on public repos are free; private repos get a
  generous monthly minute allowance more than sufficient for a once-daily sync.
