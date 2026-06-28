# Bottega Veneta: seasonal naming archive (models + materials/techniques + named colors)

*Archivist run, 2026-06-28 (house 6, first of the "other houses" queue, after the big-five sweep).
Bottega Veneta is the important counter-case to Dior and Gucci: where those houses do NOT name
their per-season colors, **Bottega genuinely names its colors** (Parakeet, Fondant, Porridge,
Barolo, Travertine...), giving it a real, Hermès-like named-color layer. So this file has three
full layers: a Models table (with designer era), a Materials/signature-techniques table led by
Intrecciato (the house DNA), and a substantial Named-colors table. Every row carries a source URL
and a confidence, and every color is marked **official** vs **descriptive**. Companion data file:
`bottega-veneta.jsonl`.*

## How to read confidence

- **high** = house/auction fact, or a fact cross-checked across two independent strong references
  (e.g. a debut year confirmed by both Vogue and SACLÀB, or an official Kering/brand announcement).
- **medium** = single well-sourced reference site / reseller blog, consistent with the beat but not
  double-confirmed this run.
- **low** = single mention or established-beat knowledge not re-sourced this run; a lead to verify.

## Official vs descriptive (the rule I held for every color)

Bottega DOES name its colors, but I did NOT get those names from bottegaveneta.com this run (the
brand .com Akamai-blocks Firecrawl per the LV/Dior/Gucci warning, so it was not scraped). The
color names below come from reseller guides (Fashionphile's BV color guide) and the live trend
read. So:
- **official** = the color name is confirmed as Bottega's own house name by a strong source
  (e.g. Parakeet, reintroduced SS2021, named by the house and now part of BV's store/branding
  identity per Vogue + Fashionphile).
- **descriptive (reseller-attributed)** = the name is how a major reseller catalogs the color and
  is very likely BV's own name, but I did not confirm it against bottegaveneta.com or a lookbook
  this run. Treat as a strong lead at medium confidence, not yet a verified house fact. The
  bottegaveneta.com season pages + the luxbags.fr color-code database are queued for the
  owner-present Chrome path to promote these to official.

I did NOT invent a single color, model, technique, or year. Gaps are logged null/low, not filled.

## Hard rules I held to

1. **Model, technique, and color are separate facts.** Intrecciato (the weave) is a technique that
   crosses every model; Maxi Intrecciato / Padded Intreccio are its variants; the color sits on top
   of the leather. I did not collapse them.
2. **Designer era is load-bearing for BV dating.** Tomas Maier (2001-2018), Daniel Lee (2018-2021),
   Matthieu Blazy (2021-2024), Louise Trotter (Jan 2025-). Most modern It-bags map cleanly to one
   era; I attributed each where sourced. Blazy left for Chanel (Dec 2024 announce); Trotter came
   from Carven (official Kering announcement).
3. **A debut year conflict is flagged, not smoothed.** The Cabat is dated 2001 by Vogue and 2002 by
   SACLÀB. I logged it with the conflict visible (2001/2002), not averaged.

---

## 1. Models (the canon, with designer era)

| Model | Identity (one line) | Debut / era | Designer era | Status | Source | Confidence |
|---|---|---|---|---|---|---|
| Cabat | The original Intrecciato statement tote: unlined, open-top, woven leather and nothing else, a "number plate" in the detachable inner pouch; ~two days to craft, limited annual production | 2001 (Vogue) / 2002 (SACLÀB) | Tomas Maier (his first BV bag) | Current (heritage icon); Maxi Cabat is the Lee reissue | vogue (Cabat 2001, Maier's first); saclab (Cabat 2002, first Maier design) | high |
| Knot | The icon evening clutch: hinged minaudière crowned by a signature looped-knot closure, Intrecciato clad in luxe fabrics; inspired by a '70s archive box clutch | 2001 | Tomas Maier | Current (heritage icon) | saclab (Knot 2001, Maier, '70s archive inspiration, St Tropez retrospective 2004) | high |
| Veneta (hobo) | The seamless rounded hobo: one continuous Intrecciato curve that loops over the shoulder, zip closure, fully lined; the quiet-luxury workhorse of the Maier years | Maier era (2000s) | Tomas Maier | Heritage / recurring | saclab (Veneta hobo, continuous Intrecciato) | medium |
| Roma | Structured Intrecciato top-handle/tote of the Maier era; a more formal house shape | Maier era (2000s-2010s) | Tomas Maier | Heritage | saclab (Roma Mini Intrecciato); soldattire (Roma, Maier era) | medium |
| Pouch | Lee's first BV bag: supple calfskin folded and gathered like a dumpling, clam-like magnetic top; named the most-wanted product of 2019; now mini/chain/intrecciato variants | SS2020 (in stores 2019/2020) | Daniel Lee (his first contribution) | Current core | vogue (Pouch, SS2020, Lee's first); saclab (Pouch, most-wanted 2019) | high |
| Jodie | The knotted-handle hobo: born unnamed, renamed after a paparazzi shot of Jodie Foster shielding herself with a large black BV; Lee put a knot in the Hobo handle; comes Maxi / standard / Mini, always Intrecciato (except shearling) | Resort 2020 (in stores early 2020) | Daniel Lee | Current core | vogue (Jodie, Resort 2020, Jodie Foster naming, knot handle); fashionphile (Jodie) | high |
| Cassette | Small crossbody in the oversized Maxi Intrecciato weave ("a microscope view" of the classic weave); the Padded Cassette (FW2019) is the cult puffy version; later remixed with a gold chain | Pre-fall 2019 (Padded Cassette FW2019) | Daniel Lee | Current core | vogue (Cassette pre-fall 2019, Padded Cassette FW2019); saclab (Cassette, Maxi weave) | high |
| Arco | Structured Intrecciato top-handle tote (the "triangle" silhouette); a Lee-era day tote, also seen in shearling/Teddy | Lee era (~2019-2020) | Daniel Lee | Current / recurring | saclab (Arco Tote Medium, inventory) | medium |
| Sardine | The white-hot Blazy It-bag: curved like the Jodie but with a rigid rod handle shaped like a gilt sardine fish; woven lambskin body | FW2022 (Blazy's debut collection) | Matthieu Blazy (his debut) | Current core (white-hot) | vogue (Sardine, FW2022, Blazy debut, sardine-fish handle); luisaviaroma (Sardine, Blazy debut) | high |
| Kalimero | Cylindrical bucket bag that opened Blazy's debut show in oxblood; offered in loop / bucket-strap / mini iterations | FW2022 (Blazy's debut collection) | Matthieu Blazy | Current | vogue (Kalimero, opened Blazy's FW2022 debut, oxblood) | high |
| Clicker | Padded (not puffy) lambskin intreccio body on a shoulder strap of curved brass links recalling Elsa Peretti jewelry; a Blazy It-bag | Resort 2023 | Matthieu Blazy | Current | vogue (Clicker, resort 2023, brass links) | high |
| Andiamo | Structured-but-rounded calf Intrecciato bag with a brass bow/knot top hardware ("let's go"); offered in three sizes, earth tones (inky green, chalk white, reds) | SS2023 | Matthieu Blazy | Current core | vogue (Andiamo, SS2023, brass knot, three sizes); fashionphile (Small Andiamo) | high |
| Hop | Angular 3D-Intreccio hobo, slung over shoulder or arm; inspired by a 2002 BV hobo and "very much giving Jodie"; also a suede version | FW2023 | Matthieu Blazy | Current | vogue (Hop, FW2023, 3D Intreccio, 2002-hobo inspiration) | high |
| Parachute | Re-released roomy tote in handwoven Intrecciato, updated with BV's colors and the Andiamo-style metallic knot; two sizes, detachable strap on the smaller | Pre-fall 2024 (re-release) | Matthieu Blazy | Current | vogue (Parachute, pre-fall 2024, re-release, knot detail) | high |
| Lauren 1980 | A Pouch-lineage clutch named in homage to Lauren Hutton (who carried a BV Pouch in *American Gigolo*, referenced on the spring 2017 runway) | named ~2023-2024 (homage) | Matthieu Blazy era | Current | vogue (Lauren 1980, Lauren Hutton / American Gigolo homage) | medium |
| Liberta | The maison's smooth-leather flap crossbody: the one current bag NOT offered in Intrecciato; braided-rope-and-U-hardware closure; two sizes, debuted in soft/powder colors | FW2024 | Matthieu Blazy | Current (newest) | vogue (Liberta, FW2024 runway, not in intrecciato) | high |
| Olimpia | Small structured Intrecciato crossbody/shoulder bag; a Lee/Blazy-era day shape | Lee/Blazy era (~2020s) | Lee/Blazy era | Current / recurring | saclab (Olimpia Lamb, inventory) | low |

### Models named in the brief that I could NOT source a debut/identity for this run (logged honestly, not invented)

| Model | Status this run | Note |
|---|---|---|
| Loop | not sourced | A BV crossbody (small woven-strap shoulder bag) is widely referred to as the "Loop"/"Loop intrecciato," but I did not confirm its debut year or designer era from a strong source this run. Queued for verification; not logged as a dated fact. |
| Mount | not sourced | Briefed but not confirmed this run. Possibly the Lee-era "Mount" / envelope clutch silhouette; not verified, so not logged with a year. |
| Point | not sourced | Briefed but not confirmed this run. Not verified; not logged. |
| Campana | lead only | Surfaced in a TikTok caption this run ("Small Campana Bag... Pinecone and Dark Barolo") as a current BV model name, but no debut/era source. Logged as a model-name lead at low confidence, no year. |
| Sunshine | not sourced | Briefed but not confirmed this run (a Lee-era "Sunshine"/BV tote name circulates). Not verified; not logged with a year. |

*Honest scope note: I did not invent debut years or identities for Loop / Mount / Point / Sunshine.
The brief listed them as targets; rigor says a null with "not yet sourced" beats a fabricated row.
These are the first verification targets for the BV backfill (PurseForum BV subforum + bottegaveneta.com
via the Chrome path). Campana is logged only as a current model-name lead because a real caption used it.*

---

## 2. Materials / signature techniques (Intrecciato is the house DNA)

| Technique / material | What it is | Origin / era | Source | Confidence |
|---|---|---|---|---|
| **Intrecciato** | THE house DNA: the signature woven leather, made by hand-plaiting long strips of double-faced leather into a grid. Born of constraint, not design: Veneto ateliers' sewing machines could only handle thin leathers/fabric, so BV wove thin strips into something both beautiful and structurally strong. BV trains it at its Scuola dei Maestri Pellettieri. The logo-less house "signature" ("When your own initials are enough") | technique developed in the **1960s** (BV founded 1966); per Fashionphile "developed in the 1960s" | saclab (Intrecciato origin, sewing-machine constraint, Scuola dei Maestri Pellettieri); fashionphile (Intrecciato weave developed 1960s) | high |
| Maxi Intrecciato / Maxi Intreccio | Daniel Lee's oversized blow-up of the classic Intrecciato weave: the same plait at a much larger scale ("a microscope view"); the surface of the Cassette, Maxi Cabat, and Lee-era Pouch/Jodie variants | 2018-2019 (Daniel Lee) | saclab (Lee blew Intrecciato into a "Maxi" weave); fashionphile (Maxi Intrecciato, Nappa Maxi Intreccio Padded) | high |
| Padded Intreccio / Nappa Maxi Intreccio Padded | The puffy, padded version of the Maxi weave (the Padded Cassette, Padded Chain Cassette); the fashion-crowd favourite finish | FW2019 (with the Padded Cassette) | vogue (Padded Cassette FW2019); fashionphile (Nappa Maxi Intreccio Padded) | high |
| Nappa | Soft, smooth full-grain nappa leather; the base hide BV weaves into many Intrecciato bags (Nappa Intrecciato) | core BV leather | fashionphile (Nappa Intrecciato across the Jodie/Cassette/Pouch) | high |
| Butter Calfskin | BV's smooth, supple "butter" calfskin finish; a distinct hand from Nappa, used on the Pouch/Jodie and named in resale cataloging | core BV leather (named finish) | fashionphile (Butter Calfskin The Mini Pouch / Small Shoulder Pouch) | medium |
| Lambskin | Soft lambskin used for the woven body of the Sardine and Padded Cassette variants | core BV leather | vogue (Sardine woven lambskin body); fashionphile (Lambskin Maxi Intrecciato) | high |
| Grained / Brushed / Patent calfskin | Textured and finished calfskin variants (grained calfskin, brushed calfskin, patent nappa) that change how a BV color reads on the same weave | recurring finishes | fashionphile (Grained Calfskin / Brushed Calfskin / Patent Nappa Intrecciato variants) | medium |
| Shearling / Teddy | Shearling (and "Teddy" lamb-fur) versions of the Jodie/Arco for FW seasons | recurring FW finish | vogue (Jodie in shearling); saclab (Arco Tote Lamb fur Teddy) | medium |
| Exotic (Crocodile, incl. Himalaya) | Rare exotic-skin BV pieces (e.g. a Double Chain in Crocodile Himalaya); the top of the BV craft range | heritage / special | saclab (Double Chain, Crocodile Himalaya) | medium |

*Note: Intrecciato is BV's entire identity the way the Birkin's leathers are Hermès's, so it gets
the top-line treatment. The key honest detail (sourced, not folklore) is its ORIGIN as a workaround
for weak sewing machines, not a deliberate design flourish. Maxi Intrecciato (Lee) and Padded
Intreccio (Lee, FW2019) are the modern variants that drive the current resale vocabulary.*

---

## 3. Named colors (recent years first; official vs descriptive marked)

This is the layer that makes BV different from Dior/Gucci: **BV names its colors.** The flagship,
fully-sourced official color is **Parakeet** (the house green). The rest below are the BV color
names as a major reseller (Fashionphile) catalogs them, with Fashionphile's own descriptor in
parentheses. They are almost certainly BV's own names but were not confirmed against bottegaveneta.com
this run, so they are marked **descriptive (reseller-attributed)** at medium confidence and queued
for promotion to official via the Chrome path. Years are given only where sourced; most BV color
names below are undated in the reseller guide (BV rotates them across seasons), so year is null
unless a source dated it.

### The flagship official color

| Color | Type | Year | What it is | Official/descriptive | Source | Confidence |
|---|---|---|---|---|---|---|
| **Parakeet** (a.k.a. "Grass") | color | reintroduced SS2021 | BV's signature grassy/acid green, now synonymous with the brand and built into its store design and branding (the "Hermès orange / Tiffany blue" of BV); Daniel Lee's green moment | **official** | fashionphile (Parakeet, officially named, reintroduced SS2021, sometimes "Grass"); vogue/gucci-run cross-ref (Parakeet Green, Lee 2021, being "subtly fazed out" by 2023) | high |

### Neutrals (BV's quiet-luxury core)

| Color | Fashionphile descriptor | Official/descriptive | Source | Confidence |
|---|---|---|---|---|
| Porridge | ivory beige | descriptive (reseller-attributed) | fashionphile (Porridge, ivory beige) | medium |
| Almond | creamy beige | descriptive (reseller-attributed) | fashionphile (Almond, creamy beige) | medium |
| Dark Praline | warm beige | descriptive (reseller-attributed) | fashionphile (Dark Praline, warm beige) | medium |
| Teak | light brown | descriptive (reseller-attributed) | fashionphile (Teak, light brown) | medium |
| Caramel | classic tan | descriptive (reseller-attributed) | fashionphile (Caramel, classic tan) | medium |
| Camel | medium brown | descriptive (reseller-attributed) | fashionphile (Camel, medium brown) | medium |
| Fondant | deep warm chocolate | descriptive (reseller-attributed) | fashionphile (Fondant, deep warm chocolate); reddit r/handbags (Fondant vs Barolo discourse) | medium |
| Pinecone | muted earthy taupe | descriptive (reseller-attributed) | fashionphile (Pinecone); tiktok (Campana in Pinecone/Dark Barolo) | medium |
| Plaster | off-white | descriptive (reseller-attributed) | fashionphile (Plaster) | medium |
| Bone | off-white | descriptive (reseller-attributed) | fashionphile (Bone) | medium |
| Chalk | off-white | descriptive (reseller-attributed) | fashionphile (Chalk) | medium |

### Reds & pinks

| Color | Fashionphile descriptor | Official/descriptive | Source | Confidence |
|---|---|---|---|---|
| Amaranto | brick red | descriptive (reseller-attributed) | fashionphile (Amaranto, brick red) | medium |
| Firework | fire-engine red | descriptive (reseller-attributed) | fashionphile (Firework) | medium |
| Barolo | deep burgundy | descriptive (reseller-attributed) | fashionphile (Barolo, deep burgundy); reddit (Fondant vs Barolo); tiktok (Dark Barolo) | medium |
| Bordeaux | dark purple-red | descriptive (reseller-attributed) | fashionphile (Bordeaux) | medium |
| Sunburst | bright coral red | descriptive (reseller-attributed) | fashionphile (Sunburst) | medium |
| Candy Stripe | cherry red | descriptive (reseller-attributed) | fashionphile (Candy Stripe) | medium |
| Brique | dark brick red | descriptive (reseller-attributed) | fashionphile (Brique) | medium |
| Lollipop | deep pink | descriptive (reseller-attributed) | fashionphile (Lollipop) | medium |
| Ribbon | light pink | descriptive (reseller-attributed) | fashionphile (Ribbon) | medium |
| Peachy | beige pink | descriptive (reseller-attributed) | fashionphile (Peachy) | medium |

### Greens (BV's home territory beyond Parakeet)

| Color | Fashionphile descriptor | Official/descriptive | Source | Confidence |
|---|---|---|---|---|
| Travertine | light olive | descriptive (reseller-attributed) | fashionphile (Travertine, light olive); youtube (Mini Jodie in Travertine) | medium |
| Fennel | light mint | descriptive (reseller-attributed) | fashionphile (Fennel) | medium |
| Fountain | mint | descriptive (reseller-attributed) | fashionphile (Fountain) | medium |
| Kiwi | chartreuse | descriptive (reseller-attributed) | fashionphile (Kiwi) | medium |
| Mallard | dark teal | descriptive (reseller-attributed) | fashionphile (Mallard) | medium |
| Racing Green | emerald | descriptive (reseller-attributed) | fashionphile (Racing Green) | medium |
| Raintree | dark green | descriptive (reseller-attributed) | fashionphile (Raintree) | medium |
| Sauge / New Sauge | pale grey-green | descriptive (reseller-attributed) | fashionphile (New Sauge); saclab (Cassette Sauge Green inventory) | medium |
| Siren | pistachio | descriptive (reseller-attributed) | fashionphile (Siren) | medium |
| Aloe | grey-green | descriptive (reseller-attributed) | fashionphile (Aloe) | medium |

### Blues

| Color | Fashionphile descriptor | Official/descriptive | Source | Confidence |
|---|---|---|---|---|
| Ice | pale soft blue | descriptive (reseller-attributed) | fashionphile (Ice) | medium |
| Linoleum | muted teal | descriptive (reseller-attributed) | fashionphile (Linoleum) | medium |
| Space | deep inky blue | descriptive (reseller-attributed) | fashionphile (Space) | medium |
| Indigo | dark navy | descriptive (reseller-attributed) | fashionphile (Indigo) | medium |
| Blaster | bright teal blue | descriptive (reseller-attributed) | fashionphile (Blaster) | medium |
| Swimming Pool | bright aqua | descriptive (reseller-attributed) | fashionphile (Swimming Pool) | medium |
| Pale Blue | pale blue | descriptive (reseller-attributed) | fashionphile (Pale Blue) | medium |
| Shadow | dark slate blue | descriptive (reseller-attributed) | fashionphile (Shadow) | medium |

### Purples

| Color | Fashionphile descriptor | Official/descriptive | Source | Confidence |
|---|---|---|---|---|
| Wisteria | vibrant purple | descriptive (reseller-attributed) | fashionphile (Wisteria, vibrant purple) | medium |
| Lavender | lavender | descriptive (reseller-attributed) | fashionphile (Lavender) | medium |
| Unicorn | dark indigo | descriptive (reseller-attributed) | fashionphile (Unicorn) | medium |
| Holographic | iridescent green/purple | descriptive (reseller-attributed) | fashionphile (Holographic) | medium |

### "Washed" pastels (a named BV family)

| Color | Fashionphile descriptor | Official/descriptive | Source | Confidence |
|---|---|---|---|---|
| Bliss Washed | pink pastel | descriptive (reseller-attributed) | fashionphile (Bliss Washed) | medium |
| Teal Washed | blue pastel | descriptive (reseller-attributed) | fashionphile (Teal Washed) | medium |
| Mirth Washed | purple pastel | descriptive (reseller-attributed) | fashionphile (Mirth Washed) | medium |
| Lemon Washed | green pastel | descriptive (reseller-attributed) | fashionphile (Lemon Washed) | medium |
| Melon Washed | orange pastel | descriptive (reseller-attributed) | fashionphile (Melon Washed) | medium |
| Zest Washed | yellow pastel | descriptive (reseller-attributed) | fashionphile (Zest Washed) | medium |

*Honest scope note: only **Parakeet** is logged `official` (double-sourced as BV's own house color,
dated SS2021). Every other color is `descriptive (reseller-attributed)` at medium confidence: it is
how Fashionphile catalogs the BV color and is very likely BV's own name, but I did not confirm it
against bottegaveneta.com or a BV lookbook this run. Years are null because the reseller guide does
not date them and BV rotates colors across seasons. Promoting these to official + adding debut
seasons is the next BV unit (bottegaveneta.com via the Chrome path; luxbags.fr color-code database
for the serial color codes).*

---

## Cross-house context: the houses that NAME their colors vs the houses that don't (sourced)

This run nails down a real, sourced cross-house contrast that the catalog can build content on:

- **NAME their per-season colors** (a real named-color lexicon exists): **Hermès** (every color has
  an official name + numeric code, e.g. Étoupe 18, Rouge H 46 — see `hermes.md`), and **Bottega
  Veneta** (Parakeet, Fondant, Porridge, Barolo, Travertine... — this file). Plus single house
  signatures: Gucci's **Rosso Ancora**, Valentino's **PP Pink**, Burberry's **Knight Blue** (all
  sourced in `gucci.md`).
