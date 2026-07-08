# Handoff: fix LC Index accuracy (needs live DB access)

*Created 2026-07-08 by the cloud session that built the LC Index. This work needs to read the
production database (comps + the distribution of recorded-price counts), which the cloud
container cannot reach. A LOCAL session with `.env.local` (real `NEXT_PUBLIC_SUPABASE_*`) should
execute this. Spec: `docs/ux/lc-index-spec.md`. Engine: `src/lib/lc-index.ts`. RPC:
`supabase/migrations/0048_style_index_signals.sql`.*

## The situation

The LC Index shipped and is live on `/rankings`, computed from real data, and the owner spotted
that the top of the list is wrong. Two independent bugs plus a copy gap. Fix all three, validate
against the real top 20, then land + apply the migration.

Owner's exact observations (2026-07-08):
- **Kelly Pochette is #1.** Impossible. A pochette cannot out-price a Birkin. Its comps must be
  contaminated (its median is far too high).
- **"Cocoa Base shopping bag" is #9 with 33 prices.** Owner does not recognise the name, likely a
  scrape-artifact style. Thin data + probably bad comps.
- **The Birkin median showed ~$1,700** (flagged by the cloud session). Also impossible, contamination.
- **Too few recorded prices are ranking.** Pochette at 53, Cocoa bag at 33. Needs a real floor.
- **The why-note repeats** "Priced above most of the catalog" over and over. Owner wants a custom,
  differentiated, SHORT why per bag.

## Bug 1 — contaminated per-style medians (DATA, the big one)

A median ignores a few outliers by construction, so a wrong median means MOST of a style's comps
are wrong. Likely causes, in order of suspicion:
1. **Mixed currencies pooled unconverted.** `style_index_signals()` takes `percentile_cont(0.5)`
   over raw `sale_price` across ALL a style's variants with NO currency handling. If a style's
   comps mix USD/EUR/GBP (or worse), the median is meaningless. This is a real flaw in the RPC.
