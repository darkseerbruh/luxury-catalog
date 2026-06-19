# Cloud Session Handoff

*Written 2026-06-19, end of a local session that completed Phases 1-2. Read this in full before doing anything — it tells you exactly what's done, what's next, and how to bootstrap an environment with zero shared history with the session that wrote this.*

If you're a fresh Claude Code session picking this up, also read (in this order):
1. This file
2. `docs/product-brief.md` — product vision, personas, constraints (source of truth for product decisions)
3. `docs/database-schema.md` — the 15-table schema, field-by-field
4. `docs/session-log.md` — chronological log of what's been done each phase, with caveats
5. `AGENTS.md` (repo root) — this Next.js version (16.2.9) has breaking changes from training-data assumptions; read `node_modules/next/dist/docs/` before writing Next.js code

The original session brief (phased plan, Arielle's notification protocol, definition of done) was pasted directly into the previous session's chat, not saved as a file. The phases below summarize it; if you need the verbatim original, ask Arielle — she has it.

---

## Where things stand

**Branch:** `claude/desktop-display-test-d621oc` on `darkseerbruh/luxury-catalog` (GitHub). This is the active build branch — confirmed by Arielle, not `main` (which is stale, just the original `create-next-app` scaffold).

**Phase 1 (Infrastructure): done.**
- Supabase project `pewmdztviyrtbhtebcct` — all 15 tables applied via `supabase/migrations/0001_init_schema.sql`
- Vercel project `luxury-catalog` (team `luxury-catalog`) deployed and publicly reachable (Vercel Authentication/SSO wall disabled in Project Settings → Deployment Protection)
- Latest known live URL: `https://luxury-catalog-qiu3ovzqt-luxury-catalog.vercel.app` — **this will go stale**; check the Vercel dashboard for the current deployment URL rather than trusting this one blindly
- Production Branch setting in Vercel did not surface in the UI when looked for — current deploys are previews per-push, not a fixed production domain yet. Custom domain (luxurycatalog.com, on Squarespace) is not yet pointed at Vercel — that's Phase 6 work.

**Phase 2 (Data Seeding): done.**
- 5 hero styles seeded with researched authentication data: Chanel Classic Flap (Medium/Black Caviar/GHW), Hermès Birkin (30 + 35, Togo, GHW), Hermès Kelly (Sellier 28, Epsom), Coach Tabby, Coach Swagger
- Breadth data for all 12 target brands (Chanel, Louis Vuitton, Hermès, Coach, Kate Spade, Burberry, Gucci, Prada, Fendi, Celine, Dior, Bottega Veneta)
- Current row counts: 12 brands, 204 styles, 190 variants, 34 materials, 5 production records, 5 known color combinations, 20 carry methods, 3 fits, 7 interior storage, 7 serial tags, 5 lock/key, 10 provenance/packaging records
- Full detail and known gaps: see `docs/session-log.md`

**Phase 3 (Core UI) is next**, not started: design system (Tailwind config, Poppins + Playfair Display via `next/font`, dark luxury palette with gold accent), then Home → Search → Item Detail pages in that order. See the original phased plan summary below if you don't have it from elsewhere.

---

## Environment bootstrap (do this first in a fresh cloud sandbox)

The previous session ran on Arielle's personal MacBook, which had **no Node, npm, or Supabase CLI installed at all**. Your cloud sandbox may or may not be the same — check before reinstalling.

```bash
# 1. Clone and checkout the right branch
git clone https://github.com/darkseerbruh/luxury-catalog.git
cd luxury-catalog
git checkout claude/desktop-display-test-d621oc

# 2. If node/npm missing:
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh -o /tmp/nvm_install.sh
bash /tmp/nvm_install.sh
export NVM_DIR="$HOME/.nvm"; \. "$NVM_DIR/nvm.sh"
nvm install 22

# 3. Install project deps (includes tsx, dotenv, csv-parse already in package.json devDependencies)
npm install

# 4. Supabase CLI (if missing)
npm install -g supabase
supabase link --project-ref pewmdztviyrtbhtebcct
```

**Important:** in non-interactive/non-login shells, `node`/`npm`/`supabase` may not be on `PATH` even after `nvm install` — you may need to re-run the `export NVM_DIR...` line at the start of every shell command/session.

### Recreating `.env.local` (gitignored — does not come with the repo clone)

Create `luxury-catalog/.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard → Project Settings → API → Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same page → anon/publishable key>
SUPABASE_SERVICE_ROLE_KEY=<same page → service_role/secret key>
SUPABASE_ACCESS_TOKEN=<only needed if you'll run supabase CLI commands like db push — generate at supabase.com/dashboard/account/tokens>
```

All of these are also visible in **Vercel → luxury-catalog project → Settings → Environment Variables** (minus the access token, which is CLI-only and wasn't added there). If you don't have dashboard access, ask Arielle — she has logins to both.

Do not commit `.env.local`. Do not put real secret values into any file that gets committed to git, including this one.

### Verify the bootstrap worked

```bash
npm run build          # should compile clean
supabase migration list  # should show 0001 applied both locally and remotely
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/brand?select=name" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"   # should return 12 brand names
```

---

## Seed scripts (already run once — re-run only if you need to reset/extend data)

```bash
npx tsx supabase/seed/materials.ts
npx tsx supabase/seed/seed-hero-styles.ts   # idempotent: clears + re-inserts variants per style each run
npx tsx supabase/seed/seed-breadth.ts
```

Research source files for the 5 hero styles are in `supabase/seed/research/*.json` — each has a `sources` array and per-field `confidence_level`. If you're extending hero-style data, edit/add to these JSON files and re-run `seed-hero-styles.ts` rather than hand-writing SQL.

---

## Non-negotiable constraints (from `docs/product-brief.md` — read that file for full context)

- **Never invent authentication markers, date codes, serial formats, or hardware details.** Leave null + `confidence_level: low` if unverifiable. This was followed strictly in Phase 2 — expect plenty of honest nulls in the seeded data, that's intentional, not a bug.
- **No AI-generated images anywhere**, especially not in the camera/authentication tool (Phase 4).
- **No photos at all in v1** — text-first, legal question on image rights unresolved.
- **Catalog is always free** — no paywall on content, ever.
- **Measurements stored in cm internally**, displayed in inches for imperial users; brand size labels (e.g. "Birkin 30") are never converted.
- **Coach must be in the catalog** — it's the viral/thrift-store acquisition engine, not optional.
- **Mobile-first** — the camera tool's primary use case is a phone in a thrift store. Every page must work at 375px width.

## Notification protocol

Arielle is the product owner, non-engineer, monitoring from her phone. Keep messages to her rare, specific (include live URLs, what changed, what's next), and free of design/copy approval requests — she only wants to be asked about things you genuinely cannot resolve from the docs (missing credentials, true 50/50 product calls, build-breaking errors you're stuck on).

## Remaining phases (summarized — verify against the original prompt with Arielle if anything is ambiguous)

3. **Core UI** — design system, Home (`/`), Search (`/search`, AI-powered via Anthropic API), Item Detail (`/bag/[variantId]`, tabbed: Overview/Authentication/Carry & Fit/Price History)
4. **Camera tool** (`/identify`) — photo → Anthropic API → structured ID → deep-link to catalog or "not found" log
5. **Browse UI + polish** — `/browse/carry/[carryType]`, `/browse/fits/[item]`, `/brand/[brandId]`, nav/footer, responsive + accessibility QA
6. **Deployment + handoff** — production env var check, `npm run build` clean, DNS cutover instructions for luxurycatalog.com → Vercel, final `docs/session-log.md` update

Update `docs/session-log.md` at the end of each phase, same format as the existing entries, so the next handoff (cloud or otherwise) stays current.
