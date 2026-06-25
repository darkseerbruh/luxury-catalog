# Content Writing — Handoff / Bootstrap

*Created 2026-06-24. The deep doc for the **Content** lane. Find the lane's worktree/branch,
file ownership, and live status in the 🧭 Active-lanes registry at the top of
[handoff.md](handoff.md); this is the depth behind that row. Read it first, then the canonical
docs it points to. You are producing publishable editorial that earns search/AI-citation
traffic and monetizes it through the compare-and-hand-off CTA.*

## 0. The end goal (confirmed by the owner)
Build Luxury Catalog into the **trusted, AI- and Google-citable reference for the luxury
handbag resale market**: a fact-dense site that earns **organic, high-intent traffic** at
the buying-decision moments (is it real / what's it worth / which one / where to buy, sell,
rent) and **monetizes it through compare-and-hand-off affiliate referrals, weighted to the
seller/consignor side.** Content is the engine; the CTA block is how it earns.

**Ship a coherent SUITE, never one-offs.** A single article doesn't move the goal (it won't
re-pass affiliate review, won't reach SEO/GEO critical mass, reads as a fragment). Skimlinks
already rejected the site as not content-rich; quality + additivity + breadth beat volume.

## 1. READ FIRST — these are binding, not optional
- **`docs/preferences.md`** — the `ENFORCED:start..end` block (auto-injected every turn) +
  the **Content factuality protocol** + the **Calibrated-hedge frames** sections. Rules 3 & 8
  are the hard content bar.
- **`docs/voice-and-tone.md`** — the FULL guide. Run the §8 slop sweep + human-review
  checklist on every line. No em dashes. No hype superlatives in the brand voice.
- **`docs/content-strategy.md`** — the spine (decision-moment reference → seller-weighted
  hand-off) + the prioritized roadmap.
- **`docs/authentication-standard.md`** — *(created by another chat, 2026-06-25)* the **hard,
  non-negotiable gate for ANY authentication content** (articles, bag-page sections, diagrams,
  the Identify tool, any authenticity score). Core rule: **teach the checkable markers, never
  render the verdict, always escalate to a human (Learn → Check → Verify).** Markers must be
  objective+observable, **cross-verified from ≥2 reputable sources**, and **era-stamped**. If a
  piece can't pass its §7 pre-publish gate, it does not ship.
- **`docs/data-collection-handoff.md`** — data state (§3 hero variant ids, §4 what's loaded,
  §11 affiliate program status + product-feed image plan).

## 2. The non-negotiable content bar (summary of the above)
- **Factuality (rule 3 + protocol).** Every published spec/price/value/stat traces to a
  **freshly re-run query or cited source**, stated with **date, sample size (n), and anchor**.
  Report derived stats **conservatively** (no cherry-picked buckets). **Mark inferences and
  unmeasured combinations** as such. **Self-audit BEFORE presenting**, surface provenance. The
  owner must never have to run the audit. *(This rule exists because a Chanel value draft
  overreached — see §5.)*
- **Calibrated hedging (rule 8 + frames).** On value/authenticity/fit/taste/money/legal:
  frame as **evidence + opinion** ("our estimate," "markers to check," "my take"), **never a
  verdict** ("authentic," "worth $X," "you should"). Value = *estimate, not appraisal*. Auth =
  *markers to check, not a verdict*.
- **Voice gate.** Apply the full `voice-and-tone.md`. Specifics over adjectives; pub test;
  no em dashes; brand voice earns enthusiasm through facts, not superlatives.

## 3. Bag page vs article — DON'T duplicate (the cannibalization trap)
- **Bag page (`/bag/[variantId]`)** = the product/reference detail (DB-driven value module,
  buy/sell, specs). Wins **lookup** intent ("[bag] price"). It is the conversion destination.
- **Article** = editorial narrative. Wins **question/decision** intent, is what AI/Google
  *cite*, is shareable, and **routes to** the bag page.
- **Trap:** a per-bag "what it's listing for" article mostly **restates the bag page** (same
  data, same intent) → thin + SEO cannibalization. **An article must do what the bag page
  cannot: compare, judge, guide, or answer a question.** Frame any per-bag piece as a
  **decision** ("Is the Classic Flap worth it on resale right now?") that adds judgment, not a
  data dump.

