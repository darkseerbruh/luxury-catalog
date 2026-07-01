# Hermès house story — sourced lore draft

*Draft for owner review. Research + copy only. Nothing here is written to the DB or to
production code. Voice run against `/brand-voice` (no em dashes, warm and timeless, every
non-obvious fact dated and sourced, value/market claims hedged as our read).*

*Researched 2026-06-30.*

---

## 1. PROPOSED `brand.description` replacement (the drop-in)

Paste this into the Hermès `brand.description` field. It keeps the good opening sentence that
was already there and replaces the leaked engineering note entirely. Five sentences, no em
dashes.

> French luxury house founded in 1837 as a harness and saddlery workshop in Paris, where
> Thierry Hermès made riding gear for European nobility. As cars replaced carriages the family
> turned that saddle-stitching craft toward luggage and handbags, and the equestrian roots
> still show, in the Bolide that introduced the first zipper on a handbag in 1923 and in the
> blanket-stitch and saddle leathers carried across the line today. Six generations on, the
> founding family still controls the house, and each Birkin and Kelly is cut, stitched and
> signed by a single artisan from start to finish, which is a large part of why the waitlists
> and the resale premiums run the way they do. The bags are named with the same quiet logic:
> the Kelly for the princess photographed carrying it, the Birkin for the actress who sketched
> it, the Evelyne and Picotin straight from the stable. It is the rare house where the most
> wanted handbag in the world started as a tool for a horse.

Word/sentence notes for the owner:
- If the field needs to be shorter, cut the last sentence; sentences 1 to 4 stand on their own.
- "the most wanted handbag in the world" is a read, not a hard ranking. If you want it fully
  hedged, swap the final sentence for: *"It is the rare house where its most coveted bags began
  as tools for a horse."*
