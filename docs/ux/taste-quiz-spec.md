# Taste Quiz + Taste Identity — source of truth

*Locked 2026-06-28 after line-level iteration with the owner. Supersedes the old `/quiz` this-or-that. This is the spec to build from. User-facing copy here has passed the `docs/voice-and-tone.md` gate (no em dashes, warm, no hype, sentence case after a colon).*

## Why this exists (persona grounding)
The quiz is **Maya the Appreciator's** instrument (see `docs/personas.md` §3): the largest segment, top of every funnel, the never-gatekept growth loop. Its whole job is to hand someone the words for their own taste, seed a `want` list to dream into, and end on a result that makes them feel **seen**. It carries no purchase pressure and no price question. Motivation and maturity are NOT asked here (per personas §4: motivation belongs in onboarding, maturity is inferred from behavior).

## The core mechanic
Most questions use a three-way mark, default **"It's fine"** so nothing is a forced tap:
- **Love it** = a strong positive (boosts matches and feeds the feeling read)
- **It's fine** = neutral, the untouched default
- **Not for me** = a hard exclude that filters every surface, sitewide

Because the default is "It's fine," a casual user marks only their strong loves and hard nos and finishes fast; a thorough user marks everything. Every step has a visible **Skip**. This is what lets the quiz be comprehensive without hurting completion.

## The questions (7 + result). No size question, no fit question, no price question.

### 1. Occasions — multi-select
Prompt: **What do you carry a bag for? Pick all that fit. We build a board for each.**
- Everyday `everyday` (errands, day to day)
- Work `work` (carries a laptop or papers)
- Going out `evening` (evenings and special occasions; "special" folded in here)
- Travel `travel` (trips: weekenders and what flies well)

Reuses the closed set in `src/lib/occasions.ts` (keeps the underlying `evening`/`special` enum intact; this only groups them under one board label).

### 2. Style / vibe — Love it / It's fine / Not for me
Prompt: **Which of these are you?**
- Structured · Relaxed · Edgy · Boho · Glam · Sporty

Cut after iteration: Classic (a brand-marketing fiction, not a look), Avant-garde (too niche to be a hypothesis), Playful/novelty (real but tiny market), Minimal/Quiet (its real signal is the logo question below). Structure ("stands on its own, has feet") lives inside Structured.

### 3. Logo / branding — single pick (a spectrum, not a three-way), with visuals
Prompt: **How do you feel about logos?**
- **Quiet** — Keep it quiet, no visible logos
- **Recognizable** — Recognizable, not loud. The shape says it, not an allover print
- **Loud** — Love the logo, bring on the print

Each option carries a brand-neutral schematic visual (line-art, no reproduced house logos): quiet = a clean unmarked bag; recognizable = a distinct silhouette with one small emblem; loud = an allover generic repeating motif. This axis absorbs the old "signature print / monogram" finish (choosing monogram is a logo statement, not a material preference). It is one of the more data-derivable axes (coated-canvas and known signature styles read as loud; plain leather with no branding reads as quiet).

