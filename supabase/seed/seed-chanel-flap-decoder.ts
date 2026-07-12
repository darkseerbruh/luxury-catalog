/**
 * Chanel flap decoder article (2026-07-11). Owner committed to "B" (family module + this
 * article) → PUBLISHED on insert, cross-linked from the bag-page flap family module.
 *
 * NEVER-INVENT: every dated fact traces to the archivist's sourced research 2026-07-11
 * (Spring 2021 "11.12" rename + style code A01112; East-West retired 2010; Extra Mini
 * discontinued 2019; the Fashionphile-vs-Rebag split on whether minis count as Classic
 * Flaps). Sources listed in-body. Value framed as our read of recorded resale, never an
 * appraisal. No prices asserted (they live on the bag pages).
 *
 * Idempotent by slug; status set on INSERT only. Re-runs refresh copy, not status/body
 * (DB is canon once edited on-site) unless --force-body.
 *
 *   npx tsx supabase/seed/seed-chanel-flap-decoder.ts [--force-body]
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const body = `Two Chanel flaps can sit side by side, look almost identical, and carry very different resale prices. The gap usually isn't the color or the condition. It's which flap you're actually holding, and Chanel's own names don't always make that obvious.

Here's how the models relate, and why the price tends to follow the structure.

> The name on the listing does more work than the logo: structure and status move the price, not the silhouette.

## The Classic Flap is the "11.12" (and here's the tell)

The bag most people mean by "Chanel flap" is the **Classic Flap**. Chanel revived the name **"11.12"** for it (a branding push from Spring 2021), after the original Medium's style code, A01112. It is not a new bag, it is a name Karl Lagerfeld's team used back in the 1980s.

Here is the part that confuses people, and it is dated: on **March 26, 2024**, Chanel relabeled the Medium on its own website as the "Classic 11.12 Handbag" and dropped the word "Medium" entirely. The other sizes still read "Classic Flap." So the "11.12" you see now is the Medium under its archival code name, not a size change.

Three things define it:

- A **structured double flap** (a second flap tucked under the outer one).
- The **CC turnlock** closure.
- The woven **leather-and-chain strap**.

The fastest way to separate it from its close cousin, the 2.55 Reissue, is the lock:

- **11.12** closes with the **CC turnlock**.
- **2.55 / Reissue** closes with the rectangular **Mademoiselle lock**.

Same house, similar shape, different bag.

## Classic Flap sizes: Small, Medium, Jumbo, Maxi

The Classic Flap (the double flap) comes in a set size run. There are really three vocabularies for it, and that is most of the confusion:

- **Small**
- **Medium** (about 25.5 cm). Chanel and the resale floor both call it the "Medium." Longtime collectors call it the **"M/L"** (Medium/Large), an older nickname for the same bag.
- **Jumbo** (about 30 cm). Every resale site calls it the "Jumbo." In the boutique, Chanel's own word for it has generally been **"Large."**
- **Maxi**

One caveat worth knowing: Chanel's size wording has drifted over the years, and its tags identify a bag by its **style code** (A01112 for the Medium/M-L, A58600 for the Jumbo), not a size word. So "Large" on its own is slippery, and some people even shorten the M/L to "the large." When precision matters, go by the style code, not the size word.

## Are the Minis "Classic Flaps"? The experts genuinely split

The **Minis** are a different line. Where the Classic Flap is a double flap, the Minis are **single-flap** bags:

- **Mini Rectangular**, which Chanel simply calls the "Mini Flap."
- **Mini Square**, listed as the "Mini Square Flap."

One myth worth clearing: the Minis are **permanent, recurring shapes**, remade season after season. They are not one-off limited editions.

Whether they count as "Classic Flaps" is a real disagreement, and we won't pretend it's settled:

- **Fashionphile** counts the Minis within the core flap range.
- **Rebag** says Chanel does not consider them Classic Flaps.

Both are credible resale authorities. Read it as a genuine split, and know that where a seller files a Mini can change how it's described and priced.

## The discontinued ones

Two more flaps turn up in searches and estate listings, and both are retired:

- **East-West Flap:** An elongated, horizontal **single flap**. A standalone model, retired in **2010**, and not a Classic Flap.
- **Extra Mini Flap:** The smallest true flap, **discontinued in 2019**.

Discontinued doesn't automatically mean worth more, or worth less. It means the bag tends to behave differently on resale than a permanent style does.

## Quick answer: which flap is which

Each bag below reads as model, then single or double flap, then status, then what else it's called.

- **Classic Flap ("11.12"):** Double flap. Permanent. The ~30 cm is the "Jumbo" on resale, "Large" in the boutique; the tag goes by style code, not a size word.
- **Mini Rectangular:** Single flap. Permanent. Chanel calls it the "Mini Flap."
- **Mini Square:** Single flap. Permanent. Listed as the "Mini Square Flap."
- **East-West Flap:** Single flap. Discontinued (2010). A standalone model, not a Classic Flap.
- **Extra Mini Flap:** Single flap, the smallest true flap. Discontinued (2019).

## Why near-identical flaps carry different values

This next part is our read of recorded resale data, not an appraisal of any one bag. A few things move the number, and they stack:

- **Structure:** Double flap versus single flap.
- **Status:** Permanent versus discontinued or seasonal.
- **Size, material, and condition** each push it further.

The pattern we see in the comps: **permanent double flaps generally command more than the single-flap Minis**, and discontinued or seasonal pieces tend to move on their own terms rather than tracking the permanent line. That's a general read of the market, not a verdict on what your bag is worth. Condition, leather, and hardware can carry any single bag well off the pattern.

## Find your exact flap

Not sure which one you're holding, or eyeing? Start with the lock and the flap count, then open the specific bag page to see its recorded resale range and how it sits against the rest of the line.

- Browse the **Chanel Classic Flap ("11.12")** page for the double-flap sizes.
- Compare the **Mini Rectangular** and **Mini Square** pages side by side.
- Check the **East-West Flap** page for the discontinued shape.

## Sources

- Fashionphile, "The Ultimate Chanel Flap Guide"
- Rebag, "Chanel 101: The Classic Flap / 11.12"
- PurseBop, on Chanel's March 26, 2024 relabel of the Medium to "Classic 11.12 Handbag"
- Chase Amie, "The Ultimate Chanel Classic Flap Guide" (boutique vs collector size words drift over the years)
- Bragmybag, "Chanel Discontinued Bags"
- Xupes and myGemma, Chanel size guides`;

const POST = {
  slug: "chanel-flap-names-decoded",
  title: "Chanel flap names, decoded: Classic vs Mini vs the discontinued ones",
  excerpt:
    "Classic, Mini, Jumbo, East-West: a plain-language guide to which Chanel flap is which, how the models relate, and why look-alike flaps carry very different resale prices.",
  body,
  brand: "Chanel",
  style: "Classic Flap",
};

async function main() {
  const { data: existing } = await db.from("post").select("post_id").eq("slug", POST.slug).maybeSingle();
  const { brandId, styleId } = await resolveTopic(POST.brand, POST.style);
  const content: Record<string, unknown> = {
    author_user_id: AUTHOR,
    slug: POST.slug,
    title: POST.title,
    excerpt: POST.excerpt,
    body: POST.body,
    topic_brand_id: brandId,
    topic_style_id: styleId,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    if (!process.argv.includes("--force-body")) {
      delete content.body;
      console.log("(body left untouched — DB is canon; pass --force-body to overwrite)");
    }
    const { error } = await db.from("post").update(content).eq("post_id", existing.post_id);
    console.log(error ? `UPDATE ERR ${error.message}` : `updated #${existing.post_id} ${POST.slug} (status preserved)`);
  } else {
    const { data, error } = await db
      .from("post")
      .insert({ ...content, status: "published" as const, published_at: new Date().toISOString() })
      .select("post_id")
      .single();
    console.log(error ? `INSERT ERR ${error.message}` : `published #${data!.post_id} ${POST.slug}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
