# Naming quirks — collector raw material

**What this is:** a bank of the naming inconsistencies we discover while building the
ingest dictionary. Every one of these is something we had to learn the hard way to make
the data work, which is exactly the kind of thing a new collector wants to know.

**What this is not:** published copy. These are sourced facts waiting to be written up.
Voice and framing get applied when a piece is drafted, not here.

**Rule for adding:** only entries the archivist sourced to house documentation or to
consistent multi-reseller usage. Anything unverified stays out. Date every entry.

---

## 🧩 The one with the best story: Kate Spade's two halves

Kate Spade titles look like `Cedar Street Maise`. Neither half alone is the bag.

- **The street is the material.** Cameron Street and Cedar Street are crosshatched leather.
  Grove Street is boarskin embossed. Cove Street is saffiano. Mulberry Street is pebbled.
  katespade.com describes Cameron Street as "an update to the ever-popular Cedar Street
  collection… wipe-away crosshatched leather."
- **The name is the shape,** and it travels: `Cedar Street Maise`, `Cameron Street Maise`,
  `Matthews Street Maise` are the same silhouette in three different leathers.

So it works exactly like Louis Vuitton, where Speedy is the shape and Damier is the
material. Maise is the Speedy. Cedar Street is the Damier.

**Why a collector cares:** if you are shopping by name alone you are shopping by leather,
not by bag. Two "Cameron Street" bags can be completely different shapes. Cameron Street
alone covers Candace, Lucie, Maise, Sarah, Lottie and Byrdie.

*Sourced 2026-07-26 via katespade.com product pages.*

### The trap inside the trap

**`Newbury Lane Loden` is not a colour.** "Loden" reads like the green, but it is the style
name, and katespade.com sells it on an **ivory** bag (WKRU2462).

*Sourced 2026-07-26, katespade.com.*

---

## 🔄 Bags that changed names

| Bag | Was sold as | Now | Note |
|---|---|---|---|
| **Prada Galleria** | Saffiano Lux Double Zip Tote | Galleria | Renamed around 2015 to 2016. Resellers still split it across both names, so the same bag sits in two places |
| **Saint Laurent Kate** | Classic Monogram Tassel | Kate | Same bag, pre-rename listings use the old name |
| **Fendi 3Jours** | successor to the 2Jours | 3Jours | Introduced around 2014 |

**Why a collector cares:** searching the current name misses the older listings entirely,
and those are often cheaper because fewer people find them.

*Sourced 2026-07-26.*

---

## 👻 Bags the house never named

Chanel does not give official names to most of its vintage and seasonal pieces. The names
in circulation were invented by resellers and collectors, then stuck.

- **"Chanel Kelly"** — a vintage top-handle flap. Chanel never called it that. The name is
  borrowed from Hermès.
- **"CC Dome"** — covers both a 1990s caviar bowler and a modern zip clutch with chain.

We record these as **reseller-canonical**, never as house-official, and any page carrying
one says so.

**Why a collector cares:** you cannot authenticate against a name the house never used.
The name tells you what the market calls it, not what it is.

*Sourced 2026-07-26.*

---

## 🎭 Words that look like models and aren't

The single most common mistake, and the one we nearly shipped into the catalogue.

| Word | Looks like | Actually is |
|---|---|---|
| Chanel **Matelassé** | a model | the diamond quilting |
| Bottega Veneta **Intrecciato** | a model | the woven leather |
| Gucci **GG** / **GG Supreme** | a model | the monogram canvas |
| Prada **Tessuto** | a model | the nylon fabric |
| Saint Laurent **Grain de Poudre** | a model | an embossed pebble leather |
| Burberry **House Check** | a model | the check canvas |
| DKNY **Signature** | a model | the logo coated canvas |
| Ferragamo **Gancini** | a model | the double-hook clasp motif |
| Gucci **Interlocking G** | a model | the archive logo |

**Why a collector cares:** these words describe how a bag is made or decorated, not which
bag it is. "Chanel Matelassé" narrows nothing. Nearly every Chanel is matelassé.

*Sourced 2026-07-26. These were the nine highest-frequency candidates in our own data, which
is how close they came to becoming catalogue pages.*

---

## 🗺️ Houses that name bags after places

Two houses name lines after Manhattan geography, which is why their listings look alike.

- **DKNY:** Bryant Park, Gansevoort
- **Kate Spade:** Cameron Street, Cedar Street, Mulberry Street, Cobble Hill, Gold Coast

⚠️ **Kate Spade's "Mulberry Street" has nothing to do with Mulberry the house.** It is the
street in Little Italy. We assumed this was a seller error and were wrong.

*Sourced 2026-07-26, katespade.com WKRU4002.*

---

## 💥 The same name at different houses

First names get reused constantly across brands, so a bare name is never enough.

| Name | Used by |
|---|---|
| Amelia | Coach, Marc Jacobs, Kate Spade |
| Chelsea | Coach, DKNY |
| Greenwich | Michael Kors, DKNY |
| Millie | Kate Spade, DKNY |
| Robinson | Tory Burch |
| Allen Street | Kate Spade |

**Why a collector cares:** searching a first name alone returns four houses. And sellers get
this wrong too: we found **40 listings** filed as DKNY "Robinson", which is a Tory Burch line.

*Sourced 2026-07-26.*

---

## ✏️ How sellers misspell

| Correct | Seller writes | Count in our data |
|---|---|---|
| Céline **Triomphe** | "Triumph" | 255 |
| **Newbury** Lane | "Newberry" | 22 |
| **Saffiano** | "Saffia" (truncated) | 22 |

**Why a collector cares:** misspelled listings get less traffic, so they sit longer. Searching
the wrong spelling on purpose is a real tactic.

*Sourced 2026-07-26.*

---

## 📌 Smaller finds

- **Hermès Cabas H en Biais** takes its motif from a 1970s archive design. *(hermes.com H082831CAAE)*
- **Gucci Softbit** launched FW2025 as an oversized half-Horsebit. New enough that listings are still thin.
- **"MICHAEL Michael Kors"** is the diffusion line, not part of any model name.
- **Bottega Veneta "The Point"** is titled with the article. Listings that drop it to "Point" become unidentifiable.

---

## Where these come from

Each entry is a byproduct of the dictionary loop in
[seller-title-grammar.md](seller-title-grammar.md). When the archivist adjudicates a batch
of candidate model names, the rejections and corrections are the interesting part. Bank
them here rather than losing them to a commit message.