### 4. Carry — Love it / It's fine / Not for me
Prompt: **How do you like to carry?**
- Top handle · Crossbody (at the hip) · Across the front (worn on the chest, like Louis Vuitton's sling and bumbag styles) · Over the shoulder · Belt bag (at the waist) · Backpack

Data note: across-the-front and belt styles are thin in the catalog today; those boards stay sparse until we capture more.

### 5. Finishes — Love it / It's fine / Not for me
Prompt: **Which finishes are you?** (Comprehensive on purpose: breadth is a credibility signal.)
- Smooth leather · Pebbled / grained leather · Suede · Nylon or fabric (like Prada's) · Exotic skins (like crocodile) · Tweed · Patent · Embellished or artistic (crystals, pearls, hand-painted, like Hermès's painted Birkins) · Woven / raffia · Fur / shearling

Cut: Clear / vinyl (the thinnest, most fad-like). Signature print moved to the logo question.

### 6. Hardware — Love it / It's fine / Not for me
Prompt: **Which hardware are you?**
- Gold · Silver · Rose gold · Brass (the warm vintage tone, common on vintage Coach) · Gunmetal (dark)

Grounded in real `hardware_color` data. Black hardware omitted until the catalog has it.

### 7. Houses — Love it / It's fine / Not for me, multi-column grid
Prompt: **Any houses you always love, or never touch?**
Drawn live from the brand directory, tier-ranked, with a "more houses" expander. Multi-column even on the narrowest phone, with the three-way control sitting directly under each house name (tight, no long eye-travel across the row). Never hardcoded, so a new house appears on its own.

### Result — the feeling read (see below)

## The result: a feeling-based read, not a label
The result does not sort people into a box (no archetypes, no aesthetic labels, no cities, no internet words). It hands them the words for their own taste and the feeling underneath it, the way a perceptive friend would, using two anchors: **how it makes you feel** and **how it makes a room feel.** (Model: the owner's fragrance method, "you want to feel like a warm hug.")

### Composition recipe
1. **Headline** (the screenshot line): from their strongest **vibe**, unless the **logo** answer is a decisive pole, in which case the logo headline leads. Every headline starts with "You."
2. **"You feel ___"**: from vibe + logo.
3. **"The room feels ___"**: from vibe + logo.
4. **Optional texture**: a word from their hardware or a strong finish.
5. **Tags**: their real "Love it" choices, shown quietly.

The read is composed from a **hand-authored vocabulary** (below), deterministic from their answers, so it always sounds human and on-voice and never reads as generated. It only ever reflects what they actually marked.

### Headlines by vibe (all start with "You")
| Vibe | Headline |
|---|---|
| Structured | You keep it composed. |
| Relaxed | You want it to feel easy. |
| Edgy | You like a little armor. |
| Boho | You want the room to exhale. |
| Glam | You light the place up. |
| Sporty | You want it to keep up. |

### Logo-led headlines (override when the logo answer is decisive; all start with "You")
| Logo | Headline |
|---|---|
| Quiet | You don't need it to shout. |
| Recognizable | You're in on it. |
| Loud | You're happy to be appreciated. |

### You feel / The room feels, by vibe
| Vibe | You feel | The room feels |
|---|---|---|
| Structured | composed, in control | that you have it handled |
| Relaxed | easy, unhurried | calm around you |
| Edgy | sharp, a little untouchable | it before you speak |
| Boho | warm, free | welcomed, at ease |
| Glam | alive, magnetic | drawn in |
| Sporty | capable, unbothered | that you make it look effortless |

### Logo modifiers (a phrase the read can borrow)
| Logo | Adds |
|---|---|
| Quiet | and quietly certain · nothing to prove |
| Recognizable | and in on it |
| Loud | and happy to be looked at |

### Texture words
| Hardware | Word | Finish (if "Love it") | Word |
|---|---|---|---|
| Gold | warm | Smooth leather | classic, no fuss |
| Silver | cool, clean | Suede | soft, tactile |
| Rose gold | soft, modern | Exotic | daring, rare |
| Brass | lived-in, heritage | Tweed | polished, heritage |
| Gunmetal | dark, with an edge | Embellished | a little theatrical |
| | | Woven / raffia | sunlit, easy |
| | | Fur / shearling | cozy, indulgent |

### Worked examples
- **Quiet + structured + gold + leather:** "You don't need it to shout." You feel composed and quietly certain. The room clocks it anyway. (Structured · No logos · Gold)
- **Edgy + gunmetal + recognizable + top handle:** "You like a little armor." You feel sharp and a little untouchable. People feel it before you speak. (Edgy · Gunmetal · Top handle)
- **Boho + rose gold + woven:** "You want the room to exhale." You feel free and easy, soft and modern. The room relaxes when you walk in. (Boho · Rose gold · Woven)

### Edge cases
- **Low signal** (almost everything "It's fine"): a gentle fallback read, never blank. e.g., "You're open to a lot, and that's a good place to start. Here's where we'd begin."
- **Two strong opposite loves** (structured and boho): lead with the heavier-weighted one, name the other as a wink ("Composed, with a soft streak").

## The card
The result renders as a designed **type card** in the brand dark/gold/serif look: the eyebrow "What your style does," the "You..." headline, the "you feel / the room feels" line, and the quiet tags. **Pure type and vector, no AI imagery, no reproduced house logos** (same discipline as our schematic diagrams). It is savable, shareable (the screenshot moment), and shows on the profile as an identity block, the personality-type analog the owner wanted.

## The boards
After the result, a board per chosen occasion of real catalog bags matched on the Love-it signals, minus every Not-for-me, with a visible, editable "kept out" strip. The primary action on each bag is the quick-save **heart** (saves to `want`). No Dreaming/Shopping toggle (cut), no price filter (price lives on the shop side).

## Engagement mechanics (kept)
- A **progress bar + "step X of N"** so they always know how much is left.
- **Visual examples on every option** so it reads as taste, not a form.
- **Default "It's fine" + a visible Skip** so nothing is mandatory.
- End on the **feeling read**, savable and shareable, shown on the profile.

Cut after discussion: a live "narrowing count" (overkill) and a mid-quiz board peek.

## Data mapping + honest caveats
- Occasions → `src/lib/occasions.ts`. Carry, hardware → existing taxonomy / `hardware_color` data. Houses → live brand directory.
- **Vibe has no field in the catalog yet.** Structured-vs-soft and minimal-vs-signature can be derived from existing attributes; the more subjective vibes (edgy, boho, glam) need a curated style-to-vibe mapping, which is real work. Do not promise vibe-perfect boards on day one.
- **Logo is more derivable than vibe** (from material + known signature styles).
- The read only reflects real answers; the warmth is in our curated copy, never invented facts.

## Build notes (not built yet)
- New taste model needs to store **occasions chosen + Love/Not marks per attribute + the derived feeling read**. Likely a migration (extends `taste_vector`/profile). Thread behind resilient reads so the app degrades gracefully until applied.
- The result generator = the vocabulary tables above as a deterministic, hand-authored map (no LLM at runtime).

## Companion specs (separate, referenced here so they are not lost)
- **Sitewide quick-save heart.** Today the only save control is a "Want it" button on the bag detail page (`BagActions`); grid cards (search/shop/deals) have no quick-save. Standardize one heart that writes to `want` on every bag card. Needs care on the variant PDP (the Amazon-style page where colour/size/hardware are selectors): the heart saves the currently-selected variant by default.
- **Want-list "Any / family" granularity.** A saved `want` should support per-attribute values that are a specific pick, a **family** (e.g. "any green"), or **Any** (e.g. "any Chanel 19"). Reuse the existing **`colorFamily()`** in `src/lib/listings-taxonomy.ts` (no new normalizer). Alerts then fire on any matching variant. Serves both shallow savers (leave everything Any) and deep savers (a checklist of the specific seasonal colours we have). This is a `want`-model change (today want is one exact variant).
- **Onboarding motivation multi-select** (personas §4): the purpose/motivation question belongs in onboarding over the five verbs, not the quiz; maturity is inferred from behavior. Reconcile onboarding with the homepage `PersonaRouter`.

## Lens
Engagement first: a completed quiz seeds a `want` list and the feeling identity, the return-visit and save hooks Maya's whole journey runs on. The feeling read is the most shareable asset we can make (people share what makes them feel seen), so it doubles as top-of-funnel acquisition. Monetization is downstream, when Maya matures into the bag-page buy moment.