- **Do NOT name most per-season colors** (the color is a plain descriptor, no house lexicon):
  **Dior** (Lady Dior cannage rotates unnamed seasonal colors — see `dior.md`) and **Gucci** (GG
  Marmont / Dionysus rotate plain descriptors; Rosso Ancora is the lone named exception — see
  `gucci.md`). **Chanel** ships a style code + season code and leaves seasonal color unnamed (see
  `chanel.md`).

So BV sits with Hermès in the "names its colors" camp, which is exactly why it has a real
named-color archive worth cataloging. This is a genuine, sourced distinction, not a marketing line.

---

## Cultural-layer read (dated 2026-06-28, hedged)

- **BV's designer churn just reset twice, fast, and it matters for naming.** Daniel Lee
  (2018-2021) created the Pouch/Jodie/Cassette It-bag run and the Parakeet/Maxi-Intrecciato
  vocabulary; Matthieu Blazy (2021-2024) added the Sardine/Andiamo/Clicker/Kalimero/Hop run and a
  more crafty, color-rich palette; **Blazy left for Chanel** (announced Dec 2024) and **Louise
  Trotter** (ex-Carven) was named Creative Director, joining end of January 2025 (official Kering
  announcement). My take, not a house statement: the safe long-term keys are the now-established
  model names (Jodie, Cassette, Pouch, Sardine, Andiamo) and the house technique (Intrecciato);
  Trotter's new model/color names are the live unknown to watch.