## 4. The refined first suite (the plan — additive, low-overlap, all data-ready)
Publish these together, then re-apply to Skimlinks. Each is topic-tagged (→ CTA hand-off),
cross-linked to each other + the relevant bag pages + `/deals`, `/coveted`.
1. **Caviar vs Lambskin: which Classic Flap holds value** (comparison; data within variant 199)
2. **Birkin vs Kelly: which holds value better** (comparison; variants 210 / 214)
3. **Is the Chanel Classic Flap worth it on resale right now?** (decision, judgment-led; 199)
4. **Where to sell your designer bag for the most** (seller guide; the dominant revenue lever)

*(Optional per-bag decision pieces — LV Neverfull, Birkin, Marmont — only if framed as
decisions, not value restatements.)* Owner was deciding between this refined additive suite vs
keeping a couple per-bag pieces; confirm with her before writing.

## 5. The data — how to verify EVERY figure (and the locked caveats)
- **Access:** prod Supabase via `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY`). Write a throwaway `tsx` script under `supabase/ingest/_*.ts`
  (dotenv-load `.env.local`, create a client), run with `npx tsx`, then **delete it**.
- **Pattern:** `price_history`, `price_type='listed'`, **live rows only** (`listing_status` !=
  'sold'). Compute n, median, p25/p75, min/max; group by `material` / `hardware_color` /
  `colorway` / `condition` / `platform`. Map `variant_id` → `style` → `brand` (tables are
  singular: `variant`, `style`, `brand`).
- **Hero variant ids:** Chanel Classic Flap Medium **199**, LV Neverfull MM **218**, Hermès
  Birkin 30 **210**, Gucci GG Marmont Small **207**, Hermès Kelly 28 **214**.
- **LOCKED caveats (violating these is how the Chanel draft overreached):**
  - **All prices are ASKING (listed); there are 0 sold rows.** Say "listing for," never "sells
    for."
  - **Snapshots only, no resale time-series.** No "appreciating / up X% / over time" claims on
    resale.
  - **Condition is null on most listings** → never infer "heavily worn"; if null, say so or omit.
  - **`variant.retail_price_original` is DATED** (199's is 2019). Any retention/% claim must
    anchor the year; for a current-retail comparison, pull the latest `retail_msrp` row, don't
    call a 2019 figure "recent."
  - **Mid-tier (Coach/MK/Kate Spade) data is thin/absent** — not ready; needs eBay/Poshmark
    capture first (Fashionphile + TheRealReal are premium-only sources).

## 6. How content enters the UI (mechanics)
- **Post system:** `post` table; editor at `/posts/new` (or insert a row via a `tsx` script
  with the admin client). Fields: title, excerpt, **body**, status (`draft`/`published`),
  `topic_brand_id`, `topic_style_id`, `author_user_id`.
- **Body is PLAIN-TEXT paragraphs** (split on blank lines; escaped; **no markdown headings,
  bold, bullets, or inline links render**). Write prose paragraphs. Monetization is NOT in the
  body — it's the **CTA block** (`src/app/posts/[slug]/PostBagCTA.tsx`, already built), which
  renders seller-first buy/sell/**rent** affiliate links from the post's topic tag. So **always
  topic-tag** the post (e.g. Chanel `brand_id=1` / Classic Flap `style_id=1`).
- **Existing draft:** the Chanel value piece is seeded as a **draft** (post_id 1, slug
  `chanel-classic-flap-resale-value`, topic Chanel/Classic Flap) but **FAILED the factuality
  audit** (2019 retail mislabeled "recent"; 60% leather gap that's ~44% aggregated; floor called
  "heavily worn" with condition unknown). **Correct or rewrite it as a decision piece before
  publishing.**

## 7. Definition of done (per piece, before it ships)
Passes the **factuality protocol** (self-audited, every figure traced, provenance stated) ·
**voice-and-tone §8** · **calibrated hedging** · the **authentication standard §7 gate** (if it
contains any auth claim) · is **topic-tagged** · body is **plain-text** · is **cross-linked** ·
**monetizes via the CTA**. A draft that can't pass all of these is not done.

## 8. Status snapshot (2026-06-24)
- Published: **0.** Drafts: 1 (Chanel, needs correction).
- Built: the post→bag **CTA block** + the **rental fork** (Vivrelle/RtR; links work, attribution
  flips on when codes land). **eBay affiliate is live**; FP/TRR/Vestiaire/Vivrelle/RtR codes
  pending. **Skimlinks REJECTED** (Vestiaire/1stDibs/RtR uncovered) — re-apply after the suite
  ships. Vivrelle (Awin) applied, pending.
- Not built yet: the **schematic SVG diagram component** (for auth content); mid-tier data
  capture; conversion instrumentation on the CTA.
</content>
