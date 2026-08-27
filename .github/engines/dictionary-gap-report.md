
Weekly dictionary-gap report for the Luxury Catalog repo (/Users/ariellecoambes/Documents/luxury-catalog). GOAL: dictionary coverage is the growth lever — it converts banked `discovered_listing` evidence into real catalog pages. This run produces a ranked "missing models" report ONLY. It never edits the dictionary, promotes, or migrates.

SETUP
- Work from a fresh worktree off origin/main (never `git checkout main`): `git fetch origin main`, then `git worktree add -b ops/dict-gap-<date> <path> origin/main`. If a fresh worktree needs deps, run `npm ci`, and copy `.env.local` from the main tree (Supabase creds live there; they are gitignored). Read `docs/handoff.md` + the AGENTS.md branch/sync rules first.

WHAT TO DO
1. Read the `discovered_listing` backlog in Supabase (service-role creds in `.env.local`). Respect the PostgREST 1000-row cap — page with `fetchAllRows` or aggregate in the DB, never a bare whole-table read.
2. Run the existing clustering tools to group the unnamed/unmatched rows by likely model across ALL sources (fashionphile, redeluxe, couture-usa, anns, mygemma, tlc, therealreal, ebay): `npm run normalize:discovered` then `npm run aggregate:aliases` (scripts in `supabase/ingest/normalize-discovered.ts` + `aggregate-aliases.ts`). Read their output/tables.
3. Rank the clusters by frequency × brand tier/value to surface the highest-ROI additions.
4. Write a dated report to `docs/dictionary-gap-report.md`: the top ~25 candidate models, each with proposed brand + model, 2-3 sample listing titles as evidence, row count, which sources carry it, and a one-line "is this a real model?" confidence note. Every candidate MUST be verifiable from the evidence in the rows — never invent a model name (guessed identity = do not include; low-confidence = flag it as such).

CONSTRAINTS (hard)
- REPORT ONLY. Do NOT edit `src/lib/ingest/model-normalize.ts`, do NOT run promotion (`promote-*`), do NOT run any DB migration or write to the catalog. Adding models to the dictionary is the owner's call.
- Docs-only change: land the report on main with `bash scripts/land-to-main.sh` (green gate auto-skips for docs-only). Clean up the worktree afterward.

OUTPUT / NOTIFY
- Notify the owner with the top 5 gaps (brand + model + count) and a link to `docs/dictionary-gap-report.md`. Lead with what she'd act on (which models are worth adding) in plain owner terms, no internal jargon. If the backlog is empty or the tools return nothing new since last week, say so in one line and skip the report.