2. **Mislabeled listings mapped to the wrong style** (e.g. a full Kelly ingested under "Kelly
   Pochette", or accessories/SLGs under "Birkin" dragging it to $1,700).
3. **Scrape-artifact styles** ("Cocoa Base shopping bag") that should not be in the catalog at all.

### Diagnose first (write a throwaway `scripts/diagnose-lc-index.ts`, tsx)
Query the prod DB (anon client via `src/lib/supabase.ts`, or REST) and print:
- `select * from style_index_signals()` ordered by the computed rank (reuse `computeLcIndex`), the
  **real top 30** with styleName, brandName, resaleMedian, priceCount, liveCount, tier.
- For **Kelly Pochette**, **Birkin**, and **"Cocoa Base shopping bag"**: their `style_id`, every
  `variant_id` under them, and a dump of `price_history` rows (platform, price_type, currency,
  sale_price, listing_ref, source_url). Find the contamination with your eyes.
- The **currency spread per style** (count of rows per currency) for those three.
- The **distribution of `price_count` across all ranked styles** (min / p10 / p25 / median / p75 /
  max, and a rough histogram) so you can set the floor from evidence, not a guess.

### Fix at the source
- **Currency:** make the median honest. Either compute per-variant medians in each variant's
  DOMINANT currency then roll up in the style's dominant currency, OR filter the style's comps to
  its single dominant currency before the median. Do NOT pool currencies. New migration
  `0050_style_index_signals_v2.sql` (never edit 0048, it is applied).
- **Mislabeled comps / junk styles:** if the Pochette/Birkin contamination is bad variant→style
  mapping or a junk style, fix the catalog/ingest data (or exclude the style). Report what you
  found and what you changed, with counts. Do not fabricate.

## Bug 2 — thin data ranks too high (FORMULA)

`LC_INDEX_MIN_N` is 8. Too low. Set a real floor FROM THE DISTRIBUTION you measured (the Pochette
at 53 and Cocoa bag at 33 must fall out, without gutting the list of legitimate bags, so pick the
number from the histogram, do not hardcode blindly).

Then adopt the owner-approved reconciliation of exclusivity vs availability:

**Demand first, then exclusivity among the proven.** A style must clear the recorded-price floor
to be ranked at all (it has demonstrated real market activity). Scarcity (few live listings) is
then measured ONLY among eligible styles, so "hard to find" reads as genuine exclusivity rather
than obscurity. Implement in `computeLcIndex`:
- Eligibility gate = `priceCount >= floor` AND `resaleMedian != null` (already there, raise floor).
- Scarcity percentile computed within the eligible set (already is), which now means what we want.
- Consider whether scarcity should be "sell-through pressure" (recorded trades relative to live
  listings) instead of raw inverted live-count. Try it, keep whichever ranks more defensibly.
Weights stay price 40 / trade 25 / scarcity 20 / tier 15 unless the validation says otherwise;
if you change a weight, justify it in the spec.

## Bug 3 — repetitive why-note (COPY)

Replace `whyNote()` (3 canned strings) with a generator that gives each bag ONE short line naming
what actually distinguishes it, keyed off its standout signal(s) + comparative position + brand.
No two adjacent lines should read the same. Constraints (owner voice, non-negotiable):
- **No em dashes** anywhere (`docs/voice-and-tone.md`).
- **No verdicts** ("best", "worth it"). Market facts + calibrated framing only.
- **As short as possible**, still descriptive of WHY it sits where it does.

Style samples the owner reacted well to (match this register, do not ship verbatim for the wrong bag):
- Birkin: "The benchmark. Nothing we track prices higher, and it rarely sits."
- Neverfull: "The liquid one. Changes hands more than any bag on this list."
- Kelly: "Birkin money, a fraction as available."
- Classic Flap: "Chanel's blue chip: grail pricing at real volume."
- a true scarce grail: "Seldom surfaces. Grail pricing on the few that do."

Route the copy through the `copywriter` subagent / `brand-voice` skill if you want a voice pass.
Keep the generator deterministic (same inputs → same line) so ranks are stable.

## Validate before landing (the gut-check)

Print the corrected **real top 20** and sanity-check against domain truth:
- The top should be recognised grails: Hermès Birkin / Kelly, Chanel Classic Flap, and peers. NOT a
  Kelly Pochette, NOT an unknown "shopping bag".
- No impossible medians (a Birkin median in the thousands-of-1,700 range is still broken).
- No scrape-artifact style names in the top 100.
- Spot-check 3 why-notes read distinct and true.
If it still looks wrong, keep digging; do not land a ranking you cannot defend (the factuality bar).

## Land it
1. Branch off latest `origin/main` (do NOT reuse an old per-session branch).
2. Green gate: `tsc --noEmit`, `eslint`, `npm test` (extend `src/lib/__tests__/lc-index.test.ts`
   for the new floor, scarcity logic, and why generator), `next build`.
3. `bash scripts/land-to-main.sh`.
4. Apply the new migration `0050` via the db-migrate GitHub Action (owner-gated, or with her
   go-ahead): merge to main first, then run the Action, then verify the RPC live.
5. Update `docs/ux/lc-index-spec.md` (formula + floor + scarcity model + why generator) and add a
   TL;DR to `docs/handoff.md`.

## Files
- `src/lib/lc-index.ts` — floor, scarcity model, `whyNote` → generator, tests.
- `supabase/migrations/0050_style_index_signals_v2.sql` — currency-honest median (new file).
- `src/app/rankings/page.tsx` — uses `whyNote`, should need no structural change.
- `scripts/diagnose-lc-index.ts` — throwaway, do not commit unless useful.
- Do NOT touch `MovementPill`, `StandingGlyph`, `StandingCard` layout (approved), or the responsive
  `/rankings` row layout (just fixed).
