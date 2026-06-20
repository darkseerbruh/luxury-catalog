# Marketing Plan — Implementation Status

*Created 2026-06-20. Tracks what was built from `docs/marketing-plan.md` (canonical: `Luxury_Catalog_Marketing_Plan.docx`) and what still needs you (the operator). Built autonomously while you were away — everything below is code/assets that compound; nothing outward-facing or irreversible was done on your behalf.*

---

## ✅ Built this session (in branch `claude/review-ugc-wishlist-handoff-uiymgv`)

All verified: `tsc --noEmit`, `eslint` (new files), and `next build` pass.

### GEO — "optimize for citation, not just ranking" (Decision 2)
Every `/bag/[variantId]` page now:
- **Front-loads the answer** — a fact-dense declarative lead (`buildLeadAnswer`, `src/lib/geo.ts`) composed *deterministically from real catalog fields* (no LLM, so it can't invent authentication facts). Also used as the meta description.
- **Maximizes fact density** — dimensions now render in **cm and inches**; years, prices, materials, hardware all surfaced.
- **Structured data (schema.org)** — JSON-LD for **Product**, **FAQPage**, and **BreadcrumbList** injected per page. A visible FAQ section mirrors the FAQPage markup.
- **E-E-A-T signals** — named author byline (`AUTHOR_NAME`), a "Catalogued {month year}" date, and a **cited Sources** section built from each production record's `sources`.
- **`generateMetadata`** — per-page `<title>`, description, canonical URL, OpenGraph/Twitter. The detail fetch is deduped via React `cache()`.

### Discoverability
- **`/sitemap.xml`** (`src/app/sitemap.ts`) — one entry per bag variant + brand, auto-generated from the DB.
- **`/robots.txt`** (`src/app/robots.ts`) — crawlable everywhere except `/admin`; points crawlers (incl. Bing → ChatGPT) at the sitemap.

### Monetization decision point (Decision 3)
- **`AffiliateLinks`** on every bag page — both sides of the transaction: **"where to buy"** (search deep links) and **"where to sell what you found"** (consignor-referral links), diversified across **The RealReal, Fashionphile, Vestiaire, Rebag**. `rel="sponsored nofollow"`, with a disclosure line. Affiliate IDs are injected from env vars (`src/lib/affiliates.ts`).

### Owned audience (Tier 2)
- **Email price/availability alert capture** — no-auth `PriceAlertSignup` on every bag page → `subscribeToBagAlert` action → `bag_alert_subscription` table (migration `0003`). "Watch this bag," not a newsletter.

### Already shipped earlier this session (related)
- UGC layer: `user_bag` (collection/wishlist), reviews + structured tags, migration `0002`, and the `/me/*` pages. The signed-in watchlist (`notify_on_availability`) is the richer version of the email capture above.

---

## ⏳ Needs you — outward-facing / account / infra actions (NOT done autonomously)

These are irreversible, cost money, require your accounts/identity, or need credentials this environment doesn't have. **Ordered by leverage.**

1. **Apply to the affiliate + consignor programs** — buyer-affiliate **and** consignor-referral at The RealReal, Fashionphile, Vestiaire, Rebag (Decision 3; approval takes time, start now). When approved, set these Vercel env vars and adjust the link format in `src/lib/affiliates.ts` to each network's real deep-link spec:
   `NEXT_PUBLIC_AFF_THEREALREAL`, `NEXT_PUBLIC_AFF_FASHIONPHILE`, `NEXT_PUBLIC_AFF_VESTIAIRE`, `NEXT_PUBLIC_AFF_REBAG`.
2. **Run the migrations** against Supabase (needs the service-role key): apply `0002_ugc_layer.sql` and `0003_bag_alert_subscription.sql`, then re-run the hero seed. (Same credential gap as the existing seed/DNS items.)
3. **Set site env vars** in Vercel: `NEXT_PUBLIC_SITE_URL` (→ `https://luxurycatalog.com` once DNS is live; defaults to the vercel.app URL) and `NEXT_PUBLIC_AUTHOR_NAME` (your real name strengthens the E-E-A-T signal — currently "Luxury Catalog Research Desk").
4. **Submit the sitemap** to **Google Search Console** and **Bing Webmaster Tools** (Bing powers ChatGPT search — five-minute, high-leverage). The sitemap is already generated at `/sitemap.xml`.
5. **Build the alert *sender*** — capture is done; actually emailing watchers when a price drops / listing appears needs an email provider (e.g. Resend) + a scheduled job reading `bag_alert_subscription` and `user_bag` with the service role. This is the next engineering task and can be done in-session once an email key exists.
6. **Enable Supabase Auth** — gates the full UGC layer (collection/wishlist/reviews). See `src/lib/auth.ts`; wiring it is a one-file change.
7. **Strategic / human-only** (from the plan, intentionally left to you): batch-film the TikTok thrift-reveal content; get legal counsel on reference-photo fair use before scaling images; run the monthly **GEO baseline** (ask ChatGPT/Claude/Perplexity/Gemini your 30 key bag questions, log who's cited); defer paid ads until per-visitor affiliate value is known.

---

## Notes / judgment calls
- **Front-loaded answers and FAQ are generated from structured data, not an LLM** — deliberately, to honor the plan's "authentication accuracy = brand risk" rule and the brief's "never invent." When you add the AI editorial layer, keep human QC on `confidence_level`-flagged claims.
- The affiliate links are real deep links today (they work, just unattributed until step 1). Nothing publishes or spends money on its own.
- **Content roadmap is already wired**: the `searched_not_found` admin dashboard is your demand-ranked list of what page/brand to build next (Decision 4) — the plan's content factory input already exists.
