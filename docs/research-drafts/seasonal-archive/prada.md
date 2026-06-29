# Prada: seasonal naming archive (models + materials/motifs + named colors)

*Archivist run, 2026-06-28 (house 10, "other houses" queue, after Fendi). Prada is a Regime A
house: it assigns official model names, so the model name IS the canonical key. Three layers
below: a Models table (with debut year + era where sourced), a Materials/signature-motifs table
led by the two house DNAs (Saffiano leather + nylon) and the inverted-triangle logo plaque, and
a Named-colors section. Every row carries a source URL and a confidence. Companion data file:
`prada.jsonl`.*

## The single most important thing about Prada naming: the TWO DNAs and the archive-year reissues (read first)

Three load-bearing facts shape every Prada listing:

1. **There are two house DNAs, not one: the nylon and the Saffiano.** Miuccia Prada's signature
   move was elevating utilitarian **nylon** ("she did to nylon what Gabrielle Chanel did to
   jersey"), debuting the **Vela backpack in 1984**; nylon is, in Prada Group's own words, "an
   emblem of the brand's DNA." The other DNA is **Saffiano**, the cross-hatch treated leather
   **invented and patented by Mario Prada in 1913**. A Prada bag is identified first by which of
   these two materials it is built in (the Galleria is the Saffiano flagship; the Re-Edition
   nylon bags are the nylon flagships). See §2.

2. **The "Re-Edition" bags are named by their ARCHIVE YEAR, and that is the decoder.** Prada
   mines its own 1990s/2000s archive and names each revival after the year of the original:
   **Re-Edition 1995** (a fall-1995 archive top-handle), **Re-Edition 2000** and **Re-Edition
   2005** (early-2000s nylon shoulder bags, reprised in late 2019 in recycled Re-Nylon). The
   number is not a size or a style code; it is the year the original debuted. This is the
   GEO-valuable Prada decoder, the way Hermès color codes or Chanel season codes are for those
   houses. (Note: Re-Edition 2000 vs 2005 differ by the strap, the 2000 has a fabric strap, the
   2005 has a Saffiano-leather strap.)

3. **Miuccia Prada is the long-time designer; Raf Simons joined as co-creative-director in 2020.**
   Miuccia took the reins in the late 1970s (the house was run by her mother Luisa for nearly 20
   years before that), launched ready-to-wear in 1988, and built the "ugly chic" aesthetic. The
   Cleo (SS2021) is noted as arriving "a year shy of Raf Simons' appointment as co-creative
   director." So the post-2020 bags (Cleo, Symbole, Arqué, Moon revival) are Miuccia + Raf era.

So Prada's naming weight sits on **the model + the material (Saffiano vs nylon) + the archive
year**, not on a per-season color lexicon (see §3).

## The honest finding on colors (the same as Dior, Gucci, YSL, Celine, and Fendi, NOT Hermès/Bottega)

**Prada does NOT publish a unique per-season color-name dictionary.** Like Dior, Gucci, Saint
Laurent, Celine, and Fendi (and unlike Hermès and Bottega Veneta), Prada leans on its **materials
+ the triangle logo** rather than a poetic seasonal-color lexicon. Editorial copy describes Prada
colors as plain descriptors ("inky black," "milky white," "powdery pistachio," "cherry red,"
"acid green," "millennial pink"), and Prada's own product field uses flat Italian/English shade
names (e.g. **Rosa** = pink, **Cammeo** = a cameo nude/beige). So this file's color layer is
honest and short, and says plainly where a named seasonal color does not exist rather than
inventing one. This puts Prada firmly in the "does not name its colors" camp.

## How to read confidence

- **high** = house/official fact (prada.com / pradagroup.com copy, an official date) or a fact
  cross-checked across two independent strong references.
- **medium** = single well-sourced reference site / reseller blog, consistent with the beat but
  not double-confirmed this run.
- **low** = single mention or established-beat knowledge not re-sourced this run; a lead to verify.

I did NOT invent a single model, motif, color, or year. Where a debut year was not cleanly
sourced this run, the row says so (null + "not sourced") rather than carrying a fabricated year.

---

## 1. Models (the canon, with debut year + era where sourced)

| Model | Identity (one line) | Debut / era | Material DNA | Status | Source | Confidence |
|---|---|---|---|---|---|---|
| **Galleria** | THE Prada flagship leather bag: structured rectangular tote in Saffiano, two top handles, two zip closures + a center compartment; **83 hand-finished pieces**; inspired by mid-century doctors'/medicine bags; named after the **Galleria Vittorio Emanuele II**, site of Prada's first 1913 store | **2007** | Saffiano leather | Current core icon | vogue (Galleria 2007, Saffiano patented by Mario Prada, 83 pieces); fashionphile (Galleria 2007, 83 pieces, medicine-bag inspired, name from the 1913 Galleria store); luxedigital (2007) | high |
| **Re-Edition 1995** | Demure structured top-handle bag (Galleria-like shape) in a brushed leather; restrained logo; revived as a quiet-luxury favorite (a Carolyn Bessette-Kennedy reference) | **archive: Fall 1995**; reissued **2022** | brushed leather | Current (revival) | vogue (Re-Edition 1995 debuted Fall/Winter 1995, structured like the Galleria, CBK favorite); luxedigital (reissued 2022 from a 1995 archive design, CBK) | high |
| **Re-Edition 2000** | Early-2000s nylon shoulder bag revived in recycled Re-Nylon; the **2000 has a fabric strap** (vs the 2005's leather strap); the Y2K-revival mini | **archive: c. 2000**; reissued **late 2019** | nylon / Re-Nylon | Current (revival) | vogue (Re-Edition 2000 + 2005 reprised late 2019 in Econyl); fashionphile (Re-Edition 2000 = fabric strap, 2005 = Saffiano leather strap) | high |
| **Re-Edition 2005** | The breakout Y2K-revival nylon shoulder bag: triangle logo, woven shoulder strap + removable chain strap + removable Re-Nylon zip pouch; the **2005 has a Saffiano-leather strap** | **archive: c. 2005**; reissued **late 2019/2020** | nylon / Re-Nylon + Saffiano trim | Current (revival) | vogue (Re-Edition 2005, reprised late 2019 in Econyl, chain strap + zip pouch); luxedigital (reissued ~2020 from 2005 archive, the breakout Y2K bag); fashionphile (2005 = Saffiano leather strap) | high |
| **Cleo** | Sleek curved shoulder bag with seamless 1990s lines, no hardware noise; brushed calfskin or lightweight **spazzolato** calf; flap or interior-snap silhouette; mini + regular | **Spring/Summer 2021** (Multiple Views collection) | brushed/spazzolato calf or brushed nylon | Current core | vogue (Cleo debuted in the Multiple Views SS2021 collection, brushed calfskin + spazzolato, a year shy of Raf Simons); fashionphile (Cleo, '90s lines, mini w/ flap); luxedigital (released 2021) | high |
| **Symbole** | Boxy structured tote with a **clochette** and the **triptych "Symbole" jacquard** of the triangle motif Mario Prada first used on the house's vintage trunks; lined in Re-Nylon; Large/Medium/Small/Mini + a camera-bag iteration | **Summer 2022** | jacquard (triangle triptych) / Re-Nylon lining | Current | fashionphile (Symbole tote 2022, the triangle first introduced on Mario Prada trunks, Re-Nylon lined); luxedigital (Symbole debuted summer 2022, triptych pattern, clochette) | high |
| **Arqué** | Sleek structured crescent/curved shoulder-or-crossbody bag drawn from an archival 2000s curve | **2023** | leather | Current | luxedigital (Arqué introduced 2023, an archival 2000s curve rendered sleek and structured) | medium |
| **Moon** | Soft crescent-shaped under-the-arm bag with a rectangular silver buckle + grommets "borrowed from the sailing world"; in Re-Nylon or puffed nappa leather | **archive: Spring 2002**; revived **2022** | Re-Nylon or padded nappa | Current (revival) | vogue (Prada Moon revisits a style that first debuted in the maison's spring 2002 collection, Re-Nylon or puffed nappa, sailing-world buckle); luxedigital (revived 2022 from an early-2000s shape) | high |
| **Cahier** | Boxy, **book-/trunk-shaped** bag ("Cahier" = French for "notebook") with ornate antique-inspired metal corners + a front buckle; in Saffiano or velvet | **Fall/Winter 2016** | Saffiano leather / velvet | Current | fashionphile (Cahier 2016, boxy trunk-like silhouette w/ front buckle); luxedigital (first released in Prada's FW2016 collection, "notebook" in French) | high |
| **Promenade (Saffiano Lux Tote)** | Soft structured tote, **also known as the "Saffiano Lux Tote"**; similar to the Galleria but more feminine, with curved corners + a gentler silhouette; protective metal feet, detachable strap | **2007** | Saffiano leather | Heritage/current | luxedigital (Promenade created 2007, also known as the Saffiano Lux Tote, similar to the Galleria but softer/curved corners) | medium |
| **Sidonie** | Vintage-inspired flap shoulder/crossbody with an oversized buckle nodding to old Prada travel trunks; detachable shoulder + crossbody straps | **Fall/Winter 2018** | Saffiano / leather | Current | luxedigital (Sidonie introduced for Fall/Winter 2018, front flap + oversized buckle, trunk heritage nod); theluxurycloset (Sidonie in Saffiano leather w/ gold rings) | medium |
| **Re-Nylon Backpack (Vela)** | The original Prada nylon backpack, **launched as the "Vela" in 1984**; the first application of Miuccia's nylon; rebranded the **Re-Nylon Backpack** on its 2019 Econyl reintroduction; the *10 Things I Hate About You* "Prada backpack" | **Vela: 1984**; **Re-Nylon: 2019** | nylon / Re-Nylon (Econyl) | Current core | vogue (Vela backpack introduced 1984, dubbed Re-Nylon Backpack since its 2019 reintroduction); fashionphile (Tessuto Nylon Backpack 1984, the "Vela," Re-Nylon range 2019); luxedigital (Re-Nylon backpack 2019) | high |
| **Bowler** | Elongated rectangular dome-shaped "bowling bag"; an instant early-2000s hit, much-imitated by newer Prada shapes | **2000** | nylon / leather | Heritage | fashionphile (Prada Bowler 2000, nearly sold out on release, elongated rectangular dome shape) | medium |
| **Dynamique Hobo** | Soft, lightweight no-fuss hobo with a magnetic top closure; runs in **Vitello Daino** leather | **2020** | Vitello Daino leather | Current | fashionphile (Prada Dynamique Hobo 2020, soft/lightweight, magnetic top, Vitello Daino) | medium |
| **Logo Tote (Raffia)** | Woven **raffia** tote with an embroidered Prada logo; a summer/vacation tote in many colors | **2021** | raffia | Current | fashionphile (Prada Logo Tote 2021, raffia, embroidered logo) | medium |
| **Nappa Antique Tote** | Roomy tote in a crinkly **antique nappa** leather wrinkled by hand; small/medium "portrait" + large "landscape" orientations | **Spring/Summer 2023** | antique nappa leather | Current | vogue (Nappa Antique Tote debuted SS2023, crinkly hand-wrinkled nappa, portrait/landscape sizes) | high |

### Models named in the brief covered above

Sourced with identity + (where found) debut year: Galleria, Re-Edition 2000 / 2005 / 1995, Cleo,
Cahier, Sidonie, Symbole, Arqué, Moon, the nylon Backpack/Vela, Promenade. The **Triangle bag**
and the **Double Bag** are addressed as honest leads below (the triangle motif is fully sourced as
the logo plaque in §2; a standalone "Triangle bag" model and the "Double Bag" did not surface with
a clean debut year this run). **BR4651-era classics** is a style-code reference, not a sourced
model name, so it is not logged as a model.

### Honest model leads (NOT invented, flagged low/unsourced)

| Model | Identity (beat knowledge) | Status this run | Note |
|---|---|---|---|
| **Triangle bag** | A small nylon pouch/shoulder bag fronted by the enamel inverted-triangle plaque; "Triangle" is used in the market as a descriptor for the triangle-logo nylon minis | identity = beat knowledge; no clean standalone debut year sourced | The **triangle logo plaque** itself is fully sourced (§2). Whether "Triangle bag" is an official model name vs a market descriptor for the triangle-logo nylon bags is unresolved this run; logged low, not invented. |
| **Double Bag** | A structured Saffiano tote with a double-compartment build (sometimes the market name for the Galleria's twin-zip construction) | not cleanly sourced this run | May be a descriptor for the Galleria's "two zipper closures + center compartment" rather than a distinct model. Logged low, queued. |

---

## 2. Materials / signature motifs (the two DNAs + the triangle plaque are the house identity)

| Motif / material | What it is | Origin / era | Source | Confidence |
|---|---|---|---|---|
| **Saffiano leather** | THE Prada leather DNA: a calf leather treated with a **cross-hatch finish** (a diagonal textured pressing) that is scratch-resistant and shiny; **invented and patented by Mario Prada in 1913**; the material of the Galleria flagship | **1913** (Mario Prada patent) | vogue (Saffiano, a material patented by Mario Prada); luxedigital (Saffiano leather, patented by Mario Prada); rebag (Saffiano invented and patented by Mario Prada in 1913); prada.com (the Galleria born 2007 in Saffiano) | high |
| **Nylon (Tessuto) — the house DNA** | The utilitarian woven nylon Miuccia elevated to luxury; "Tessuto" (Italian for "fabric") is the term resellers use for the classic Prada nylon; the **Vela backpack (1984)** was its first application; "she did to nylon what Gabrielle Chanel did to jersey." Prada Group: "nylon is an emblem of the brand's DNA" | first bag application **1984** (imagined in the 1970s) | vogue (Miuccia introduced the Vela backpack 1984, nylon over silk/leather); fashionphile (Tessuto Nylon, imagined 1970s, introduced 1984); pradagroup.com (nylon is an emblem of the brand's DNA) | high |
| **Re-Nylon (Econyl)** | The recycled/regenerated version of Prada's nylon: **ECONYL®**, a regenerated-nylon yarn made by Aquafil from reclaimed ocean plastic, fishing nets, carpet + industrial waste, recyclable indefinitely; **launched 2019** as a capsule of iconic silhouettes, expanded to RTW/footwear in 2020 | **2019** (project launch) | pradagroup.com (Prada Re-Nylon launched 2019, made of ECONYL, partnership with Aquafil, recyclable indefinitely); vogue (Re-Nylon since the 2019 reintroduction, Econyl from recycled ocean plastic); fashionphile (Re-Nylon range 2019, Econyl) | high |
| **Inverted-triangle enamel logo plaque** | THE Prada signature mark: the upside-down triangle, stamped **"dal 1913,"** that fronts the bags; the **triangle/triptych motif Mario Prada first used on the house's vintage trunks** more than a century ago; Miuccia embedded it in popular culture | motif **from 1913** (Mario Prada trunks); modern enamel plaque on bags | vogue (the triangle, flipped upside down, stamped "dal 1913," first used by founder Mario Prada); luxedigital (the upside-down triangle logo); fashionphile (Symbole applauds the triangle first introduced on trunks designed by Mario Prada) | high |
| **Vitello leathers (Vitello Daino, etc.)** | Prada's calf-leather family; **"Vitello" = Italian for "calf."** **Vitello Daino** is a soft pebbled deerskin-look calf (used on the Dynamique Hobo); other Vitello finishes (Vitello Phenix, smooth/grained calf) recur across the line | heritage leather family | fashionphile (Vitello Daino Dynamique Hobo); beat knowledge (Vitello = calf; Daino = the pebbled finish) | medium |
| **Spazzolato calf** | A glossy brushed calf leather, "slightly less slick than patent," used on the Cleo; a Prada finish name | modern | vogue (Cleo crafted in brushed calfskin + lightweight spazzolato calf leather, glossy, less slick than patent) | high |
| **Antique nappa** | A crinkly nappa leather wrinkled by hand (a labor-intensive process), used on the Nappa Antique Tote and the padded Moon; "transmogrification of the disagreeable into the gorgeous" | SS2023 (Nappa Antique Tote) | vogue (antique nappa leather, wrinkled by hand) | high |
| **Raffia** | Woven natural raffia, used on the summer Logo Tote and seasonal styles | seasonal | fashionphile (Raffia Embroidered Logo Tote) | medium |

### The Saffiano-vs-nylon decoder (the GEO-valuable distinction)

This is the detail buyers most often need, and the one worth owning: **Prada has two material
DNAs, and the bag's identity turns on which it is.**

- **Saffiano** = the patented **cross-hatch treated leather** (Mario Prada, 1913). Scratch-resistant,
  shiny, structured. The **Galleria**, **Promenade/Saffiano Lux Tote**, **Cahier**, and **Sidonie**
  are the Saffiano bags. This is "the leather Prada."
- **Nylon (Tessuto) / Re-Nylon** = the **woven nylon** Miuccia made into luxury (Vela, 1984), now
  remade in recycled **Econyl** (Re-Nylon, 2019). The **Re-Nylon Backpack**, **Re-Edition 2000 /
  2005**, **Moon**, and the **Symbole lining** are the nylon bags. This is "the nylon Prada."

Both wear the same **inverted-triangle plaque stamped "dal 1913."** A Prada listing is identified
by model + which of the two DNAs it is built in. (Source: Vogue + Fashionphile + Prada Group.)

*Note on the "Pocone"/"Pocono" nylon name: the specific original trade name for Prada's nylon
(often cited in older forum/beat sources as "Pocone" or "Pocono") did NOT surface in a usable
source this run. The sourced terms are **Tessuto** (the reseller term for the classic nylon) and
**Re-Nylon/Econyl** (the official recycled version). The "Pocone" name is logged as an unverified
beat lead, not stated as fact. Queue the prada.com archive / PurseForum Prada subforum to confirm.*

---

## 3. Named colors / signatures (the honest, short layer)

**Prada does not publish a unique per-season color-name dictionary** (the Dior / Gucci / YSL /
Celine / Fendi pattern, not the Hermès / Bottega one). The bag is identified by **model + material
(Saffiano vs nylon) + the triangle plaque**, and the colors are plain descriptors. So this layer
captures the descriptor convention Prada actually uses. Nothing here is invented; where a seasonal
color name does not exist I say so.

### How Prada names color (plain descriptors, sourced from editorial + product copy)

| Color descriptor | Type | What it is | Official/descriptive | Source | Confidence |
|---|---|---|---|---|---|
| **Rosa** | color | Italian for "pink"; a flat product-field shade name (e.g. on the Re-Edition 2000 mini) | descriptive (plain, Italian) | fashionphile (Mini Re-Edition 2000 in the color Rosa) | medium |
| **Cammeo** | color | Italian for "cameo": a nude/beige; a flat product-field shade name (e.g. on the Re-Edition 2005 mini) | descriptive (plain, Italian) | fashionphile (Saffiano Mini Re-Edition 2005 in the color Cammeo) | medium |
| **Cherry red / "powdery blue and pink"** | color | The Re-Edition 1995 palette, described in plain editorial descriptors, not house color names | descriptive (plain) | vogue (Re-Edition 1995 in a delicious cherry red, a slick black, and powdery blue and pink) | high |
| **"Inky black / milky white / powdery pistachio"** | color | The Cleo palette, described editorially; "inky black" is the most versatile reading | descriptive (plain) | vogue (Cleo offered in inky black, milky whites, and a powdery pistachio hue) | high |
| **"Millennial pink / acid green"** | color | The Moon palette of statement shades, alongside the browns/blacks; plain descriptors | descriptive (plain) | luxedigital (the Moon comes in statement shades from millennial pink to acid green, plus browns/blacks) | medium |
| **Talco** | color | Italian for "talc": a pale off-white, a flat product shade (e.g. on the Dynamique Hobo) | descriptive (plain, Italian) | fashionphile (Vitello Daino Dynamique Hobo in the colors Talco and Black) | low |

### What does NOT exist (stated plainly, not invented)

- **No per-season Prada color-name lexicon.** Unlike Hermès (Étoupe 18) or Bottega (Parakeet,
  Fondant), Prada does not name its seasonal colors. The naming weight is on the **material**
  (Saffiano vs nylon/Re-Nylon), the **model**, and the **triangle plaque**, with colors as plain
  descriptors (often flat Italian shade names: Rosa, Cammeo, Talco). Do NOT log invented Prada
  season colors. The Galleria's "pop colors" special edition (the Alex Da Corte / Scarlett
  Johansson campaign, Spring 2023) is an art-collaboration capsule, not a named-color system.

---

## Cross-house context: where Prada sits on the "names its colors" axis

This run adds Prada to the sourced cross-house contrast (see `bottega-veneta.md` / `fendi.md` for
the full frame):

- **NAME their per-season colors** (a real named-color lexicon exists): **Hermès** (Étoupe 18,
  Rouge H 46…), **Bottega Veneta** (Parakeet, Fondant, Porridge…).
- **Do NOT name most per-season colors** (plain descriptors, no house lexicon): **Dior**, **Gucci**
  (Rosso Ancora the lone exception), **Chanel** (style code + season code), **Saint Laurent**,
  **Celine**, **Fendi**, and now **Prada** — identified by **model + material (Saffiano vs nylon) +
  triangle plaque**, with shades as plain descriptors (Rosa, Cammeo, Talco).

So Prada is firmly in the Dior / Gucci / YSL / Celine / Fendi camp. Its distinctiveness is the
**two-DNA material regime** (Saffiano leather + nylon/Re-Nylon) and the **archive-year reissue
naming** (Re-Edition 1995 / 2000 / 2005), a model-and-material naming regime, not a color one.

---

## Cultural-layer read (dated 2026-06-28, hedged)

- **The Re-Edition nylon bags are the live engine, riding the Y2K revival.** The Re-Edition 2005
  in particular is framed as "the breakout Prada of the Y2K revival." My read, not a house
  statement: the archive-year nylon minis (2000/2005) are the bags driving the current Prada
  conversation, and the "name = archive year" decoder is the kind of clean fact that travels well.
- **The Galleria is the steady leather flagship; the Cleo and Symbole are the modern core.** The
  Galleria (2007, Saffiano) is the durable everyday icon resellers steer first-time buyers toward;
  the Cleo (2021) and Symbole (2022) are the photogenic Miuccia-plus-Raf-era shapes. My take, not
  confirmed by the house: among current Prada bags the Galleria, the Re-Edition nylon minis, the
  Cleo, and the Symbole are the four the market is built on.
- **Nylon-as-luxury is the enduring Prada story, now told through sustainability.** The 2019
  Re-Nylon pivot (Econyl) keeps the 1984 Vela narrative alive and recasts it as an ocean-plastic
  circular-material story (the SEA BEYOND / National Geographic campaigns, Cumberbatch/Watson).
  The safe long-term keys are the dated material + heritage facts (Saffiano 1913, Vela 1984,
  Re-Nylon 2019, triangle "dal 1913"), not any single season's campaign.

---

## What I could not source this run (queued)

1. **The "Pocone"/"Pocono" nylon trade name.** The specific original name for Prada's nylon did
   not surface; the sourced terms are Tessuto + Re-Nylon/Econyl. Logged as an unverified beat lead,
   not a fact. Target: prada.com heritage / PurseForum Prada subforum (Chrome path; prada.com is
   Akamai-risk for Firecrawl).
2. **A standalone "Triangle bag" model name + the "Double Bag."** The triangle *logo plaque* is
   fully sourced; whether "Triangle bag" is an official model vs a market descriptor for the
   triangle-logo nylon minis is unresolved, as is the "Double Bag." Logged low, not invented.
   Target: prada.com (Chrome) + PurseForum.
3. **Exact debut years for Arqué, Promenade, Sidonie, Bowler, Dynamique, Logo Tote** are
   single-sourced (medium); cross-check against a second reference or prada.com next run. The
   **Re-Edition 1995** archive year (FW1995) is double-sourced; the reissue year (2022) is from
   Luxe Digital.
4. **Auction-grade Prada sourcing.** No Christie's/Sotheby's Prada collecting-guide page surfaced
   this run (same as BV/YSL/Celine/Fendi); the clean free sources were Vogue (Prada Handbags 101,
   the workhorse), Fashionphile Academy, Luxe Digital (Jan 2026, very recent + per-model release
   years), Prada Group sustainability, and Rebag. Check Christie's/Sotheby's/Heritage Prada lots
   next run for auction-grade debut years on the Galleria/Cahier heritage pieces.
5. **"BR4651-era classics."** The brief's "BR4651" is a Prada style-code prefix, not a model name;
   no specific model was sourced under it this run. Not logged as a model (would be fabrication).
   Queue a PurseForum style-code thread to map the BR prefix to era if a code decoder is wanted.
