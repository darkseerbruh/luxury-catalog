# Luxury Catalog — Database Schema
*Last updated: June 2026*

---

## Core Principles

- All measurements stored in **centimeters (cm)** internally, converted to inches on display
- Size labels stored as **brand's official label** (Birkin 30, Coach Borough Medium) — never converted
- User measurement preference (metric / imperial) asked on first use, saved to profile
- Browser locale used as fallback for logged-out users
- Authentication information lives as close to the specific production record as possible — never generalized at brand level
- "Explicitly not produced" combinations are as valuable as "produced" — both are stored
- Confidence level tracked on all authentication-critical data

---

## Table 1: Brand

| Field | Type | Description |
|-------|------|-------------|
| brand_id | integer | Unique identifier |
| name | text | Chanel, Hermès, Coach etc. |
| country_of_origin | text | France, Italy, US etc. |
| founded_year | integer | Year brand was founded |
| tier | enum | thrift / mid / ultra-luxury |
| description | text | Brief brand overview |

**Note:** No authentication information at brand level. Authentication detail lives at variant and production record level only.

---

## Table 2: Style

| Field | Type | Description |
|-------|------|-------------|
| style_id | integer | Unique identifier |
| brand_id | integer | Links to Brand |
| name | text | Classic Flap, Peekaboo, Birkin |
| style_family | text | Some brands group styles into families |
| silhouette | enum | structured / semi-structured / slouchy / box / hobo / clutch / belt bag / tote |
| closure_type | text | flap, zipper, open, turn-lock, push-lock etc. |
| year_introduced | integer | When first produced |
| redesigned | integer | Year of significant redesign if applicable |
| discontinued | boolean | Yes/No |
| year_discontinued | integer | If applicable |
| description | text | Editorial overview of the style |

---

## Table 3: Variant

A variant is a specific production combination that actually existed. Every meaningful combination of size, construction, material, hardware, color, and market gets its own variant record.

| Field | Type | Description |
|-------|------|-------------|
| variant_id | integer | Unique identifier |
| style_id | integer | Links to Style |
| size_label | text | Brand's official size name (mini, medium, Birkin 30 etc.) |
| size_category | enum | Cross-brand size: mini / small / medium / large / oversized |
| construction_method | text | sellier, retourne, or brand-specific equivalent |
| rigidity | enum | rigid / semi-structured / slouchy — derived from construction method |
| exterior_material_id | integer | Links to Material table |
| exterior_colorway | text | Color name as the brand uses it |
| hardware_color | text | gold, silver, ruthenium, palladium, antique gold etc. |
| hardware_type | text | CC turn-lock, push-lock, buckle, zip etc. |
| strap_type | text | chain, leather, chain with leather weave, both, removable, none |
| strap_attachment_type | text | D-ring, O-ring, fixed chain, belt loops, none |
| interior_material_id | integer | Links to Material table |
| interior_color | text | Color of interior lining |
| interior_matches_exterior | boolean | Yes/No |
| stitching_color | text | Color of visible stitching |
| stitching_matches_exterior | boolean | Yes/No |
| market_availability | text | US, EU, Asia, global, limited release |
| year_start | integer | First year this variant was produced |
| year_end | integer | Last year produced, null if still in production |
| still_in_production | boolean | Yes/No |
| retail_price_original | decimal | Original retail price |
| currency | text | USD, EUR, GBP, JPY etc. |
| authentication_markers | text | Variant-specific authentication notes |

---

## Table 4: Production Record

The most granular level. Specific to a country of manufacture, production year, and season. Authentication detail at this level is the most precise and valuable.