- **The trend conversation is line-name + color-name led** (the worklist's 2026-06-28 TikTok read):
  collectors talk about a "Maxi Jodie in porridge," a "Sardine in fondant," an "Andiamo in
  chestnut." This is the read that confirmed BV is the richest house for colorway naming. Now
  sourced: porridge and fondant ARE real BV color names (Fashionphile), so the trend leads checked
  out. ("chestnut" was not in the Fashionphile guide; leave it as an unverified descriptor.)
- **The intrecciato look is being heavily duped right now** (worklist trend note): the woven look is
  mass-copied on Amazon/TikTok. A brand-health and authentication signal, not a naming fact, but
  worth watching for the authentication beat.

---

## What I could not source this run (queued)

1. **bottegaveneta.com was NOT scraped** (Akamai bot-shell risk per the LV/Dior/Gucci runs). So
   every color except Parakeet is reseller-attributed (descriptive), not yet promoted to official.
   Pull the bottegaveneta.com color pages via the owner-present Chrome path to confirm BV's own
   color names + their debut seasons, and to date the undated colors above.
2. **The luxbags.fr BV color-code + serial-number database** (surfaced this run) maps BV color names
   to their serial color codes. Not scraped this run; it is the source to turn the color list into a
   code-keyed lexicon (the BV equivalent of the Hermès color-code work). Queue it.
3. **Debut years/identities for Loop, Mount, Point, Sunshine** (briefed but not sourced) and **a
   debut/era for Campana** (a confirmed current model name, but undated). First verification targets
   for the next BV unit (PurseForum BV subforum + bottegaveneta.com via Chrome).
4. **The Cabat 2001-vs-2002 debut-year conflict** (Vogue 2001 / SACLÀB 2002). Resolve against an
   auction catalog (Christie's/Sotheby's BV lots) or bottegaveneta.com heritage.
5. **Auction-grade BV sourcing.** Unlike Hermès/Dior/Gucci, no Christie's/Sotheby's BV
   collecting-guide page surfaced this run; BV's clean sources this run were Vogue (models) +
   Fashionphile (colors) + SACLÀB (history/technique). Check Christie's/Sotheby's BV lots next run
   for auction-grade debut years on the heritage pieces (Cabat, Knot, Veneta).
