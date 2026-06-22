# Getting a licensed image feed — procurement guide

*Companion to `docs/image-strategy-research.md` (the legal "why") and the import
tool `supabase/seed/import-variant-images.ts` (the "how"). This doc is the
**"where do licensed photos actually come from, and how do I get one"** playbook.*

> **The one-line answer:** join the luxury resellers' **affiliate programs** and pull
> their **product datafeeds**. Those feeds legally include product **image URLs you
> may display** — *as part of promoting that merchant, with your affiliate link back
> to the live listing*. That is precisely the display-rights + link-back model our
> image strategy requires, and it's what the import tool's `image_source` field
> records for auditability.

---

## Why this is the right channel (not the 2022 CSVs)

The files in `data/raw/` are **2022 scraped/exported listing data** — not a licensed
feed. Using them would (a) re-create the copyright exposure `image-strategy-research.md`
warns about (reseller photos are licensed only while tethered to a **live** listing +
link), and (b) be full of dead 4-year-old URLs. A live **affiliate datafeed** fixes
both: the images come **with** a usage license and the links point at **current**
listings.

**Honest limitation:** an affiliate feed reflects **current inventory**, not the whole
catalogue. You'll get photos for variants that happen to be listed *right now*, and
those listings churn. So treat the feed as a **gap-filler** over an **owned base layer**
(first-party / UGC / CC), refresh it on a schedule, and prune dead links. `BagImage`
already degrades to the branded placeholder on a 404, so churn never looks broken.

---

## Step 1 — Join the affiliate programs (the supply)

Each major reseller runs an affiliate program, usually hosted on a network. Apply as a
publisher; approval is typically needed before you can download the datafeed.

| Merchant | How to join | Network (typical) |
|---|---|---|
| **The RealReal** | `therealreal.com/affiliates` | Impact / CJ |
| **Rebag** | via **CJ Affiliate** (Commission Junction) | CJ |
| **Fashionphile** | has an affiliate program — apply via their site/network | CJ / Impact |
| **Vestiaire Collective** | affiliate program via network | Awin / Rakuten / CJ |
| **Farfetch / others** | program per brand | Awin / Rakuten |

You'll end up with a **publisher account** on one or more of: **CJ Affiliate**,
**Impact**, **Rakuten Advertising**, **Awin**. (Aggregators like **Skimlinks/Sovrn**
or **DataFeedWatch** can consolidate multiple merchants' feeds if you'd rather not
manage each network.)

## Step 2 — Pull the product datafeed (the data)

Once approved, the network gives you a **product datafeed** (CSV/TSV/XML, often a
scheduled download or API). A feed row typically includes:

- product **name / description**, **brand/manufacturer**, **price**, **availability**
- one or more **image URLs** (large + thumbnail)
- the **destination/listing URL** (you replace the raw link with **your affiliate
  tracking link** — networks require this)

**License terms to read and honor** (they vary per network/merchant, but the pattern is
consistent):
- The feed grants a **limited license to display** the content **to promote the
  merchant** — not to resell, relicense, or strip it from the affiliate context.
- Display must stay tied to a **live listing + your affiliate link** (this is why the
  import tool stores the listing URL in `image_source`).
- Don't modify-then-redistribute the images; don't retain them after a listing dies.

## Step 3 — Import into the catalogue (the tooling — already built)

`supabase/seed/import-variant-images.ts` populates `variant.image_url` + `image_source`
and **records the listing URL for link-back**. Today its "feed mode" is wired to the
`data/raw/` reseller-export columns (`Designer`/`Bag name`/`Photos`/`Url`). Real
affiliate feeds use **different column names** per network (e.g. `name`, `imageurl`,
`linkurl`, `manufacturer`), so:

- **Quick path:** map the affiliate feed down to the importer's **direct mode**
  (`variant_id,image_url,image_source`) once — but that needs variant matching first.
- **Better path (small follow-up):** add a per-network **column mapping** to feed mode
  (e.g. `--map name="Bag name",imageurl=Photos,linkurl=Url,manufacturer=Designer`).
  ~30 min of work once you've picked a network and I can see its real header row.

Then: `npm run import:images <feed.csv>` (dry-run) → review matches → `--write --licensed`.

## Step 4 — Keep it fresh (the operations)

- **Schedule a refresh** (weekly/daily) — re-pull the feed, re-run the importer with
  `--overwrite` so prices/photos track live inventory.
- **Prune dead listings** — a future enhancement: null out `image_url` whose
  `image_source` listing 404s (or just rely on `BagImage`'s load-error fallback).
- **Affiliate links do double duty** — the same feed powers the "Where to buy" module,
  so image sourcing and monetization share one integration.

---

## Alternatives / the owned base layer (do these in parallel)

The affiliate feed is rented coverage. Own a durable base layer too:

1. **First-party photography** — shoot bags you/consignors physically have. You own the
   copyright outright; best for hero styles. Highest quality, fully yours.
2. **User-generated content (UGC)** — the spec'd photo-contributions system (upload +
   ownership attestation + UGC license + DMCA). Scales with the community; ties to the
   contributor-tier ladder.
3. **Creative Commons / public domain** — Wikimedia Commons, some Unsplash, for **hero
   / editorial** imagery. Verify each license (attribution, commercial use) per file.
4. **Stock (editorial license)** — Getty/iStock etc. carry branded-bag imagery under
   **editorial** licenses (display rights, per-image fee — not a bulk feed).
5. **Brand PR / lookbook assets** — sometimes available for retail-style coverage; check
   each brand's media-kit terms.

**Recommended posture:** first-party + UGC as the owned base; affiliate feed as the
live gap-filler; CC/stock for hero/editorial. Never AI-generated for real bags.

---

## Sources
- The RealReal affiliate program — https://www.therealreal.com/affiliates
- Rebag affiliate program (CJ) — https://www.affiliate-toolkit.com/program/rebag/
- CJ Affiliate publisher signup — https://signup.cj.com/member/signup/publisher/
- Affiliate product data feeds (overview) — https://www.practicalecommerce.com/Affiliate-Marketing-Using-Product-Data-Feeds
- Data feeds for affiliate channels — https://www.datafeedwatch.com/integrations/affiliate-data-feed
- Datafeed manager / image-URL fields — https://support.avantlink.com/hc/en-us/articles/4404406207501-Datafeed-Manager-Affiliate-User-Guide-Product-Datafeeds
- Feed license scope (limited use, replace links) — http://wiki.datafeedfile.com/DFFSKUExport