| Field | Type | Description |
|-------|------|-------------|
| production_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| country_of_manufacture | text | France, Italy, Spain, US etc. |
| production_year | integer | Year of production |
| production_season | enum | SS (Spring/Summer) / FW (Fall/Winter) / Resort / Pre-Fall |
| dimensions_h_cm | decimal | Height in cm |
| dimensions_w_cm | decimal | Width in cm |
| dimensions_d_cm | decimal | Depth in cm |
| opening_width_cm | decimal | Width of bag opening in cm (if known) |
| opening_height_cm | decimal | Height of bag opening in cm (if known) |
| hardware_vendor_notes | text | Known hardware supplier details |
| screw_type | text | flathead, phillips, proprietary etc. |
| screw_engraving | text | What if anything is engraved on screws |
| date_code_format | text | Format of date code / serial for this production run |
| stamp_placement | text | Exactly where the brand stamp appears |
| stamp_font_notes | text | Font details, spacing, what it says |
| known_authentication_markers | text | Most granular authentication detail for this specific production run |
| sources | text | Where this information comes from |
| confidence_level | enum | low / medium / high / verified |

---

## Table 5: Material

Defined once, referenced by many variants. Applies to both exterior and interior materials.

| Field | Type | Description |
|-------|------|-------------|
| material_id | integer | Unique identifier |
| name | text | Caviar Leather, Lambskin, Saffiano etc. |
| material_type | enum | leather / exotic / fabric / coated canvas / other |
| water_resistance | enum | none / low / medium / high |
| scratch_resistance | enum | none / low / medium / high |
| weather_friendliness | enum | poor / fair / good / excellent |
| hardiness_overall | enum | delicate / moderate / hardy |
| care_notes | text | How to care for this material |
| authentication_notes | text | What real vs fake feels/looks like |
| resale_value_impact | text | How this material affects resale value |
| brand_context | text | Brand-specific variations of this material |

**Known materials include (not exhaustive):**

Leathers: Caviar, Lambskin, Calfskin, Goat, Saffiano, Epi, Togo, Clemence, Epsom, Box Calf, Veau Grainé, Chevre

Exotics: Ostrich, Crocodile, Alligator, Python, Lizard, Stingray

Fabrics/Other: Denim, Coated Canvas, Tweed, Nylon, Velvet, Jersey, Raffia, Wicker

---

## Table 6: Known Color Combinations

Stores both valid AND invalid combinations. "Never produced" is as valuable as "produced" for authentication.

| Field | Type | Description |
|-------|------|-------------|
| combination_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| exterior_color | text | Exterior colorway |
| interior_color | text | Interior color |
| stitching_color | text | Stitching color |
| hardware_color | text | Hardware color |
| produced | boolean | Yes = was produced, No = was never produced |
| market | text | Which market this combination was available in |
| year_range | text | Years this combination was produced |
| authentication_notes | text | What to look for, common fake combinations |
| confidence_level | enum | low / medium / high / verified |

---

## Table 7: Carry Methods

| Field | Type | Description |
|-------|------|-------------|
| carry_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| carry_type | enum | crossbody / shoulder / crossbody chest / belt bag waist / top handle wrist / top handle crook of arm / hand clutch / backpack |
| possible | enum | yes / no / depends |
| strap_drop_length_cm | decimal | Strap drop in cm (converted to inches on display) |
| strap_adjustable | boolean | Yes/No |
| notes | text | Caveats, body size considerations, practical notes |
| verified | boolean | Yes/No |

---

## Table 8: Fits

"Fits iPad" cannot be derived from dimensions alone due to bag shape and opening constraints. Each item must be verified explicitly.

| Field | Type | Description |
|-------|------|-------------|
| fits_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| item_name | text | iPhone 15 Pro Max, iPad Mini, Kindle Paperwhite, 13" MacBook etc. |
| fits | enum | yes / no / tight |
| verified | boolean | Yes/No |
| notes | text | Nuance — fits but zipper won't close, fits through opening but not flat etc. |
| contributor | text | Who verified this |

---

## Table 9: Interior Storage

Authentication-critical — pocket configuration changed over production years for many styles.

| Field | Type | Description |
|-------|------|-------------|
| storage_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| production_id | integer | Links to Production Record (config can change by year) |
| feature_type | enum | zip pocket / open pocket / card slot / divider / key hook / mirror / phone pocket / pen loop |
| quantity | integer | How many of this feature |
| placement | text | Back wall, front wall, side, center divider etc. |
| size_notes | text | Large enough for passport, phone etc. |
| material | text | Fabric, leather, suede lining |
| color | text | Color of this feature |
| authentication_notes | text | Changes over production years, common fake tells |
| verified | boolean | Yes/No |

