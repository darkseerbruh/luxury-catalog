# Object-oriented UX — the Spotify lesson for bags and brands

*Spec. Created 2026-06-27. Owner brief: "Consider how Spotify drives an object-oriented
user experience. How can we learn from and implement similar for our bags and brands?"
Reference mockups: `docs/ux/mockups/{bagdna,object,brand}.png` (rendered in the production
palette). This is a build spec, not yet shipped.*

## The principle

Spotify treats every meaningful noun as a first-class object: the song, the artist, the
composer, even "5 contributors." Each object has three parts:

1. **Identity** — art, name, a short voice-led description.
2. **A context layer** — "About the song" (dated, summarized), social proof ("152.8K monthly
   listeners"), a Follow action.
3. **Edges you can tap** — SongDNA → contributors → Explore → "Similar to," "Songs by." You
   never hit a dead end; each object hands you the next.

We already have the data for this graph. We just present it flat. On the bag page, spec values
link to a generic `/search?q=`, not to a real object. On the brand page, the "signatures"
(colours, materials, hardware, silhouettes) are plain text, not even links. The work is to
promote our best attributes to first-class objects and wire the edges between them.

## What becomes a first-class object

| Object | Data source (today) | Route | Ship phase |
|---|---|---|---|
| Bag / variant | `variant` + detail tables | `/bag/[id]` (exists) | shipped |
| House / brand | `brand` | `/brand/[id]` (exists, gets the artist-header) | Phase 2 |
| Leather / material | `material` (name, type, care, hardiness, auth notes) | `/leather/[slug]` (new) | **Phase 1** |
| Silhouette | `style.silhouette` | `/silhouette/[slug]` (new) | Phase 1 |
| Hardware | `variant.hardware_color` | `/hardware/[slug]` (new) | Phase 1 |
| Era / decade | `variant.year_start/year_end` | `/era/[decade]` (new) | Phase 2 |
| Colour | `variant.exterior_colorway` | `/color/[slug]` (new) | Phase 2 |
| Designer / creative director | **none in schema** | `/designer/[slug]` | **Blocked** (needs data) |

Leather leads because the `material` table already holds real, dated, sourceable content (care,
durability, authentication notes), so the destination page is rich on day one with zero new data.

## The three components to build

### 1. Bag DNA module (bag page) — use the cards layout
Mockup: `mockups/bagdna.png` (left). A 2-column grid of "contributor" cards, one per attribute,
each a real catalogued value linking to its object page. A texture/colour swatch stands in for a
photo (honors never-AI-images). The Designer card renders **dimmed with a "soon" tag** until we
hold the data, or is omitted entirely. Replaces the flat `LinkedSpecRow → /search` behaviour for
these high-value attributes.

### 2. Shared "Explore from here" rail — the reusable connective tissue
Mockup: `mockups/bagdna.png` (right) and `object.png`. One horizontal rail of object cards,
reused on the bag page (More from this house / More in this leather / Similar bags), the object
pages, and the brand page. Server-rendered, no client JS where avoidable. This is the single
component that makes the graph feel continuous.

### 3. Brand artist-header (brand page)
Mockup: `mockups/brand.png`. Adds, above the existing intelligence hub: a **Follow** action, a
dated **"About this house"** read, an **Explore [house]** rail, and a **Similar houses** rail
(circular tiles, Spotify artist-style). The existing stats/signatures/styles stay below.

## The object (destination) page model
Mockup: `mockups/object.png`. Every attribute page follows one template:
- **Identity** — name + a plain-language definition (define the trade term: "Caviar: Chanel's
  pressed, pebbled calfskin, more scratch-resistant than smooth lambskin").
- **A dated, hedged read** — "What we make of it," framed as an estimate with a "Our read ·
  [month year]" stamp. Ships only when it traces to real evidence (see gating).
- **Honest counts** — how many bags / houses carry it, from live catalog queries.
- **Explore rail** — bags that share this thread.
- **The shop hand-off** — "Shop [attribute] bags on the market," the monetization moment, lists
  real for-sale bags and links out to the seller.

## Routing
Give the Phase-1 attributes their own canonical, indexable URLs (this is the GEO play). Build
them server-rendered and URL-driven, the same pattern as the Articles Journal already shipped
(`?` params, zero client JS, mobile-friendly). Underneath, reuse the existing search/filter query
layer rather than new pipelines. Each `/bag/[id]` keeps its own URL; the new pages are additive.

## Data and gating rules (non-negotiable)
- **Never invent.** Every object page is built only from catalogued attributes. No fabricated
  specs, counts, or prices.
- **The "About / What we make of it" read is the highest-risk surface.** It ships per the
  factuality bar: traced to fresh evidence, dated, with n where it's a stat. The leather value
  read maps to the existing caviar-vs-lambskin analysis and is framed as an estimate, not an
  appraisal. When evidence is thin, omit the read rather than guess.
- **Social proof and follower counts are content-gated.** "1,240 follow Chanel" stays hidden
  until the count is real, same pattern as `src/lib/content-gates.ts`. No illustrative numbers in
  shipped UI.
- **Value framing is calibrated, not a verdict** ("holds well, our estimate," not "worth $X").
- **Voice gate** applies to every string: no em dashes, no empty superlatives, define jargon in
  plain words on first use.

## What each piece moves (monetization / engagement lens)
- **Bag DNA cards + Explore rail** → engagement (pages per session, lateral browse depth) and
  monetization (each object page reached carries the shop hand-off + buy/sell affiliate CTAs).
- **Attribute object pages** → GEO, the #1 growth channel: each is a new fact-dense indexable URL
  AI assistants can cite. Plus engagement.
- **Brand Follow** → engagement (return visits) and monetization (Follow feeds the price-alert
  loop, which drives outbound affiliate clicks). Requires a `follow` table (a DB migration, which
  is owner-gated to apply).
- **About cards** → GEO and trust (E-E-A-T), gated on real, dated, sourced content.

## Build order
1. **Phase 1 — SHIPPED 2026-06-27 (no migration), on branch `claude/spotify-oo-ux-bags-brands-w1lye5`, gates green (tsc/eslint/next build/448 tests), awaiting owner merge to `main`:**
   `/leather/[slug]` + `/silhouette/[slug]` + `/hardware/[slug]` object pages (shared
   `src/components/AttributeObjectPage.tsx`); the Bag DNA cards module on the bag page
   (`src/app/bag/[variantId]/BagDNA.tsx`) pointing House/Leather/Hardware/Shape at them;
   query layer `getLeatherObject` / `getSilhouetteObject` / `getHardwareObject` + `slugify`
   in `src/lib/queries.ts`. Each object page carries the bag rail + a shop hand-off into
   `/search`. Built only on data we already hold; leather pages show only real `material`
   fields (no fabricated definition); the resale read uses the curated `resale_value_impact`
   column, hedged as an estimate.
2. **Phase 2 — SHIPPED 2026-06-27 (same branch, gates green, awaiting owner merge + migration):**
   `/era/[slug]` (by production-start decade) and `/color/[slug]` object pages; Bag DNA extended
   to 6 nodes (House/Leather/Hardware/Shape/Colour/Era); brand **artist-header** with a **Follow**
   control + **Similar houses** rail (same-tier-first). Follow is backed by **migration 0032
   (`brand_follow`)** and degrades gracefully (renders nothing until the table exists; signed-out
   gets a sign-in nudge; follower count read via service-role + **content-gated at 10**, no
   fabricated proof). About this house already existed on the brand page; an Explore-styles rail
   was left out as redundant with the existing styles list. Files: `src/lib/brand-follow.ts`,
   `brand-follow-actions.ts`, `src/app/brand/[brandId]/BrandFollow.tsx`, `getColorObject`/
   `getEraObject` in `queries.ts`. **Owner action: apply `0032` via the db-migrate Action to
   activate Follow.**
3. **Blocked:** the Designer / creative-director object, until we source and store that field.

## Open dependencies
- **Follow** needs a `follow` table + RLS (migration, owner applies). Until then the brand header
  ships without the Follow action, or Follow degrades to "notify me" lead-capture.
- **Designer data** does not exist in the schema. Decide later whether to source it (research +
  store) or drop the node.
- **Similar houses / similar bags** edges: reuse the existing content-based `SimilarBags` /
  recommendation core over catalogued attributes; no new ML.
