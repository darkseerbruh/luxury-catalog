# Authentication Content Standard — the binding gate

*Created 2026-06-25. **This is a hard standard, not a guideline.** Every piece of
authentication content the site ever ships MUST pass this gate before it goes live:
articles, bag-page authentication sections, schematic diagrams, the Identify tool's
copy and any authenticity score, marketplace copy, and any future surface. If a piece
cannot pass the §7 pre-publish gate, it does not ship. No exceptions, no "just this
once." Pairs with `docs/content-strategy.md` (what we publish), `docs/voice-and-tone.md`
(how it sounds), and the factuality protocol in `docs/preferences.md`.*

---

## 0. The one rule everything else serves

**We teach the checkable markers. We never render the verdict. We always escalate to a
human.** Authentication is a ladder: **Learn** (self-serve criteria) → **Check** (AI reads
visible markers from a photo) → **Verify** (a real human authenticates the item in hand).
Every surface sits on a rung and points up the ladder. The top rung, a human verifying an
item mailed or photographed to them, is the only thing that can confirm authenticity, and
every piece of our content must say so.

*Why: authentication authority is one of our two moats. Cited, factual, era-specific
content is what Google and AI engines cite (reach), and the free Learn/Check funnel is the
on-ramp to the paid Verify rung (revenue). A single overclaim destroys the moat.*

---

## 1. Sourcing — what may become a published marker

A marker may be published ONLY if it meets ALL of:

1. **Objective and observable.** A documented format, a stamp location, a hardware
   engraving, a cross-check rule. NOT a subjective tactile cue ("the leather feels off",
   "the smell is wrong"). Subjective cues are never checklist items.
2. **Cross-verifiable from at least two independent, reputable sources.** One blog is not
   enough. Acceptable source types: established resale-house references (e.g. FASHIONPHILE
   Academy), specialist authenticator references, and recognized community expertise (e.g.
   PurseForum) used as corroboration, never as a sole source.
3. **Era-stamped.** Markers change. A rule that is true for one production period must be
   labeled with the period it applies to (example: Louis Vuitton physical date codes were
   discontinued in March 2021 in favor of RFID, so any date-code guidance is bounded to
   pre-2021).
4. **Failure-mode labeled.** State what a counterfeit gets wrong, or the cross-check to
   run. The failure mode is the teaching value; a marker without one is not publishable.
5. **Confidence-rated and cited.** Every published marker carries a `confidence_level`
   (low / medium / high / verified) and its `sources`, surfaced in the UI. If we cannot
   cite it, we do not publish it.

**Never assert an unsourced marker. Never invent a marker, a serial format, a date code,
or a percentage to fill out a checklist.**

---

## 2. The verdict boundary — "likelihood" without invented numbers

The asymmetry is the law: **we can be confident about a FAIL, never about a PASS.** A
documented rule violation (for example, a "Made in France" stamp paired with a date-code
country prefix from another country) is a strong, defensible "likely not authentic" signal.
But every checkable marker looking right only means "nothing inconsistent found", never
"authentic", because a competent counterfeit passes visible checks.

Therefore:

- **FORBIDDEN: a fabricated numeric probability** ("87% likely authentic"). We have no
  validated probability model, so any percentage we invent is fake precision and violates
  the factuality protocol. A numeric percentage is permitted ONLY if it comes from a
  validated, licensed model (e.g. a partner like Entrupy) or our own model validated on
  labeled data, and it must be attributed to that source.
- **REQUIRED form of any authenticity signal we show (the approved mechanic):** a
  transparent checklist-coverage signal. Show "X of Y checkable markers consistent" plus an
  **asymmetric, capped** verdict band:
  - **Red flags found** — a documented rule was violated (we may state this with confidence).
  - **Inconclusive** — not enough checkable markers were assessable.
  - **Consistent so far, not confirmed** — all checkable markers look right. **This is the
    ceiling. Nothing we show may rank above it.** We never display "Authentic", "Genuine",
    "Verified real", or any equivalent.
- Every signal ends in the escalation line (§4).

---

## 3. Schematic diagrams — the rubric

