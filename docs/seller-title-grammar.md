# Seller title grammar — how to ingest sellers who name bags badly

**All numbers measured 2026-07-26** against 316,986 unpromoted `discovered_listing` rows.
Re-measure with `npx tsx scripts/dictionary-gap-report.ts` before trusting them.

---

## 🔒 The one rule

> **Never invent a style name from a seller's title. Only attach listings to styles that already exist.**

Promotion has two possible moves for a cluster:

| Move | When | Safe? |
|---|---|---|
| Attach to an existing style | the dictionary matched the title | ✅ always |
| Create a new style from the title | nothing matched | ❌ never |

The second move is what produced junk styles like
`Aged Calfskin Quilted Mini Reissue Wallet On Chain WOC So Black`. That is a Chanel
**Reissue WOC**; everything else in the string is material, hardware and colour.

**Enforced by:** `promote:discovered -- --matched-only`. Use it every time.
On 2026-07-26 it held back 2,672 of 3,001 clusters and promoted 331 with **+0 new styles**.

---

## 🪤 Gotcha first: `raw_name` is often a placeholder

`raw_name` is documented as the verbatim title. For three sellers it is **not**.

| Seller | `raw_name` contains | Real title lives in |
|---|---|---|
| The Luxury Closet | `unmatched-model (dictionary miss) — captured for triage` (97.2%) | `style_guess` |
| Rebag | same placeholder (99.3%) | `style_guess` |
| Ann's Fabulous Finds | `… fabulous finds discovered` | `style_guess` |
| Fashionphile, TRR, eBay, myGemma, Couture USA, Redeluxe | the real title | `raw_name` |

That placeholder covers **60.4% of the entire backlog**.

⚠️ **Any code that reads `raw_name` first is matching against boilerplate.** Use the
`sellerTitle()` helper in `supabase/ingest/normalize-discovered.ts`.

This is a **precondition**, not a nicety: before it was fixed, adding `matelasse` to the
Chanel dictionary did nothing for the 149,392 Luxury Closet rows that needed it.

---

## 📐 Per-seller grammar

Each seller is internally consistent, which is what makes rules possible. The
**model position** column is where the actual bag name sits.

| Seller | Rows | Grammar | Model position | Matches today |
|---|---|---|---|---|
| The Luxury Closet | 149,392 | `Brand Colour/Colour Material [Model] Type` | middle, often absent | 3.3% |
| Fashionphile | 98,840 | `Material Treatment [Model] Type Colour` | middle | **43.2%** |
| Rebag | 46,591 | `BRAND [Model] Type Material Size` | early | 0.7% |
| The RealReal | 7,564 | `Material [Model] Type` (very short) | middle | 8.3% |
| myGemma | 5,412 | `Colour Material [Model] Type` | middle | 0% |
| Couture USA | 3,429 | `Material [Model] Type` | middle | 0% |
| eBay | 2,999 | free text, seller-written | anywhere | 1.4% |
| Ann's Fabulous Finds | 1,718 | `Brand Size Colour Material [Model] Type` | late | 0% |
| Redeluxe | 1,041 | `Colour Material [Model] Type Hardware` | middle | 0% |

**Fashionphile matches 13× better than The Luxury Closet on the same dictionary.**
Not because its grammar is cleaner, but because it uses the house's canonical model
names (`Boy`, `Reissue`), while The Luxury Closet writes its own descriptions
(`Coco Beach`, `Vintage Vertical`, `Mood Convertible`).

### Attributes are already parsed

Material and colour are **already extracted into columns** for the big sellers. Do not
re-parse them out of the title.

| Seller | `material` filled | `colorway` filled |
|---|---|---|
| The Luxury Closet | 98% | 100% |
| Fashionphile | 97% | 99% |
| Rebag | 94% | 100% |
| The RealReal | 69% | 75% |
| myGemma, Couture USA, eBay, Ann's, Redeluxe | 0% | 0–99% |

---

## 🎯 Why rows actually fail

This is the part that decides where effort goes.

| Reason | Rows | Share |
|---|---|---|
| Brand known, **model missing from dictionary** | 215,749 | **68.1%** |
| Matched (promotable now) | 48,655 | 15.3% |
| Brand not in the dictionary at all | 32,958 | 10.4% |
| SLG / accessory (correctly excluded) | 19,620 | 6.2% |

**The bottleneck is dictionary coverage, not title parsing.** Per-seller strip rules help
at the margin. Adding missing model names is what moves the number.

---

## 🔁 The recurring loop

Run this whenever the backlog grows. It is the whole workflow.

```bash
cd ~/Documents/luxury-catalog-lcindexmv

# 1. Where is the gap, and which model names would unlock the most rows?
npx tsx scripts/dictionary-gap-report.ts --top=30

# 2. Add the top names to MODELS in src/lib/ingest/model-normalize.ts
#    (one line per model: [canonical, ...match tokens])

# 3. Re-normalise so those rows resolve
npx tsx supabase/ingest/normalize-discovered.ts --write

# 4. Promote ONLY what matched — never mints a style name
npx tsx supabase/ingest/promote-discovered.ts --min=5 --matched-only --write
```

Steps 3 and 4 also run from **Actions → "Promote discovered bags into the catalogue"**.
Scheduled runs are always dry-run; a manual run with `write=true` persists.

### ⛔ Step 2 needs a human (or the archivist). Never paste the report in.

The report ranks **candidate** strings, not verified models. The residue after stripping
is frequently a technique, a material or a descriptor, and adding one of those to `MODELS`
creates exactly the junk page `--matched-only` exists to prevent.

Real examples from the top of the 2026-07-26 list that must **not** be added:

| Candidate | What it actually is |
|---|---|
| Chanel :: matelasse | quilting technique |
| Bottega Veneta :: intrecciato | the woven leather treatment |
| Gucci :: gg / gg supreme | monogram canvas |
| Prada :: tessuto nylon | the nylon fabric |
| Saint Laurent :: grain de poudre | a leather finish |
| Michael Kors :: michael | diffusion sub-brand |
| Chanel :: cc / round / full / around | extraction noise |

**Rule: every candidate gets verified as a real produced model before it goes in the
dictionary.** Ask the `archivist` subagent, which owns the house naming archive. It returns
a verdict per candidate (MODEL / TECHNIQUE / MATERIAL / DESCRIPTOR / SUB-BRAND / UNSURE)
plus the canonical spelling. Anything UNSURE stays out.

Sellers also misspell: Céline's **Triomphe** shows up as "triumph" 255 times. Add the
canonical name with the misspelling as a match token, never as its own style.

Biggest brand gaps overall: **Chanel 47,593 rows**, Louis Vuitton, Gucci, Prada, Dior.
Two brands have **no dictionary entry at all**: **DKNY** (7,487) and **Kate Spade** (3,904).

---

## 🛑 What not to try to fix

Some titles genuinely do not name a model:

- `Chanel Caviar Blue Tote and Shoulder Bag`
- `Canvas Tote Bag`

No rule recovers these, because the information isn't there. They should stay unpromoted
rather than become a style. That is the system working, not failing.

Per the catalog-canon rule, "no listing" never means "never made" — these rows stay banked
as evidence, they just don't mint a page.

---

## Related

- `docs/data-collection-handoff.md` — capture runbook and surface map
- `src/lib/ingest/model-normalize.ts` — the dictionary itself (`MODELS`, `BRAND_ALIASES`)
- `scripts/probe-seller-title-grammar.ts` — per-seller grammar + attribute-fill probe
- `scripts/dictionary-gap-report.ts` — the gap report driving the loop above
