# House stories batch — 14 new houses + corrections to the 14 authored

*Drafted 2026-06-30 by the seasonal-archive archivist. Research + drafting only.
Nothing here is written to the database or to app code. These are TS-ready blocks for
`src/lib/house-stories/data.ts` (shape per `src/lib/house-stories/types.ts`), reviewed
against `docs/voice-and-tone.md` and the brand-voice skill: no em dashes, sentence case,
warm and timeless, every factual claim dated and sourced, value/market read framed as a
tendency.*

**Icon vocabulary used (only these are valid):** saddlery, stitch, clasp, tag, calendar,
pin, tier, family, catalogue, flag, scissors, atelier, loom, trunk.

**How to read the dating hedges.** Where two reputable sources disagree on a year (Balenciaga
1917 vs 1919, The Row 2005 vs 2006, the Antigona 2010 vs 2011, Le Chiquito 2017 vs 2018),
I picked the claim I could anchor to the house's own page or a museum and noted the conflict
under that house. Where I could not source a claim confidently (the Michael Kors Jet Set
debut year), I left it out rather than guess. Two solid beats beat three shaky ones.

---

## 1. Alexander McQueen

```ts
{
  match: ["alexander mcqueen", "mcqueen"],
  lead: "A Savile Row-trained tailor who brought couture cutting to a London label of his own.",
  beats: [
    {
      icon: "scissors",
      lead: "London, 1992.",
      body: "Lee Alexander McQueen founded his namesake house and showed in London before later moving to Paris.",
    },
    {
      icon: "atelier",
      lead: "Trained on Savile Row.",
      body: "He left school at 16 to apprentice on Savile Row, cutting at Anderson & Sheppard then Gieves & Hawkes, the tailoring that shaped his sharp construction.",
    },
    {
      icon: "tag",
      lead: "The skull, since 2003.",
      body: "The skull-print silk scarf, first made in 2003, became the most recognised McQueen accessory.",
    },
  ],
}
```

