# Materials taxonomy — the single source of truth

*Locked 2026-06-28. The canonical handbag material list lives in code at
`src/lib/materials.ts`. Everywhere materials appear on the site, pull from there.*

## Why this exists
The Style-read quiz and the Shop material filter used to define materials separately
(the quiz had 10 finishes, the shop classifier had 5 coarse families), so they drifted
and a few materials were even mislabeled as colors. Now there is **one list**, and both
surfaces import it, so they can never disagree. Update the list in one place and the
quiz, the shop filter, the classifier, and the tooltips all update together.

## The contract
- **Source:** `src/lib/materials.ts` → `MATERIALS` (the chips), `materialChip()` (the
  classifier), `QUIZ_FINISHES` (the quiz subset), `MATERIAL_CHIP_LABELS`, `materialIncludes()`.
- **Shop filter** classifies via `materialFamily()` in `listings-taxonomy.ts`, which now
  just calls `materialChip()`. `MATERIAL_FAMILY_NAMES` re-exports the chip labels.
- **Quiz** finishes are `QUIZ_FINISHES` (the chips flagged `quiz: true`).
- **Tooltips:** umbrella chips expose their contents via `materialIncludes(value)`.
- **To change materials:** edit `MATERIALS` only. Do not hardcode a material list anywhere
  else.

## The rules (owner-locked)
1. **Brand-neutral.** Materials describe style and texture, never a house's leather name.
   No "Caviar", "Togo", "Epsom" as chips; those classify into a generic texture chip
   (caviar/togo/epsom → *Pebbled or grained leather*; lambskin/box → *Smooth leather*).
   This keeps filtering about taste, not brand.
2. **A material earns its own chip** only if it is distinct, recognizable, and prevalent in
   our market data. Otherwise it aliases into the **Fabric** umbrella so a bag is always
   findable, never dropped to "Other".
3. **Umbrella chips** (Fabric, Exotic, Raffia or woven) carry an `includes` tooltip so a
   shopper can see what the bucket covers.

## The 14 chips
Smooth leather · Pebbled or grained leather · Suede · Patent · Exotic · Tweed ·
Raffia or woven · Shearling or fur · Canvas · Nylon · Fabric · Embellished · Velvet · Denim.

- **Nylon is its own chip** (iconic, prevalent, a clear sporty taste signal), so the umbrella
  is just **Fabric**, not "Nylon or fabric".
- **Crochet** lives under *Raffia or woven* (handcrafted, summer), not Fabric.
- **Fabric** aliases: satin, jersey, wool, cotton, silk, felt, mesh, knit, cashmere.
- Cut from Vivrelle's list: vinyl/PVC (low + faddy), and all jewelry materials (they rent
  jewelry; we are handbags only). Added from Vivrelle: Velvet, Denim.

## Quiz subset
The quiz asks the 10 taste-relevant finishes (`quiz: true`): smooth leather, pebbled,
suede, patent, exotic, tweed, raffia/woven, shearling/fur, embellished, nylon. Canvas,
Fabric, Velvet, and Denim are shop-filter chips, not quiz finishes.
