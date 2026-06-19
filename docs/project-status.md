# Luxury Catalog — Pre-Build Status (as of 2026-06-19)

Answers to the 8 clarifying questions, grounded in the actual state of this
repo plus Arielle's connected Gmail/Drive/Figma/Miro. Where the codebase or
recent account activity settles a question, that's stated as fact with
evidence. Where it's a personal or product judgment call, it's flagged as
open.

## Technical setup & environment

**1. Mac/PC or phone-only?**
Open — not discoverable from the project. Needs Arielle's answer; Claude Code
needs a persistent local environment (or this same cloud sandbox) for a real
session, not a phone alone.

**2. Is Supabase already set up?**
Partially. The Supabase *account* was created today (`welcome@supabase.com`
"Welcome to Supabase" email, 2026-06-19 01:57 UTC), and a GitHub OAuth grant
for Supabase was authorized at the same time. No project has been created
yet, and no API keys exist anywhere in this repo — there's no `.env` file,
and `src/lib/supabase.ts:3-4` reads `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` from `process.env` with no fallback, so the
app will throw the moment it's run without them set.
The schema itself is ready to go: `supabase/migrations/0001_init_schema.sql`
defines all 15 tables (brand, style, variant, production_record, material,
price_history, etc.) but it has never been applied — there's no project to
apply it to yet.
**Net: account exists, project + keys + schema apply are still to-do.**

**3. Is Vercel connected to luxurycatalog.com, or from scratch?**
Also partial, also from today. A Vercel account was created and signed in
(`notifications@vercel.com`, 02:00 UTC) and authorized as a third-party
GitHub App (`noreply@github.com`, 02:00 UTC) — so Vercel can see this repo,
but there's no `vercel.json` or `.vercel/` directory, meaning no project has
actually been linked/deployed yet.
The domain `luxurycatalog.com` lives in Squarespace Domains (migrated from
Google Domains in April 2024, auto-renews ~Aug 9 each year). Today Arielle
added email forwarding for `hello@luxurycatalog.com` and
`arielle@luxurycatalog.com` → her Gmail, but the verification emails for both
(01:14-01:15 UTC) don't appear confirmed yet — she sent two test emails to
those addresses ("do you work?", "hiii") that haven't gotten a reply, which
is consistent with forwarding not being live yet.
**No DNS records point the domain at Vercel — that link is still a to-do.**

## Scope for this session

**4. Definition of "working website"?**
Open / product decision. Current reality: `src/app/page.tsx` is still the
unmodified `create-next-app` landing page — no catalog UI, no search, no
data-fetching exists yet. Whether "done" means a functional MVP with real
search or a scaffold + 2-3 seeded bags is not fixed by anything in the repo;
whoever writes the next session prompt needs to decide this.

**5. Which brands/bags to seed at launch?**
Open / product decision, but here's the relevant history:
- The original Feb 2022 project proposal (Gmail thread "Arielle Coambes
  proposal info" with `info@codestorm.app`) scoped scraping to **Chanel,
  Hermès, and Louis Vuitton, 2010–present**, sourced from official brand
  sites plus resellers (Fashionphile, TheLuxuryCloset, TheRealReal).
- What's actually sitting in Drive right now (downloaded yesterday,
  2026-06-18 ~23:51-23:52 UTC) is two full multi-brand reseller exports:
  `therealreal_data-1.csv` (1.6 MB) and `theluxurycloset_data.csv` (38.7 MB).
  These aren't brand-filtered — they're general resale catalogs that should
  include Coach alongside the others, but the file is too large to safely
  pull into context to confirm row-by-row.
Bottom line: no asset currently fixes the brand list at "10-12" vs.
"Coach + 1-2" — that's still Arielle's call.

## Existing assets