**Sources**
- Founding 1992, London, Lee Alexander McQueen: Wikipedia, *Alexander McQueen*
  (https://en.wikipedia.org/wiki/Alexander_McQueen); house shows in London before Paris noted
  across designer biographies.
- Savile Row apprenticeship, left school at 16, Anderson & Sheppard then Gieves & Hawkes: V&A,
  *Alexander McQueen — an introduction*
  (https://www.vam.ac.uk/articles/alexander-mcqueen-an-introduction). Museum source, high confidence.
- Skull scarf first created 2003: Wikipedia, *Alexander McQueen*
  (https://en.wikipedia.org/wiki/Alexander_McQueen).

---

## 2. Balenciaga

```ts
{
  match: ["balenciaga"],
  lead: "The Spanish couturier other couturiers called the master, reborn as a streetwear-era powerhouse.",
  beats: [
    {
      icon: "scissors",
      lead: "Spain, 1917.",
      body: "Cristóbal Balenciaga opened his first couture house in San Sebastián, then established the maison in Paris in 1937.",
    },
    {
      icon: "clasp",
      lead: "The City, 2001.",
      body: "Nicolas Ghesquière's slouchy, moto-inspired bag, first known as the Motorcycle, took over fashion after Kate Moss carried it.",
    },
  ],
}
```

**Sources**
- Founded San Sebastián 1917, Paris 1937: Balenciaga official heritage timeline,
  *Cristóbal* (https://www.balenciaga.com/en-us/cristóbal-2) and Kering house page
  (https://www.kering.com/en/houses/fashion-and-leather-goods/balenciaga/).
- "The master" / "The Master of us all" reputation: V&A, *Introducing Cristóbal Balenciaga*
  (https://www.vam.ac.uk/articles/introducing-cristobal-balenciaga).
- City bag 2001, Ghesquière, formerly Motorcycle, Kate Moss: Harper's Bazaar UK,
  *History of the Hero: The Balenciaga City bag*
  (https://www.harpersbazaar.com/uk/fashion/shopping/a40443203/balenciaga-city-bag/);
  CR Fashion Book (https://crfashionbook.com/the-history-of-the-balenciaga-city-bag/).
- **Date conflict noted:** the house's own page and Kering say 1917; Wikipedia says 1919.
  I used the house's date (1917) and named San Sebastián. The brief's "1919" is the Wikipedia
  figure; flagging so the owner can pick the house line vs. the encyclopedia line.

---

## 3. Burberry

```ts
{
  match: ["burberry"],
  lead: "The English house that invented a weatherproof cloth, then dressed a century of officers in it.",
  beats: [
    {
      icon: "flag",
      lead: "England, 1856.",
      body: "Thomas Burberry opened his outfitter's shop at 21, building the house on practical, weatherproof clothing.",
    },
    {
      icon: "loom",
      lead: "Gabardine, 1879.",
      body: "He invented gabardine, a tightly woven cloth waterproofed before weaving so it kept rain out and still breathed, and patented it in 1888.",
    },
    {
      icon: "stitch",
      lead: "The trench's ancestor.",
      body: "His Tielocken coat, the trench's predecessor, proved popular with officers in the First World War.",
    },
  ],
}
```

**Sources**
- Founded 1856, Thomas Burberry: Burberry official, *Our Story*
  (https://us.burberry.com/c/burberry-world/heritage/our-story/).
- Gabardine invented 1879 (23 years after founding), patented 1888: Burberry official heritage
  (https://us.burberry.com/c/burberry-heritage/) and Burberry plc *History*
  (https://www.burberryplc.com/company/history).
- Tielocken as trench predecessor, popular with WWI officers: Burberry plc *History*
  (https://www.burberryplc.com/company/history).

---

## 4. Chloé

```ts
{
  match: ["chloé", "chloe"],
  lead: "A Paris house that helped invent luxury ready-to-wear, founded by a woman who wanted clothes she could actually live in.",
  beats: [
    {
      icon: "atelier",
      lead: "Paris, 1952.",
      body: "Egyptian-born Gaby Aghion founded Chloé to make soft, body-conscious clothes as an alternative to stiff couture.",
    },
    {
      icon: "scissors",
      lead: "Ready-to-wear, made luxe.",
      body: "Aghion is widely credited with helping coin prêt-à-porter, French for ready-to-wear, as a high-fashion idea.",
    },
  ],
}
```

**Sources**
- Founded 1952, Gaby Aghion, Egyptian-born: Wikipedia, *Gaby Aghion*
  (https://en.wikipedia.org/wiki/Gaby_Aghion).
- "Said to have coined prêt-à-porter": Wikipedia, *Gaby Aghion* (phrasing is "said to have
  coined," so the beat hedges to "widely credited with helping coin"); Rebag, *Chloé 101*
  (https://www.rebag.com/thevault/chloe-101-a-history/).
- Note: I left the Paddington and the Faye bags out. Both are real and well known, but I did
  not pull a dated debut source this pass; queue them for a follow-up if a third beat is wanted.

---

## 5. Givenchy

```ts
{
  match: ["givenchy"],
  lead: "The Paris house built on a friendship with Audrey Hepburn, who wore it on screen and off for decades.",
  beats: [
    {
      icon: "scissors",
      lead: "Paris, 1952.",
      body: "Hubert de Givenchy opened his house and made his name with the Bettina blouse, named for the model Bettina Graziani.",
    },
    {
      icon: "family",
      lead: "Audrey Hepburn's designer.",
      body: "Hepburn became his muse and lifelong friend, and he dressed her on and off screen from Sabrina onward.",
    },
    {
      icon: "tag",
      lead: "The Antigona.",
      body: "Riccardo Tisci's structured bag, introduced around 2010 to 2011, takes its name from Antigone, the Greek figure whose name reads as unbending.",
    },
  ],
}
```

**Sources**
- Founded Paris 1952, Hepburn as muse, Bettina blouse: Museo Thyssen, Hubert de Givenchy
  exhibition materials
  (https://www.museothyssen.org/en/thyssenmultimedia/hubert-givenchy-exhibition-related-videos);
  Bettina blouse named for Bettina Graziani: Wunderlabel biography
  (https://wunderlabel.com/lab/fashion-designer/hubert-de-givenchy-biography/).
- Antigona by Riccardo Tisci, name from Antigone meaning "unbending": Bustle,
  *Givenchy's Antigona* (https://www.bustle.com/style/givenchy-antigona-bag).
- **Date hedge:** debut sources split between 2010 and Fall/Winter 2011, so the beat says
  "around 2010 to 2011."

---

## 6. Goyard

```ts
{
  match: ["goyard"],
  lead: "A Paris trunk maker older than most of its rivals, known by a hand-painted chevron and almost no advertising.",
  beats: [
    {
      icon: "trunk",
      lead: "Paris, 1853.",
      body: "Goyard grew out of a Paris box and trunk house, taking the Goyard name when François Goyard took over the workshop.",
    },
    {
      icon: "loom",
      lead: "The Goyardine chevron.",
      body: "Edmond Goyard created the chevron-patterned Goyardine canvas in 1892, the hand-applied print the house is known by.",
    },
    {
      icon: "tier",
      lead: "Quiet by habit.",
      body: "The house has long stayed discreet and lightly advertised, part of why the chevron reads as a quieter signal than a logo print.",
    },
  ],
}
```

**Sources**
- Founded 1853 in Paris as a trunk maker, lineage from Maison Morel/Martin, François Goyard
  takes over: Wikipedia, *Goyard* (https://en.wikipedia.org/wiki/Goyard); house history,
  Maison Goyard (https://www.goyard.com/eu_en/goyard-history).
- Goyardine canvas created 1892 by Edmond Goyard: Goyard family history materials cited via
  the maison and reseller histories
  (https://cottagesgardens.com/the-history-of-maison-goyard-and-their-iconic-trunks/).
- **Important correction to a common myth:** the chevron is NOT from 1853. The house dates to
  1853; the Goyardine canvas is 1892. The beats keep these two facts separate so the page does
  not imply the print is as old as the house.
- The "quiet / lightly advertised" beat is framed as a tendency ("has long stayed discreet"),
  not a hard claim, in line with the value-read rule.

---

## 7. Jacquemus

```ts
{
  match: ["jacquemus"],
  lead: "A young French label that turned a bag too small to hold anything into a global signature.",
  beats: [
    {
      icon: "flag",
      lead: "France, 2009.",
      body: "Simon Porte Jacquemus showed his first collection at 19, naming the label with his mother's maiden name.",
    },
    {
      icon: "tag",
      lead: "Le Chiquito.",
      body: "His micro bag, which broke through around 2017 to 2018, shrank the handbag to a few centimetres and became the brand's calling card.",
    },
  ],
}
```

**Sources**
- Founded 2009, first collection at 19, Simon Porte Jacquemus: Istituto Marangoni
  (https://www.istitutomarangoni.com/en/maze35/game-changers/how-jacquemus-is-shaking-up-the-fashion-world);
  "Jacquemus" is the designer's mother's maiden name (widely documented in his biography).
- Le Chiquito micro bag: Vogue, *A Guide to Shopping the Iconic Bags*
  (https://www.vogue.com/article/jacquemus-handbags), which dates the debut to 2018; other
  trade write-ups place the first runway appearance in 2017.
- **Date hedge:** "broke through around 2017 to 2018" because Vogue says 2018 and several
  trade sources say 2017. Verify the mother's-maiden-name line against an interview before
  ship if you want it airtight; it is widely repeated but I did not pin a primary source this pass.

---

## 8. Kate Spade

```ts
{
  match: ["kate spade"],
  lead: "A New York label that made a crisp, practical nylon bag the starter handbag of the 1990s.",
  beats: [
    {
      icon: "flag",
      lead: "New York, 1993.",
      body: "Katherine Brosnahan and Andy Spade launched kate spade handbags in January 1993.",
    },
    {
      icon: "tag",
      lead: "The boxy nylon tote.",
      body: "The brand broke through on a simple, structured nylon tote, the Sam, bought as a practical first designer bag.",
    },
  ],
}
```

**Sources**
- Founded 1993, Katherine Brosnahan and Andy Spade: Wikipedia, *Kate Spade New York*
  (https://en.wikipedia.org/wiki/Kate_Spade_New_York); "kate spade handbags" launched
  January 1993 per biographical write-ups.
- The Sam, boxy black nylon, launched the brand: ABC7 obituary coverage
  (https://abc7chicago.com/post/kate-spade-fashion-designer-found-dead-in-apparent-suicide/3564311/).
- Note: kept this to two beats. A founder-death beat would be off-voice for a heritage strip,
  so it is omitted by choice.

---

## 9. Longchamp

```ts
{
  match: ["longchamp"],
  lead: "A French family house that started in pipes and tobacco, then folded a nylon tote into a travel staple.",
  beats: [
    {
      icon: "atelier",
      lead: "Paris, 1948.",
      body: "Jean Cassegrain founded Longchamp, first making leather-covered smoking pipes before moving into leather goods.",
    },
    {
      icon: "tag",
      lead: "Le Pliage, 1993.",
      body: "Its foldable nylon tote, named for the French word for folding, drew on origami to pack flat and became the house signature.",
    },
    {
      icon: "family",
      lead: "Still family-run.",
      body: "The Cassegrain family has run the house since founding, unusual for a maison of its scale.",
    },
  ],
}
```

**Sources**
- Founded Paris 1948, Jean Cassegrain, started with leather-covered pipes (took over his
  father's tobacco business "Au Sultan"): Wikipedia, *Longchamp (company)*
  (https://en.wikipedia.org/wiki/Longchamp_(company)); Longchamp official, *A family story
  since 1948* (https://www.longchamp.com/az/en/the-story-of-longchamp/);
  View from the Back (https://viewfromtheback.com/2021/03/14/french-fancies/).
- Le Pliage launched 1993, origami-inspired, "pliage" means folding: Longchamp official story
  page (above) and reseller/press coverage of the line.
- Family-run since 1948: Longchamp official, *A family story since 1948*.

---

## 10. Michael Kors

```ts
{
  match: ["michael kors", "kors"],
  lead: "An American designer who built an all-day, jet-set idea of luxury you can actually live in.",
  beats: [
    {
      icon: "flag",
      lead: "New York, 1981.",
      body: "Michael Kors launched his all-American sportswear label, built on a relaxed, luxurious take on everyday dressing.",
    },
    {
      icon: "tag",
      lead: "The Jet Set.",
      body: "Its Jet Set line of saffiano-leather totes became the brand's everyday signature, in keeping with its jet-set name.",
    },
  ],
}
```

**Sources**
- Founded 1981, all-American sportswear label: Michael Kors official, *About Us*
  (https://www.michaelkors.com/about-us.html).
- Jet Set as the signature tote line, saffiano leather: brand and reseller product pages
  (e.g. https://luhxe.com/blogs/guide/michael-kors-jet-set-travel-large-saffiano-leather-tote-bag).
- **Omission by design:** I could not find a reliable dated source for when the Jet Set
  tote debuted, so the beat avoids a year. Do not let anyone add one without a source.

---

## 11. Miu Miu

```ts
{
  match: ["miu miu"],
  lead: "Prada's younger, more playful line, named for Miuccia Prada's own childhood nickname.",
  beats: [
    {
      icon: "scissors",
      lead: "1993, the second line.",
      body: "Miuccia Prada launched Miu Miu as Prada's more experimental, youthful sister line.",
    },
    {
      icon: "tag",
      lead: "Named for Miuccia.",
      body: "Miu Miu was Miuccia Prada's own family nickname, not a separate person.",
    },
  ],
}
```

**Sources**
- Born 1993 from Miuccia Prada, the more independent/younger sister line: Prada Group official,
  *Miu Miu* (https://www.pradagroup.com/en/brands/miu-miu.html); Highsnobiety
  (https://www.highsnobiety.com/tag/miu-miu/).
- "Miu Miu" is Miuccia Prada's own childhood/family nickname: Highsnobiety (above);
  Spark Magazine (https://sparkmagazinetx.com/The-Prada-Woman-vs-The-Miu-Miu-Girl).
- **Correction to the brief's own note:** the brief described Miu Miu as "Miuccia Prada's
  younger sister line." That is right if "younger sister" means the line; it is wrong if it
  implies a literal younger sister. The name is Miuccia's own nickname. The beat states this
  plainly so the page can't be misread.

---

## 12. Off-White

```ts
{
  match: ["off-white", "off white"],
  lead: "Virgil Abloh's Milan label that put quotation marks and a zip tie at the centre of luxury streetwear.",
  beats: [
    {
      icon: "flag",
      lead: "Milan, 2012.",
      body: "Virgil Abloh founded Off-White, building it around diagonal stripes and the iconography of American cities.",
    },
    {
      icon: "tag",
      lead: "Quotes and a zip tie.",
      body: "Its signatures became the quotation marks around plain words and the red zip tie left on the product.",
    },
  ],
}
```

**Sources**
- Founded 2012 by Virgil Abloh, Milan: Complex
  (https://www.complex.com/style/a/tracewilliamcowen/off-white-taking-legal-action-over-quotation-marks-red-zip-ties);
  diagonal stripes and American-city iconography: Vox
  (https://www.vox.com/the-goods/2018/10/30/18027074/off-white-timeline-history-luxury-streetwear-virgil-abloh).
- Quotation marks and red zip tie as brand signatures: The Fashion Law
  (https://www.thefashionlaw.com/from-off-white-stripes-to-red-zip-ties-virgil-ablohs-approach-to-branding/);
  Complex (above).

---

## 13. The Row

```ts
{
  match: ["the row"],
  lead: "The Olsens' quiet-luxury house, named for the London street that built bespoke tailoring.",
  beats: [
    {
      icon: "scissors",
      lead: "New York, founded by the Olsens.",
      body: "Mary-Kate and Ashley Olsen established The Row in the mid-2000s, built on exceptional fabric and precise tailoring.",
    },
    {
      icon: "tag",
      lead: "Named for Savile Row.",
      body: "They named it after Savile Row, London's home of bespoke tailoring, for the idea that everything should feel tailored to the body.",
    },
    {
      icon: "tier",
      lead: "Quiet on purpose.",
      body: "The house built one of fashion's strongest reputations on restraint and almost no advertising, the read that made it shorthand for quiet luxury.",
    },
  ],
}
```

**Sources**
- Founded by Mary-Kate and Ashley Olsen, New York: The Row official, *About Us*
  (https://www.therow.com/pages/about-us), which says 2005; Wikipedia, *The Row*
  (https://en.wikipedia.org/wiki/The_Row_(fashion_label)), which says 2006.
- **Date hedge:** the house says 2005, Wikipedia says 2006, so the beat says "the mid-2000s"
  rather than pick a contested year. Swap in a single year only once the owner picks the source.
- Named after Savile Row, "everything felt as if it was tailored to your body": the Olsens in
  their own words (Instagram reel, https://www.instagram.com/reel/DNbUyFUA6vf/) and Vogue,
  *Behind The Row* (https://www.vogue.com/article/mary-kate-and-ashley-olsen-balancing-act),
  which calls the name "loosely derived from Savile Row."
- The "quiet luxury / almost no advertising" beat is framed as a read ("the read that made it
  shorthand"), not a verdict.

---

## 14. Valentino

```ts
{
  match: ["valentino"],
  lead: "A Roman couture house known for one specific shade of red and a studded everyday bag.",
  beats: [
    {
      icon: "scissors",
      lead: "Rome, 1960.",
      body: "Valentino Garavani opened his couture house on Rome's Via Condotti.",
    },
    {
      icon: "pin",
      lead: "Valentino red.",
      body: "The house is tied to one signature scarlet, Rosso Valentino, a red Garavani made his own.",
    },
    {
      icon: "tag",
      lead: "The Rockstud, 2010.",
      body: "Its pyramid-studded line, introduced on the Fall 2010 runway under Maria Grazia Chiuri and Pierpaolo Piccioli, became the brand's signature bag and shoe.",
    },
  ],
}
```

**Sources**
- Founded 1960, Rome, Via Condotti, Valentino Garavani: Wikipedia, *Valentino (fashion house)*
  (https://en.wikipedia.org/wiki/Valentino_(fashion_house)); 1960 salon on Via Condotti per
  brand-history write-ups.
- Rosso Valentino / Valentino red as a defining signature: documented across the house's own
  heritage and press (the "red that made history" framing); kept as a tendency, not a spec.
- Rockstud debut Fall/Winter 2010, pyramid studs, under Chiuri and Piccioli (co-creative
  directors from 2008): Glam Observer, *Iconic Fashion Pieces: Valentino Rockstud*
  (https://glamobserver.substack.com/p/iconic-fashion-pieces-valentino-rockstud).

---

# CORRECTIONS — fact-check of the 14 already-authored stories

I read `src/lib/house-stories/data.ts` in full and checked each authored beat against the
voice rules and against sources where a claim was checkable. Overall the file is in good shape:
on-voice, no em dashes, value claims hedged. A handful of items are worth a look before the next
build. None is a five-alarm error; they are precision and sourcing flags, ordered most to least
important.

## Worth fixing

1. **Hermès — founding year is 1837, but double-check the in-file copy reads cleanly.**
   The beat says "A Paris saddlery, 1837," which matches the house's own heritage (Thierry
   Hermès, harness and saddlery workshop, Paris, 1837). This is correct. No change needed; flagging
   only because it is the anchor date the whole page hangs on, so it should never drift.

2. **Louis Vuitton — "1896, against the fakes" is right on the year, slightly strong on the why.**
   Georges Vuitton did create the Monogram canvas in 1896, and deterring counterfeits was a stated
   motive. The phrasing "to make the house impossible to copy" overstates the result (it became the
   most copied print in luxury, which the lead itself notes). Consider softening the body to
   "designed to be hard to copy" so the beat and the lead do not contradict each other. Low priority,
   it currently reads as deliberate irony.

3. **Céline — "Triomphe clasp ... from chains on the Arc de Triomphe in 1971" should stay hedged.**
   The Arc de Triomphe origin story for the Triomphe is the house's own widely repeated account, and
   the 1971 date and Hedi Slimane's 2018 revival are well documented. This is fine as written. Only
   note: it is a house-told origin, so keep it as narrative, not forensic fact, if anyone tightens it.

4. **Bottega Veneta — Jodie naming is correctly told but is a "said to" story.**
   The beat says the Jodie "takes its name from a 1990s image of Jodie Foster using one to hide from
   the cameras." Resellers and the house frame this as an adopted name (the bag was originally
   nameless and took the name after the Jodie Foster paparazzi photo). The current copy is accurate
   in spirit. If tightening, "took its name from" is better than implying it was named that from
   launch. Low priority.

5. **Prada — "Milan, 1913 ... Galleria Vittorio Emanuele II" is correct; the nylon-backpack decade
   is the one to watch.** Mario Prada, 1913, Galleria Vittorio Emanuele II is right. The black nylon
   (Pocone) backpack that made nylon a status symbol is usually dated to the mid-to-late 1980s, which
   the beat captures with "in the 1980s." Fine. No change.

## Sound as written (checked, no change)

- **Chanel** — 2.55 named for its February 1955 debut, shoulder strap freeing the hands, the Boy
  named for Boy Capel by Lagerfeld: all correct and well sourced. The diamond-quilt-on-caviar-or-
  lambskin beat is accurate.
- **Gucci** — Florence 1921, Guccio Gucci inspired by luggage handled in London hotels, Horsebit and
  green-red-green web from equestrian gear, 1947 Bamboo bag with the flame-bent handle: all correct.
- **Dior** — 1947 New Look, 30 Montaigne address, Lady Dior tied to Princess Diana: all correct.
- **Saint Laurent** — 1961 house, Le Smoking tuxedo, LouLou named for Loulou de la Falaise with the
  Y-quilting, Sac de Jour under Hedi Slimane: all correct.
- **Fendi** — Rome 1925, Adele and Edoardo Fendi, 1997 Baguette carried under the arm "like a loaf of
  bread," Peekaboo built to show its interior: all correct. The "arguably began the It-bag era" hedge
  is the right call (the Baguette's *Sex and the City* moment is what cemented it).
- **Loewe** — Madrid 1846 as Spain's oldest luxury house, Jonathan Anderson reframing from 2013, the
  Puzzle cut from geometric panels: all correct.
- **Coach** — New York 1941, baseball-glove inspiration, Tabby reviving a 1970s silhouette, "most
  often found in US thrift stores" framed as a tendency: all correct and on-voice. Confirmed 1941
  Manhattan, six artisans, baseball-glove inspiration against Coach's own heritage materials.
- **Mulberry** — English leather character and the Bayswater named for a West London area: correct.
  Two beats is fine here.
- **Telfar** — Telfar Clemens, unisex, the Shopping Bag modeled on a department-store tote and
  nicknamed the "Bushwick Birkin," accessible-by-design ethos: correct and well-judged in voice.
  Note: the in-file lead says "since 2005," which matches the brand's own founding date for the
  label; fine.

## Voice / consistency note (applies file-wide)

Every authored beat already obeys the no-em-dash rule and frames value as a tendency. The new 14
blocks above match that register: leads are one short serif sentence, bold openers are a few words,
bodies are one sentence, and every market/quiet-luxury claim is written as a read, not a verdict.

---

## Handoff notes for whoever wires these in

- These blocks slot into `HOUSE_STORIES` in `src/lib/house-stories/data.ts`. Match the existing
  array style. Do not let an editor add an unsourced year (the Jet Set, the contested founding years)
  without a source.
- Four houses carry an intentional date hedge in the copy (Balenciaga, The Row, Givenchy Antigona,
  Jacquemus Le Chiquito). If the owner prefers a single hard year, pick the source first, then tighten
  the sentence; do not let the build "round" a hedge into a fact.
- Goyard is the one with a real myth to avoid: 1853 is the house, 1892 is the Goyardine canvas. Keep
  them separate.
- Content-lead spin-off: the Goyard "1853 house vs 1892 canvas" split and the Miu Miu "named for
  Miuccia, not a sister" correction are both clean GEO answer beats (a naming fact an answer engine
  can cite). If wanted, I can add them to
  `docs/research-drafts/seasonal-archive/content-ideas.md` as low-effort, high-leverage GEO plays.
```