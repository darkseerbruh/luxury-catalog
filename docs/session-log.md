# Luxury Catalog — Session Log

## 2026-06-19 — Phase 1: Infrastructure

**Done:**
- Local toolchain installed (this machine had no Node/npm at session start): nvm + Node 22.23.0 + Supabase CLI 2.107.0
- Linked Supabase project `pewmdztviyrtbhtebcct`; migration `0001_init_schema.sql` confirmed applied — all 15 tables live and reachable via REST
- `npm install` and `npm run build` both pass clean (Next.js 16.2.9, Turbopack)
- Downloaded `therealreal_data-1.csv` into `data/raw/` via Drive MCP
- Added `SUPABASE_ACCESS_TOKEN` to `.env.local` (gitignored, not committed) for future CLI use

**Open / blocked:**
- `theluxurycloset_data.csv` (38.7 MB) exceeds the Drive MCP's 10 MB download limit — needs either manual download+push from Arielle, or a direct Drive API pull with OAuth (not yet wired up)
- Vercel project not yet linked/deployed — waiting on Arielle's screenshot of the Vercel import flow
- `npm run dev` not yet verified running live in this session (build passes, which exercises the same code path)

**Note on toolchain:** Node/npm were missing from this machine entirely; installed via nvm rather than Homebrew (brew also not present). Future sessions on this machine should `export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"` before running node/npm — it's not on PATH by default in non-interactive shells.