---

## Table 10: Serial / Authentication Tags

| Field | Type | Description |
|-------|------|-------------|
| tag_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| production_id | integer | Links to Production Record |
| tag_type | enum | serial number / date code / hologram sticker / creed stamp / entrupy tag / dust bag code / authenticity card / RFID chip |
| format | text | What a valid tag looks like |
| placement | text | Exactly where it appears |
| material | text | Embossed / stamped / sticker / sewn label |
| year_range | text | When this format was used |
| how_to_read | text | What each character means — factory codes, date encoding etc. |
| authentication_notes | text | What fakes get wrong |
| verified | boolean | Yes/No |

---

## Table 11: Locks and Keys

| Field | Type | Description |
|-------|------|-------------|
| lock_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| production_id | integer | Links to Production Record |
| includes_lock | boolean | Yes/No |
| lock_type | text | Padlock, turn-lock, push-lock etc. |
| key_count | integer | How many keys included new |
| lock_engraving | text | What if anything is engraved on the lock |
| clochette_type | text | Leather type/color of clochette if present |
| authentication_notes | text | Lock authentication detail — weight, engraving depth, finish |
| verified | boolean | Yes/No |

---

## Table 12: Provenance & Packaging

| Field | Type | Description |
|-------|------|-------------|
| provenance_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| production_id | integer | Links to Production Record |
| item_type | enum | box / dust bag / authenticity card / receipt / care booklet / ribbon / tissue paper / extra hardware / spare leather / entrupy certificate / export certificate |
| included_new | boolean | Included with new purchase Yes/No |
| description | text | What it is |
| material | text | What it's made of |
| color | text | Color |
| branding | text | What's printed or embossed on it |
| format_by_year | text | How this item changed over production years |
| authentication_notes | text | Common fake tells, what to look for |
| value_impact_if_missing | text | How missing this item affects resale value |
| verified | boolean | Yes/No |

---

## Table 13: Price History

| Field | Type | Description |
|-------|------|-------------|
| price_id | integer | Unique identifier |
| variant_id | integer | Links to Variant |
| platform | text | Fashionphile, TheRealReal, Vestiaire, eBay etc. |
| condition | enum | new / excellent / very good / good / fair |
| provenance_completeness | enum | full set / partial / none |
| sale_price | decimal | Price the item sold for |
| currency | text | USD, EUR, GBP etc. |
| date_recorded | date | When this sale was recorded |
| notes | text | Any relevant context |

---

## Table 14: Searched Not Found

The product's own data roadmap. Top weekly searches with no results = what to build next.

| Field | Type | Description |
|-------|------|-------------|
| search_id | integer | Unique identifier |
| search_query | text | What the user searched for |
| date | timestamp | When searched |
| result_count | integer | How many results returned |
| user_id | integer | Anonymous okay |
| resolved | boolean | Has this gap been filled Yes/No |

---

## Table 15: User Feedback

| Field | Type | Description |
|-------|------|-------------|
| feedback_id | integer | Unique identifier |
| record_type | enum | style / variant / production / material / color_combination |
| record_id | integer | ID of the record being flagged |
| feedback_type | enum | inaccurate / missing information / confirm accurate / request addition |
| user_note | text | What the user says |
| date | timestamp | When submitted |
| resolved | boolean | Has this been addressed Yes/No |
| resolution_notes | text | What was done |

---

## Measurement Handling

- All measurements stored in **cm** only
- Converted to inches on display for imperial preference users
- Formula: inches = cm / 2.54
- User preference stored on profile; asked on first use, never assumed
- Browser locale used as fallback for logged-out users
- Size labels (Birkin 30, Coach Medium) are never converted — stored and displayed as brand official

---

## Populated Example: Chanel Classic Flap Medium, Black Caviar, Gold Hardware, US Market, FW 2019

### Brand
- name: Chanel
- country_of_origin: France
- founded_year: 1910
- tier: ultra-luxury

### Style
- name: Classic Flap
- style_family: Classic
- silhouette: semi-structured
- closure_type: CC turn-lock
- year_introduced: 1955
- redesigned: 1983