- No value figure is stated, so nothing here goes stale. The one soft market claim ("waitlists
  and resale premiums run the way they do") is framed as cause-and-effect, not a number.

---

## 2. SOURCES

Every non-obvious claim, with the URL and the date checked. Dates checked: 2026-06-30.

| Claim in the description | Source | URL |
|---|---|---|
| Founded 1837; Thierry Hermès; harness and saddlery workshop in Paris | Hermès, "Six generations of artisans" (house source) | https://www.hermes.com/us/en/content/235056-six-generations-of-artisans/ |
| 1837 founding date corroborated; Thierry Hermès (1801–1878); Grands Boulevards quarter | Worldtempus, "History of the Brand" | https://en.worldtempus.com/article/hermes-history-of-the-brand-14480.html |
| Harnesses/saddles made for European nobility; rue Basse-du-Rempart | Hermès house page (as above) | https://www.hermes.com/us/en/content/235056-six-generations-of-artisans/ |
| Bolide introduced the zipper on a handbag in 1923 (first handbag with a zip closure); Émile-Maurice Hermès | Sotheby's, "Complete History of the Hermès Bolide" | https://www.sothebys.com/en/articles/complete-history-of-the-hermes-bolide |
| Bolide / 1923 zipper corroboration | PurseBop, Hermès Bolide guide | https://www.pursebop.com/the-ultimate-hermes-bolide-bag-guide-from-classic-to-collectors-editions/ |
| Each Birkin/Kelly made start to finish by a single artisan; ~18–20 hours; signed at the end | Wikipedia, "Kelly bag" | https://en.wikipedia.org/wiki/Kelly_bag |
| "Painstaking work of the craftsman in his workshop" since 1837 (house framing of the single-artisan model) | Hermès house page (as above) | https://www.hermes.com/us/en/content/235056-six-generations-of-artisans/ |
| Family still controls the house; sixth generation (Axel Dumas) | European CEO, profile of Axel Dumas | https://www.europeanceo.com/profiles/the-new-black-axel-dumas-leads-luxury-giant-hermes-to-record-profit/ |
| Sixth-generation family control corroborated | Worthbury, "Who Owns Hermès?" | https://worthbury.com/report/who-owns-hermes-family-dynasty-history/ |
| Kelly named for Grace Kelly, the princess photographed carrying it | Wikipedia, "Kelly bag" | https://en.wikipedia.org/wiki/Kelly_bag |
| Birkin sketched by Jane Birkin on a flight; named after her | Sotheby's, "7 secret details about Jane Birkin's original Birkin" | https://www.sothebys.com/en/articles/7-secret-details-about-jane-birkins-original-birkin-revealed |
| Evelyne designed 1978 for equestrian/grooming use; perforated H for ventilation | Christie's, "Hermès Evelyne" | https://www.christies.com/en/artists/hermes/hermes-evelyne |
| Picotin name from a French unit of horse-feed measure; equestrian origin | Christie's, "The equestrian heritage of Hermès" | https://www.christies.com/en/stories/equestrian-heritage-of-hermes-ea639f8516974573a61edc845e7236e9 |

**Hedged / framed-as-read items (not stated as fact):**
- "the most wanted handbag in the world" and the waitlist/resale-premium line are **our read of
  the market**, not an appraisal or a ranking. The resale-premium dynamic is widely reported
  but varies by model, leather, color and hardware, so the description states it as a tendency,
  not a number. Treat any value claim as an estimate, not a verdict.

---

## 3. ICON CHECK — the three current Hermès icons

All three taglines in `src/lib/bag-stories/data.ts` are accurate and well-sourced. No
corrections needed. Detail below.

### Birkin
> "It began as a doodle on an airplane sick bag, and became the most expensive handbag ever sold."

**Accurate.** The 1981 Air France sketch is sourced to Sotheby's and WWD in the existing
`data.ts` entry. "Most expensive handbag ever sold" is sourced: Jane's original prototype sold
at Sotheby's Paris in July 2025 for 8.6 million euros (about 10.1 million USD with fees), the
record for a handbag. That figure carries its July-2025 date in the tidbit body, so it reads as
a dated record, not a live price. No change.

- Sotheby's record sale: https://www.sothebys.com/en/articles/world-record-hermes-birkin-sale
- Artnews corroboration: https://www.artnews.com/art-news/news/birkin-bag-sale-record-sothebys-paris-1234747227/

### Kelly
> "A 1930s bag for carrying saddles became the first It bag the day a princess used it to hide a pregnancy."

**Accurate, with one precision note.** The bag launched as the Sac à dépêches in 1935; Grace
Kelly was photographed using it in 1956, shortly after becoming Princess of Monaco, in a way
widely read as shielding her pregnant belly. Hermès only renamed it the Kelly officially in
1977. All three points are already sourced in `data.ts` (Wikipedia, Baghunter).

- One small accuracy flag, not a tagline change: the "hide a pregnancy" framing is the popular
  and widely repeated reading of the 1956 photo. It is the standard story and fine to keep. If
  you ever want it airtight, the defensible version is "used to shield her belly from the
  cameras," which is what the body tidbit already says.
- Source: https://en.wikipedia.org/wiki/Kelly_bag

### Constance
> "Named for a baby born the very day it left the workshop, and closed with a single bold H."

**Accurate as told ("as the story goes").** 1959, designed by in-house designer Catherine
Chaillet, named for the daughter she delivered around the day it shipped, H clasp that is also
the lock. The `data.ts` body correctly hedges with "as the story goes," which is right: this is
the house-repeated origin, sourced to Sotheby's and SACLÀB, not a documented birth record. Keep
the hedge. No change.

- Sotheby's: https://www.sothebys.com/en/articles/all-about-the-hermes-constance
- SACLÀB: https://saclab.com/the-constance-close-up/

---

## 4. RECOMMENDED ADDITIONS — more Hermès icons worth seeding

These are catalogue styles with clean, sourced origin stories, written in the same voice and
hedged the same way, so the owner can decide whether to add them to `bag-stories` later. Only
ones I can source confidently are included. Each is one line, no em dashes.

| Bag | Proposed tagline | Origin fact it rests on | Source (checked 2026-06-30) |
|---|---|---|---|
| **Bolide** | "The first handbag in the world to close with a zipper, brought back from a Ford factory in 1923." | Émile-Maurice Hermès saw the zipper on a US trip and put it on a handbag in 1923; the Bolide was the first zippered handbag. | https://www.sothebys.com/en/articles/complete-history-of-the-hermes-bolide |
| **Evelyne** | "Designed in 1978 to air out horse-grooming tools, with the perforated H punched for ventilation, not for show." | Created 1978 by Évelyne Bertrand, head of the riding department; perforated H was for airflow. | https://www.christies.com/en/artists/hermes/hermes-evelyne |
| **Picotin** | "Named for a French measure of horse feed, and shaped like the bucket that held it." | Picotin Lock launched 2002; name is the French unit for a horse's grain ration; bucket shape from the feed bag. | https://www.christies.com/en/stories/equestrian-heritage-of-hermes-ea639f8516974573a61edc845e7236e9 |
| **Garden Party** | "Born from the utility bags Hermès made for the stable and the garden, then taken to town." | Equestrian/outdoor utility-bag origin, later reworked as an everyday tote. | https://www.sothebys.com/en/articles/hermes-garden-party-the-ultimate-tote-bag |
| **Lindy** | "Introduced in 2007 and named for the Lindy Hop, a bag meant to move easily and be worn two ways." | Lindy launched 2007; name traced to the Lindy Hop dance and the bag's relaxed, versatile carry. | https://loveluxury.com/topics/hermes-lindy-origins/ |

**Held back (not confident enough to seed yet):**
- **Jypsière** — commonly told as a crossbody designed under Jean Paul Gaultier's Hermès
  tenure (mid-2000s), but I did not lock a clean primary or auction-grade source this pass.
  Worth a dedicated verify before seeding.
- **Roulis / Halzan / 24/24** — newer lines with thinner origin lore in the auction record;
  skip until sourced.

**Lindy/Garden Party confidence note:** the Bolide, Evelyne and Picotin lines are
auction-grade (Sotheby's/Christie's). The Garden Party origin is Sotheby's-sourced but the
exact debut decade varies across secondary write-ups, so the tagline avoids a hard year. The
Lindy name-origin rests on a strong secondary source (Love Luxury); if you want it airtight
before seeding, give it one more verify against a primary or auction listing.

---

## Handling notes for the owner
- This is the only file changed. No DB write, no migration, no app code touched.
- The single thing you need to paste is the block in section 1.
- The icon taglines in `data.ts` are already correct; nothing there needs editing.
- If you decide to seed the section-4 additions into `bag-stories`, that is a separate
  follow-up and should go through the same sourced, hedged format as the existing entries.
