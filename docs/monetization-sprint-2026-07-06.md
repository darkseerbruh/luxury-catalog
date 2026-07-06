# Monetization sprint — greenlit 2026-07-06

*Owner greenlit all monetization levers 2026-07-06. This is the sprint checklist: what she
does (OWNER) and what the build lanes do (BUILD). Status of record for affiliate programs:
`docs/data-collection-handoff.md` §11 "Application status update (2026-07-05, verified in
each dashboard)". Revenue model: `docs/monetization-projections.md`. Already done, not
repeated below: DNS is LIVE (www.luxurycatalog.com 200 via Vercel, verified 2026-07-06) and
all 35 articles are PUBLISHED (verified against the live DB 2026-07-06).*

## OWNER items (outward-facing, hers by rule)

- [ ] **Publish the staged Metricool social drafts.** IG @luxurycatalog_ and TikTok are both at 0 posts; this is the gate on the ShopMy application. Status: DRAFTS STAGED, ongoing.
- [ ] **Apply to ShopMy once a handful of posts are live.** ShopMy carries Fashionphile + TRR + Rebag as sub-affiliate and judges on public socials; applying at 0 posts risks a rejection that needs a member referral to overturn. Status: GATED on the posts above.
- [ ] **Watch for The RealReal activation email (Impact acct 7429371)** and paste the tracking ID into `NEXT_PUBLIC_AFFILIATE_THEREALREAL` when it lands. Invite accepted 07-05, awaiting activation. Status: PENDING ACTIVATION.
- [x] **Google Search Console: ALREADY CONNECTED** (domain verified via DNS TXT + sitemap submitted to Google AND Bing 2026-06-22, desktop-todo D1; re-verified 2026-07-06 via live DNS TXT records). Remaining: the GSC QUERIES pipe into the article engine (CSV export or API grant) + the two 2-min dashboard checks in desktop-todo D3/D4. Status: CONNECTED; queries pipe open.
- [ ] **Check the other pending approvals; paste IDs when approved:** CJ #7997608 (Rebag + The Luxury Closet, manual review; do NOT upload pre-launch traffic proof), Awin #2945769 (Vivrelle, myGemma, BriteCo, all pending, nudged 07-05; BriteCo application is already in), Redeluxe GoAffPro (under verification, nudged 07-05). Status: PENDING, nudged.
- [ ] **Skimlinks reapply: calendar item, not a now-action.** Declined 06-25 with a hard 90-day lockout; earliest reapply ~2026-09-25. Status: LOCKED OUT.
- [ ] **Amazon Associates: DEFERRED by owner decision 2026-07-05.** Apply ~2-4 weeks pre-full-launch (3 qualifying sales within 180 days of applying, or the account closes). Guardrail at apply-time: only Amazon-fulfilled / Luxury Stores / brand-sold items, never third-party "designer" listings. Status: DEFERRED, do not apply now.
- [ ] **Approve merges** (this branch + the other sprint branches; merge-to-main is the deploy gate). Status: ONGOING.

## BUILD items (agent lanes, land via branch + her merge gate)

- [x] **Analytics hygiene + premium fake-door** (`ops/monetization-hygiene-0706`): pulse journey now reads `article_viewed` / `bags_compared` / `attribute_object_viewed`; dead `style_viewed` removed; "Deal alerts Pro" coming-soon door on the watchlist + a quiet mention at the bag-page bell moment, firing `monetization_interest` with a `source` (event-only v1, PostHog is the interest list). Status: MERGED to main 2026-07-06 (owner "do it all").
- [x] **Newsletter opt-in** (`feat/newsletter-optin`): footer + `/articles` signup, durable `newsletter_subscriber` store (migration `0045`, owner applies via the db-migrate Action), old silent-drop API route removed. Status: MERGED to main 2026-07-06; capture activates when 0045 is applied.
- [x] **Market-report generator** (`feat/market-report-generator`): `scripts/market-report.ts` + n-gated core + 20 tests; first draft saved at `docs/research-drafts/market-reports/2026-07.md`; monthly loop registered in `automation-map.md`. Status: MERGED to main 2026-07-06; drafts only, she reviews before any publish.
- [ ] **Link-swap on each affiliate approval:** as each program clears, swap raw outbound links to tracked links (code lands in env, `src/lib/affiliate.ts` wraps). eBay EPN is already ACTIVE (campaign default in code, monetizing on deploy). Status: GATED on the approvals above.
- [ ] **Rental CTA ("Rent it first" on `want`):** links may ship pre-approval per the 07-05 owner reversal (unattributed until the Awin code lands); add `outbound_rental_clicked` to the taxonomy when the CTA ships. Status: NOT STARTED; Vivrelle attribution GATED on Awin approval.
