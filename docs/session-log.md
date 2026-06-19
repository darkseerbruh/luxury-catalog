# Luxury Catalog — Session Log

## 2026-06-19 — Phase 1: Infrastructure

**Done:**
- Local toolchain installed (this machine had no Node/npm at session start): nvm + Node 22.23.0 + Supabase CLI 2.107.0
- Linked Supabase project `pewmdztviyrtbhtebcct`; migration `0001_init_schema.sql` confirmed applied — all 15 tables live and reachable via REST
- `npm install` and `npm run build` both pass clean (Next.js 16.2.9, Turbopack)
- Downloaded `therealreal_data-1.csv` into `data/raw/` via Drive MCP
- Added `SUPABASE_ACCESS_TOKEN` to `.env.local` (gitignored, not committed) for future CLI use

**Open / blocked:**
- Vercel project not yet linked/deployed — Arielle has the import screen open, walking through env var setup
- `npm run dev` not yet verified running live in this session (build passes, which exercises the same code path)

**Data finding (important for Phase 2 planning):**
- `theluxurycloset_data.csv` (38.7 MB) exceeds Drive MCP's 10 MB raw-download limit. Pulled it as a Google Sheet export instead (`read_file_content`), which truncates at ~130k chars — recovered 63 usable rows, saved as `data/raw/theluxurycloset_data_partial.csv`. This is a small sample, not the full sheet.
- Brand coverage in *both* CSVs (the partial LuxuryCloset sample and the full 1,998-row TheRealReal export) is almost entirely **Louis Vuitton, Chanel, Hermès** — zero rows for Coach, Kate Spade, Burberry, Gucci, Prada, Fendi, Celine, Dior, or Bottega Veneta.
- **Plan adjustment:** breadth seeding for LV/Chanel/Hermès can draw from the CSVs; breadth for the other 7-9 brands (especially Coach, which the brief marks non-negotiable) will need hand-built sparse stub records from targeted web research instead, since no CSV data exists for them.

**Note on toolchain:** Node/npm were missing from this machine entirely; installed via nvm rather than Homebrew (brew also not present). Future sessions on this machine should `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"` before running node/npm — it's not on PATH by default in non-interactive shells.