**6. Are the 2022 designs accessible?**
Yes — confirmed directly. An earlier pass through the Figma MCP's `whoami`
(account/team connected, but no file listing capability) and a Drive
full-text search for `figma.com` turned up nothing, so the first version of
this doc concluded no Figma file existed and pointed to a Miro board
instead. Arielle then supplied the actual file link directly
(`https://www.figma.com/design/hyyoOUbE0Sz9GYR4gzjzMi/The-Luxury-Catalog`),
which the Figma MCP confirms is real and far more complete than the Miro
board. It's a single-page, high-fidelity mobile app design ("The Luxury
Catalog") covering:
- **Home** — hero ("The Luxury Catalog knows style."), search entry, an
  "It bags of all time" carousel (Chanel Classic Medium Double Flap, Hermès
  Kelly Sellier 28cm/30cm, Hermès Birkin Sellier 35cm, Louis Vuitton
  Neverfull mm — each with resale price range, rating, and review count),
  an empty-state "Your closet," "Bags by brand" (Chanel live, others
  "Coming soon" / "Vote to prioritize this brand"), "Bags by what they fit"
  (cell phone / tablet or book / laptop & more), and "Bags by how they're
  carried" (shoulder, top handle, crossbody, backpack, belt bag, wallets &
  pouches & clutches, rolling luggage).
- **Search** — two depths: brand-level (e.g. "Chanel," 243 results) and
  style-level (e.g. "Chanel 19," 12 results down to specific SKUs like
  "Chanel 19 Wallet on Chain WOC").
- **Item summary** (product detail) — five frames, the most complete being
  **Chanel 19 Flap Bag, Medium**: size variations (Waist bag / Wallet on
  chain / Medium / Large / Maxi), material variations grouped by category
  (Leathers, Tweeds), Year/Color/Hardware/Material attributes, a reviews
  section, Durability/Occasion/"Worth it?"/"Got it from, for..." fields, and
  an Authenticity block still marked **"TBD"** — i.e. authentication content
  is a known design gap, not just a data gap.
- **Submit a review**, **Onboarding**, **Profile & Closet**, **Settings &
  Account**, and **Plan selector** (subscription/paywall) — laid out as
  frames but not yet detailed with content (no child elements under them).
- **Brand kit** — an actual design system: type pairing (Poppins sans for
  headline/subhead/eyebrow/body; Playfair Display + Cormorant serif as the
  alternate pairing), a color palette, button styles, textures, and a full
  product taxonomy (Bags/luggage/wallets, Fashion, Shoes, Jewelry,
  Accessories, Eyewear, Watches, Fragrance, Face/Skincare/Makeup) with
  bag-specific facets by strap type and by size (XS/S/M/L/XL+) — this
  taxonomy is broader than the 15-table schema currently covers (which is
  handbags-only).
- A **"Customer journey"** area simulating external touchpoints (an ad, a
  Google search result, a social media post) that lead a user into the app.
The Miro board (`https://miro.com/app/board/o9J_lvTNUfo=/`, still real and
still useful for the IA-to-schema mapping) reads as the earlier ideation
pass; this Figma file is the polished, much more complete UI source of
truth. Also still on file from the original Feb 2022 proposal email: three
PNG screenshots described there as wireframes — superseded by both of the
above.
**Net: a real, substantial Figma file exists and is the primary design
reference.** Whoever picks this up should build against
`The-Luxury-Catalog` Figma file first, using the Miro board only for the
underlying data-model/IA cross-check.

**7. Are the two CSV datasets downloaded locally, or only in Drive?**
Confirmed: Drive only, not local. `therealreal_data-1.csv` and
`theluxurycloset_data.csv` both live in the same Drive folder as a
`Luxury catalog.jpg` reference image, all created within the same hour
yesterday (2026-06-18, 22:45-23:52 UTC). A filesystem search of this
environment found no matching CSVs locally — they'd need to be downloaded
(or read directly from Drive) before any seeding/import work.

## Constraints

**8. Rough timeline?**
Open — not discoverable from the project. Needs Arielle's answer.

## Summary: what's actually ready right now

| Piece | State |
|---|---|
| Next.js app | Default `create-next-app` scaffold, unedited |
| Supabase | Account created today; no project, keys, or applied schema |
| DB schema | Fully written (`supabase/migrations/0001_init_schema.sql`, 15 tables), never applied |
| Vercel | Account created + GitHub-linked today; no project deployed |
| Domain | `luxurycatalog.com` on Squarespace; email forwarding just added, not yet verified; no DNS → Vercel |
| Design reference | High-fidelity Figma file "The Luxury Catalog" (Home, Search, Item summary, Brand kit design system, etc.); Miro board "Luxury catalog" backs the IA |
| Data | Two large multi-brand reseller CSVs in Drive, unprocessed |

Still genuinely blocked on Arielle: device/environment (Q1), MVP scope
definition (Q4), brand list for launch (Q5), and timeline (Q8). Everything
else above is now a fact, not a guess.
