# Chanel Classic Flap (11.12 / A01112) — production matrix

*Archivist-sourced 2026-07-11/12. The AUTHORITATIVE option set for the bag-page selector: what
Chanel PRODUCED, not what we have listings for. A produced option we lack a photo/price for is
still a real option (hedge: "no photo yet"), never greyed out. Greying = the house never made it,
sourced. Raw rows banked in `seasonal-archive/chanel.jsonl`; season-code map in `chanel.md`.*

**Name:** Chanel's own site now calls this **"Classic 11.12"**; "Classic Flap" is the market name;
"2.55" strictly = the Reissue (a different model, see Contamination). Source: chanel.com.

## Sizes (double-flap run)
*Chanel publishes no official spec; reseller measurements vary ±1-2 cm, so treat cm as approximate.*

| Size | Approx (cm) | Status | Note |
|---|---|---|---|
| Small | 23 × 14.5 × 6 | Permanent | |
| Medium ("M/L") | 25.5 × 15.5 × 6.5 | Permanent | most-produced; "M/L" = collector shorthand, tag says "Medium" |
| Jumbo ("Large") | 30 × 20 × 10 | Permanent | boutique word is "Large" |
| Maxi | 33 × 23 × 10 | **Read as discontinued ~2021-22** | reseller/collector read, NOT house-confirmed — verify before hard-coding |

Mini (Rectangular/Square) and East-West are SEPARATE styles, never sizes here.

## Materials
- **Permanent:** Caviar (grained calfskin), Lambskin (smooth). "Almost always offered in both."
- **Seasonal (rotate then retire):** Patent, iridescent/ombré calfskin, tweed, denim, jersey, velvet,
  embroidered/sequined, historic exotics (pre-2019 ban). Seasonal pieces also carry seasonal hardware
  (ruthenium/gunmetal, aged gold) vs the permanent gold/silver.
- **Rule:** a tweed/velvet/patent piece is a Classic Flap ONLY if it keeps the CC turn-lock + double
  flap + woven-leather chain. Material alone does not make it a Classic Flap; construction does.

## Construction / quilting
- **Diamond** — default/permanent. ✅
- **Chevron (herringbone)** — a GENUINE seasonal Classic Flap variation, same price, NOT contamination.
- So the selector may offer a Construction axis {Diamond (default), Chevron}; both are Classic Flaps.

## Contamination gate (the tell is the LOCK, not the quilt)
Genuine 11.12 marks: interlocking-CC turn-lock, double flap, burgundy interior, woven-leather chain,
straight rectangular flap. Exclude these look-alikes that get mislabeled "Classic Flap":

| Model | The tell |
|---|---|
| **2.55 Reissue** | Mademoiselle rectangular tuck-lock + all-metal aged chain (no CC). #1 mislabel; diamond-quilted too, so lock is the only tell |
| **Coco Handle** (2015+) | top handle + rounded flap; diamond OR chevron. The "rounded-flap Classic Flap" photos are very likely this |
| **Boy** | boy/push-lock, Portobello chain, wide panel quilting that reads "lined" |
| Seasonal AS-code flaps | style code AS##### (vs the 11.12's A01112); single-flap seasonal bags |

*Not title-detectable in our data (0 hits): the mislabels arrive as wrong PHOTOS on listings that read
"Classic Flap", so cleanup needs image/lock inspection, not a title filter.*

## Colours (the most-hedged axis)
**Chanel does NOT run an official seasonal colour-name lexicon** (Garde Robe: "Chanel does not name
specific shades"). So do not build a "Cruise 2019 «name»" grid of official names — there isn't one.

- **Permanent / recurring families (safe as first-class options):** Black (the anchor; black caviar +
  gold = most-requested), Beige (clair/rosé, shifts by season), White (+ off-white/ivory), Red
  (cherry→bordeaux), Navy (near-permanent, returns most years).
- **Seasonal colour model (recommended):** capture per listing as **free-text shade + season code**
  (18C/21P/26A…) tagged `descriptive`/`community`, NEVER promoted to an "official Chanel colour."
  Collectors also classify by **treatment** (pastel / bright / metallic / iridescent / ombré) — the
  reliable structured axis. Sourced season-coded examples: 18S iridescent emerald; 21P caramel.

## Open confirmations for the owner
1. **Maxi discontinuation** — verify with a hard source before flagging in-catalog.
2. **Colour data model** — permanent families as options + seasonal as tagged descriptor + season code
   (recommended), not a fake named-colour list.
3. Whether to add **Material** and **Construction** as selector axes now or after colour.
