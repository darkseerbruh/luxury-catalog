# Luxury Catalog — Session Log

## 2026-06-19 — Phase 1: Infrastructure

**Done:**
- Local toolchain installed (this machine had no Node/npm at session start): nvm + Node 22.23.0 + Supabase CLI 2.107.0
- Linked Supabase project `pewmdztviyrtbhtebcct`; migration `0001_init_schema.sql` confirmed applied — all 15 tables live and reachable via REST
- `npm install` and `npm run build` both pass clean (Next.js 16.2.9, Turbopack)
- Downloaded `therealreal_data-1.csv` into `data/raw/` via Drive MCP
- Added `SUPABASE_ACCESS_TOKEN` to `.env.local` (gitignored, not committed) for future CLI use

**Done (cont.):**
- Vercel project deployed: https://luxury-catalog-qiu3ovzqt-luxury-catalog.vercel.app (env vars set, Vercel Authentication disabled for public access, confirmed 200 + real HTML response)

**Open:**
- `npm run dev` not yet verified running live in this session (build passes, which exercises the same code path)
- Custom domain (luxurycatalog.com) not yet pointed at Vercel — deferred to Phase 6 per plan

## 2026-06-19 — Phase 2: Data Seeding

**Done:**
- 5 hero styles researched via parallel web-research agents and seeded: Chanel Classic Flap (Medium, Black Caviar, GHW), Hermès Birkin (30 + 35, Togo, GHW), Hermès Kelly (Sellier 28, Epsom), Coach Tabby (Shoulder Bag 26, leather + signature canvas), Coach Swagger (27). Research notes/sources in `supabase/seed/research/*.json`.
- Authentication-data-integrity rule followed throughout: every unverifiable authentication marker, date code detail, or measurement was left `null` with `confidence_level: low` rather than guessed. Several research agents also flagged and corrected an inconsistency in the original schema doc's Chanel Series-25 hologram year range (doc said 2018-2021 for that specific series code; corroborated sources narrow it to 2018) — noted in the seed data's `correction_note` field, not silently overwritten.
- Breadth data seeded for all 12 target brands: Chanel/Louis Vuitton/Hermès breadth from the legacy CSVs (183 sparse style+variant rows, `confidence_level: low`, sourced from 2022 reseller exports), plus Coach/Kate Spade/Burberry/Gucci/Prada/Fendi/Celine/Dior/Bottega Veneta with stub styles using well-known flagship style names (public knowledge — no fabricated authentication or production detail).
- End-to-end sanity check passed: Chanel Classic Flap retrievable via a single joined query (variant → style → brand → production_record).

**Final row counts:** 12 brands, 204 styles, 190 variants, 34 materials, 5 production records, 5 known color combinations, 20 carry methods, 3 fits, 7 interior storage records, 7 serial tags, 5 lock/key records, 10 provenance/packaging records.

**Seed scripts (re-runnable, version controlled):**
- `supabase/seed/materials.ts` — base material list
- `supabase/seed/seed-hero-styles.ts` — loads `research/*.json` into all 15 tables; clears + re-inserts variants per style on each run, so it's idempotent
- `supabase/seed/seed-breadth.ts` — CSV-derived + stub breadth records
- Run order: `npx tsx supabase/seed/materials.ts && npx tsx supabase/seed/seed-hero-styles.ts && npx tsx supabase/seed/seed-breadth.ts` (needs `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"` first on this machine since Node isn't on the default PATH)

**Known gaps for future sessions:**
- Most authentication-critical fields for Birkin/Kelly/Swagger/Tabby are sparse/null by design — the brief's accuracy-over-completeness rule means real research depth will need to grow incrementally, likely informed by `searched_not_found` data once the product has real traffic
- Breadth styles for Kate Spade/Burberry/Gucci/Prada/Fendi/Celine/Dior/Bottega Veneta are stubs only (style name + brand, no variants) — flagged in their `description` field for a future deep-research pass

**Data finding (important for Phase 2 planning):**
- `theluxurycloset_data.csv` (38.7 MB) exceeds Drive MCP's 10 MB raw-download limit. Pulled it as a Google Sheet export instead (`read_file_content`), which truncates at ~130k chars — recovered 63 usable rows, saved as `data/raw/theluxurycloset_data_partial.csv`. This is a small sample, not the full sheet.
- Brand coverage in *both* CSVs (the partial LuxuryCloset sample and the full 1,998-row TheRealReal export) is almost entirely **Louis Vuitton, Chanel, Hermès** — zero rows for Coach, Kate Spade, Burberry, Gucci, Prada, Fendi, Celine, Dior, or Bottega Veneta.
- **Plan adjustment:** breadth seeding for LV/Chanel/Hermès can draw from the CSVs; breadth for the other 7-9 brands (especially Coach, which the brief marks non-negotiable) will need hand-built sparse stub records from targeted web research instead, since no CSV data exists for them.

**Note on toolchain:** Node/npm were missing from this machine entirely; installed via nvm rather than Homebrew (brew also not present). Future sessions on this machine should `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"` before running node/npm — it's not on PATH by default in non-interactive shells.