### Variant
- size_label: Medium (M/L)
- size_category: medium
- construction_method: semi-structured
- exterior_material: Caviar Leather
- exterior_colorway: black
- hardware_color: gold
- hardware_type: CC turn-lock, chain
- strap_type: chain with leather weave
- strap_attachment_type: fixed chain
- interior_material: Lambskin
- interior_color: burgundy
- interior_matches_exterior: No
- stitching_color: gold
- market_availability: global
- year_start: 2019
- retail_price_original: 6500 USD
- authentication_markers: Double flap interior, CC turn-lock engraving crisp and even, chain feels substantial not hollow

### Production Record
- country_of_manufacture: France
- production_year: 2019
- production_season: FW
- dimensions_h_cm: 15.5
- dimensions_w_cm: 25.5
- dimensions_d_cm: 7
- hardware_vendor_notes: French hardware supplier, screws flathead microscopically engraved with Chanel
- screw_type: flathead, gold tone
- date_code_format: Series 25 hologram, 7 digit number beginning with 25
- stamp_placement: Interior leather patch sewn into back wall of inner flap
- stamp_font_notes: CHANEL in clean serif capitals, PARIS underneath, Made in France below. Even spacing, no bleeding
- known_authentication_markers: Series 25 hologram introduced 2018. Rainbow iridescent shimmer when tilted. CC engraving deep and even. Chain weight approximately 180g
- confidence_level: high

### Known Color Combination (produced)
- exterior_color: black
- interior_color: burgundy
- produced: Yes
- market: global
- authentication_notes: Burgundy interior with black exterior is classic and common. Burgundy should be deep wine, not bright red or purple. Fakes often get this color wrong.

### Known Color Combination (never produced)
- exterior_color: black
- interior_color: bright red
- produced: No
- authentication_notes: Bright red interior with black exterior was never produced. If you see this, it is fake.

### Carry Methods
- crossbody: depends — chain length makes true crossbody difficult for wearers 5'6"+
- shoulder: yes — strap drop 39cm
- top handle wrist: no — no top handle on Classic Flap medium

### Fits
- iPhone 15 Pro Max: yes — tight in zip pocket, better in open pocket
- iPad Mini: no — too wide for opening
- Kindle Paperwhite: tight — fits but closes with difficulty

### Interior Storage
- 1x zip pocket, back wall of inner flap
- 2x open pockets flanking zip pocket
- authentication_notes: Post-2008 medium has ONE zip pocket. Pre-2008 different configuration. Two zip pockets on a medium = fake or pre-2008.

### Serial / Authentication Tags
- tag_type: hologram sticker
- format: Series 25, 7 digit number beginning with 25
- placement: Interior leather patch, back wall
- year_range: 2018–2021
- how_to_read: First two digits = series. Series 25 = 2018–2021. Full series list available.
- authentication_notes: Rainbow shimmer when tilted. Flat sticker = fake. Crisp numbers, not smudged.

### Locks and Keys
- includes_lock: No
- authentication_notes: Classic Flap has no separate lock. Padlock on a Classic Flap = wrong style or fake accessory.

### Provenance & Packaging
- dust bag: Black flannel, white CHANEL serif font, white drawstring cord. Post-2010 style.
- authenticity card: White card with matching hologram serial. Note: Post-2021 Chanel moved to digital authentication — no physical card.
- box: Black box, white ribbon, CHANEL in white on lid
- authentication_notes: Box alone never authenticates a bag. Authenticity card serial must match bag hologram exactly.

---

## Schema Decisions Still To Make

1. **Photos** — legal and licensing unresolved. Launch text-first, add photos via partnership or user contribution later.
2. **User accounts** — what data do we store per user? Watchlist, measurement preference, search history, feedback history.
3. **Authenticator profiles** — separate table needed for the Thumbtack marketplace feature (post-launch).
4. **Affiliate links** — where do reseller links live? Probably a separate table linked to variant.
5. **Search indexing** — natural language search is implemented via Anthropic API query parsing → Supabase query construction. Evaluate pgvector for semantic search post-launch if query parsing proves insufficient.

---

*Schema is the foundation. Build this first before any frontend. Seed with 2–3 complete bag entries before building search.*
