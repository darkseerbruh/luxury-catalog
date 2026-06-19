# Luxury Catalog — Handoff Document
*Written 2026-06-19, end of build session. Read this before doing anything in the next session.*

---

## What exists right now

The app is fully built and deployed on Vercel. Everything works. The only outstanding item is pointing `luxurycatalog.com` at Vercel — the site currently lives at:

**`luxury-catalog-omega.vercel.app`** (production, live)

---

## What was built (this session)

| Phase | What | Status |
|---|---|---|
| 1 | Supabase project + 15-table schema applied; Vercel project deployed | Done |
| 2 | 12 brands, 204 styles, 190+ variants seeded; 5 hero styles with researched authentication data | Done |
| 3 | Design system (dark luxury palette, Poppins + Playfair Display); Home `/`, Search `/search`, Item Detail `/bag/[variantId]` | Done |
| 4 | Camera identification tool `/identify` — photo → Claude vision → catalog match | Done |
| 5 | Brand pages `/brand/[brandId]`, browse by carry `/browse/carry/[type]`, browse by fits `/browse/fits/[item]`, all home tiles linked, footer | Done |
| 6 | Deployment to Vercel production, env vars set, session log finalized | Done |

---

## The one outstanding item: DNS

`luxurycatalog.com` still points nowhere. The domain is registered at Squarespace Domains.

### What needs to happen

**Step 1 — Add the domain in Vercel**

The "Add Domain" button wasn't showing in the last session (Vercel UI issue — may have been a plan/permissions display bug). Try again:

1. Go to **vercel.com** → sign in → open **luxury-catalog** project
2. In the left sidebar click **Domains** (under CDN, above Connect)
3. Click **Add Domain**
4. Add `luxurycatalog.com` and `www.luxurycatalog.com`
5. Vercel shows you DNS records — note them down (you need the A record IP and CNAME value)

If the button still doesn't appear, try navigating directly to:
`vercel.com/[your-username]/luxury-catalog/settings/domains`

**Step 2 — Update DNS at Squarespace**

1. Go to **domains.squarespace.com** → sign in → click **luxurycatalog.com** → **DNS Settings**
2. Delete any existing A record for `@` and CNAME for `www`
3. Add:
   - Type **A**, Host `@`, Value `76.76.21.21` *(verify against what Vercel showed you)*
   - Type **CNAME**, Host `www`, Value `cname.vercel-dns.com.`
4. Save

**Step 3 — Wait**

15–60 minutes for DNS to propagate. In Vercel → Domains, watch for the green "Valid Configuration" checkmark.

**Step 4 — Check email forwarding**

After DNS propagates, send a test email to `hello@luxurycatalog.com` and confirm it arrives in Gmail. If not, the MX records got wiped — re-add them in Squarespace DNS:
- Type **MX**, Host `@`, Value `fwd1.squarespace.com.`, Priority `10`
- Type **MX**, Host `@`, Value `fwd2.squarespace.com.`, Priority `20`

---

## Accounts and credentials

| Service | What it's for | Where to find credentials |
|---|---|---|
| Supabase | Database (`pewmdztviyrtbhtebcct`) | supabase.com dashboard |
| Vercel | Hosting | vercel.com, team `darkseerbruh` |
| Anthropic | Camera tool API | console.anthropic.com |
| Squarespace Domains | `luxurycatalog.com` DNS | domains.squarespace.com |

**Vercel env vars already set:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

---

## Active branch

All code is on: **`claude/desktop-display-test-d621oc`** in `darkseerbruh/luxury-catalog` on GitHub.

`main` is the old empty scaffold — ignore it.

---

## What to work on next (after DNS)

These are the highest-value things not yet built, in priority order:

1. **More authentication data** — the 5 hero styles (Chanel Classic Flap, Hermès Birkin, Hermès Kelly, Coach Tabby, Coach Swagger) have real data but many fields are still null. Incrementally filling these in as research improves is the core ongoing work.

2. **Natural language search** — `/search` currently uses `ilike` substring matching. The product brief calls for Claude-powered natural language search ("structured black bag under 10 inches wide"). The `searchCatalog()` function in `src/lib/queries.ts` is the right place to add this — parse the query with Claude first, then use the structured result to build the Supabase query.

3. **`searched_not_found` dashboard** — the database logs every search that returns no results (including camera tool misses). Building a simple admin view of this table shows exactly what users are looking for that isn't in the catalog yet — the data roadmap writes itself.

4. **More brands at depth** — the 9 non-hero brands (LV, Kate Spade, Burberry, Gucci, Prada, Fendi, Celine, Dior, Bottega Veneta) are stubs only. Each one needs a research pass like the hero styles got.

5. **User feedback loop** — the `user_feedback` table exists in the schema. A simple "Is this information accurate?" button on each bag detail page (`/bag/[variantId]`) feeds the research prioritization loop.

---

## Non-negotiable constraints (from product brief)

- **Never invent authentication markers, date codes, serial formats, or hardware details.** Leave null + `confidence_level: low` if unverifiable.
- **No photos in v1** — text-first, legal question on image rights unresolved.
- **Catalog is always free** — no paywall on content.
- **Coach must be in the catalog** — it's the viral thrift-store acquisition engine.
- **Mobile-first** — every page must work at 375px width.

---

## Key files

| File | What it does |
|---|---|
| `src/app/page.tsx` | Home page |
| `src/app/search/page.tsx` | Search page |
| `src/app/bag/[variantId]/page.tsx` | Item detail page |
| `src/app/identify/page.tsx` | Camera tool UI (client component) |
| `src/app/api/identify/route.ts` | Camera tool API (calls Anthropic) |
| `src/app/brand/[brandId]/page.tsx` | Brand page |
| `src/app/browse/carry/[carryType]/page.tsx` | Browse by carry style |
| `src/app/browse/fits/[item]/page.tsx` | Browse by what fits |
| `src/lib/queries.ts` | All Supabase query functions |
| `src/lib/supabase.ts` | Supabase client (lazy singleton) |
| `src/app/globals.css` | Design system tokens (colors, fonts) |
| `src/app/layout.tsx` | Root layout (header + footer) |
| `supabase/migrations/0001_init_schema.sql` | Full 15-table schema |
| `supabase/seed/seed-hero-styles.ts` | Hero style seed script (idempotent) |
| `supabase/seed/seed-breadth.ts` | Breadth data seed script |
| `docs/product-brief.md` | Product vision — source of truth for decisions |
| `docs/deployment-checklist.md` | Vercel + DNS go-live steps |