We produce authentication diagrams as original schematic SVG (never licensed photos, never
eBay images, never a traced product photo). A diagram ships only if it passes ALL of:

1. **Sourced** — depicts only a marker documented and cited per §1. If we cannot cite it,
   we do not draw it.
2. **Located and specific** — shows *where* on the bag and *what* to look at, not a generic
   silhouette.
3. **Era-stamped** — labeled with the period it applies to.
4. **Failure-mode labeled** — calls out what a fake gets wrong or the cross-check to run.
5. **Non-infringing** — schematic line art that depicts structure and placement, with no
   brand logo reproduced in infringing detail and no trademark artwork copied. This is both
   the image-licensing rule and a trademark safeguard.
6. **Legible at display size** — readable small, in the dark / gold / serif system, with
   accessible contrast.
7. **Confidence-tagged** — carries the same low / medium / high / verified rating as the
   marker it illustrates.

---

## 4. Liability and escalation — mandatory on every surface

Every authentication surface (article, bag-page section, Identify result, diagram caption,
marketplace copy) MUST:

- State plainly that **we do not guarantee authenticity.**
- **Route to the next rung**, ending in mailing or sending the item to a real human
  authenticator. The Learn surfaces point to Check and Verify; the Check surface points to
  Verify.
- Never use "Authentic / Genuine / Verified real" as an output (§2 cap).

This text is not decorative and may not be dropped to save space. The §2 capped score is
the structural enforcement of this posture: it cannot overclaim.

---

## 5. Brand sequencing — the readiness gate

A brand's authentication content is publishable only when it clears the **validatable bar**:

- At least ~4 to 6 objective, located markers, each meeting §1.
- Each era-stamped, failure-mode labeled, confidence-rated, and cited.
- The §4 escalation line present.

Below the bar, a brand stays in draft. Approved sequence (revisit as data and sourcing
change): **1. Louis Vuitton** (best-documented, most-counterfeited; note the post-2021 RFID
gap) → **2. Coach** (lower stakes, the SEO wedge) → **3. Chanel** (our deepest hero data) →
**4. Hermès** (highest stakes and best fakes; lean hardest on the human rung) → **5. Gucci
and others.** Do not jump a higher-stakes brand ahead of the bar.

---

## 6. Forbidden — a piece is rejected on sight if it does any of these

- Renders or implies a verdict of authentic / genuine / real.
- Shows a fabricated authenticity percentage or any invented number.
- Publishes a marker that is uncited, single-sourced, subjective, or not era-stamped.
- Omits the failure mode for a marker.
- Omits the "we do not guarantee authenticity" escalation line.
- Uses a licensed photo, an eBay image, or a traced product photo for a diagram.
- Reproduces brand logo or trademark artwork in infringing detail.
- Uses em dashes or otherwise fails `docs/voice-and-tone.md`.

---

## 7. Pre-publish gate — run this on EVERY authentication piece

A piece may ship only if every box is true. If any is false, it does not ship.

- [ ] Every marker is objective, cross-verified (2+ reputable sources), era-stamped, and
      failure-mode labeled (§1).
- [ ] Every marker carries a confidence rating and its citation, surfaced in the UI (§1).
- [ ] No verdict of authentic / genuine / real anywhere; any score uses the §2 capped,
      asymmetric form with no invented numbers.
- [ ] The "we do not guarantee authenticity" line and the escalate-to-a-human route are
      present (§4).
- [ ] Any diagram passes all seven §3 checks.
- [ ] The brand has cleared the §5 validatable bar (or this stays in draft).
- [ ] Passes `docs/voice-and-tone.md` (slop sweep, no em dashes) and the
      `docs/preferences.md` factuality protocol.

---

## 8. Enforcement

- `docs/content-strategy.md` points here for all authentication pillars.
- This standard governs the Learn / Check / Verify surfaces named in §0.
- Treat a deviation as a bug: stop, fix it to the standard, do not ship around it.
- To make this an auto-injected per-turn rule, add one line to the `docs/preferences.md`
  ENFORCED block pointing at this file (recommended once the in-flight docs reorg settles,
  so the change does not collide).
