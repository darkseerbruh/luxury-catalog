# Images for the Luxury Catalog — Legal & Practical Research

*Prepared 2026-06-20. Decision-support, not legal advice — confirm load-bearing items with IP counsel before relying (the brief already flags this).*

**Method/limitation:** Findings come from a 5-angle web research pass. `WebFetch` was HTTP-403 blocked on every primary/law-firm/ToS page, so claims are **search-snippet sourced**, not full-text fetched. Confidence below leans on **cross-source corroboration** (claims that recurred across independent sources/agents are HIGH; single-snippet claims are MEDIUM/LOW). Registration numbers, exact ToS wording, and current appeal dockets should be verified against primary records (USPTO TSDR, court dockets, the live ToS pages) before reliance.

---

## Bottom line (decision-first)

1. **AI-generated photoreal images of specific real bags = do not do it.** You get the *worst of both worlds*: the image **isn't yours** (purely AI-generated images aren't copyrightable in the US) **and** it still exposes you to **Hermès/Chanel/LV trademark + trade-dress + dilution claims** — the exact configuration that lost in *MetaBirkins*. It also violates your own product brief's "never invent authentication markers" rule, because a generated bag gets hardware/stamps/proportions wrong.
2. **Authentication-reference imagery must be REAL and rights-cleared.** This is the high-stakes tier. The only clean sources are: (a) **your own/first-party photography**, (b) **licensed images via affiliate feeds/APIs with the required link-back**, or (c) **user-submitted photos under a UGC license + DMCA safe harbor**.
3. **Decorative / browse imagery can be AI — if it's non-photoreal and depicts no specific real bag.** Original **silhouette/category illustrations** and ambient textures carry low IP risk and are a well-precedented pattern (Fashionpedia draws everything itself).
4. **Your affiliate monetization slightly weakens the "editorial" shield.** Nominative fair use lets you *name* "Hermès Birkin" all day; but affiliate links push the use toward "commercial," which weakens the dilution noncommercial-use exclusion and strengthens an endorsement/confusion argument **if the presentation implies brand sponsorship**. Keep brand references clearly editorial and non-affiliated.

### Recommended path (lowest-risk, buildable now)
- **Tier A — browse/aesthetic:** original AI/stock **silhouette illustrations** keyed to silhouette/carry-type + ambient textures, labeled "illustrative — not an authentication reference." Build now.
- **Tier B — reference photos:** add **user-submitted photos** (UGC license + DMCA agent + takedown + repeat-infringer policy + uploader warranty/indemnity) and **licensed affiliate-feed images with link-back**. Build the plumbing; turn on as programs/contributions land.
- **Never:** scraped reseller photos, or AI photoreal renders of real bags.

---

## Why AI-generated bag images are a trap

- **Not copyrightable.** US Copyright Office 2023 guidance + Jan-2025 report: purely AI-generated images are **not** copyrightable, and *prompting alone* doesn't make you the author. *Thaler v. Perlmutter* (D.C. Cir., Mar 18 2025) affirmed the human-authorship requirement; SCOTUS denied cert (Mar 2 2026). Only human-authored selection/arrangement gets *thin* protection (*Zarya of the Dawn*). → You can't own or defend the asset. `HIGH`
  - copyright.gov/ai ; federalregister.gov/.../2023-05321 ; media.cadc.uscourts.gov/opinions/docs/2025/03/23-5233.pdf
- **Still infringes.** *Hermès v. Rothschild* ("MetaBirkins", SDNY): Feb 8 2023 jury found **trademark infringement, dilution, AND cybersquatting**, ~$133k; the *Rogers v. Grimaldi* First-Amendment/"artistic relevance" defense **failed** because the use was "explicitly misleading." Permanent injunction June 2023. (2nd Cir. appeal argued Oct 23 2024; **status post-mid-2025 unverified** — *Jack Daniel's v. VIP* (2023) narrowed Rogers and may reshape it. **Verify current docket.**) `HIGH` (verdict) / `MEDIUM` (appeal status)
  - skadden.com/.../2023/02 ; paulweiss.com/.../metabirkins ; goodwinlaw.com/.../metabirkins-post-trial
- **Outputs reproducing marks can infringe.** *Getty v. Stability AI* (English High Court, 4 Nov 2025) found limited **trademark** infringement where outputs reproduced Getty watermarks (UK law; US case pending). Practitioner consensus: publishing AI images that reproduce logos/trade dress creates infringement+dilution exposure **for the publisher**, not just the model vendor. `MEDIUM` (risk) / `LOW` (no US holding yet)
  - twobirds.com/.../stability-ai ; aalrr.com/.../trademarks-in-the-age-of-ai

## Trademark / trade-dress reality for a reference site

- **Hermès holds word + 3-D trade-dress registrations for the Birkin** (silhouette, flap, padlock/strap); reportedly Reg. 2991927 (word) / 3936105 (trade dress) — *numbers snippet-only, verify on USPTO*. Kelly US trade-dress registration unconfirmed (EU 3-D marks exist). `MEDIUM`
  - iptrademarkattorney.com/.../hermes-birkin
- **Nominative fair use is your friend — for NAMES, not images.** *New Kids v. News America* 3-prong test + *Toyota v. Tabari*: you may use "Hermès Birkin" to refer to the bag if (1) not identifiable otherwise, (2) only as much mark as needed, (3) nothing implying sponsorship. **This is a trademark doctrine; it does NOT license copying anyone's photo.** Circuit split on how NFU applies. `HIGH` (doctrine) / `MEDIUM` (nationwide uniformity)
  - caselaw.findlaw.com (9th Cir. Tabari)
- **Editorial dilution shield exists.** 15 USC §1125(c) excludes nominative/descriptive fair use, commentary, and **all news reporting/commentary** from dilution liability — protects genuinely editorial content. `HIGH` — bitlaw.com/source/15usc/1125.html
- **But the shield fails when you imply affiliation or touch counterfeits.** *Chanel v. WGACA* (SDNY, Feb 2024): $4M willful infringement; nominative-fair-use + first-sale defenses failed. *Chanel v. The RealReal* (filed 2018, still pending 2026) contests exactly this. Post-*Romag* (2020), profits can be disgorged **without** proving willfulness. `HIGH`
  - kelleydrye.com/.../chanel-wgaca ; thefashionlaw.com/.../chanel-v-the-real-real

## Reseller / real photographs

- **The photo's copyright belongs to whoever shot it** (reseller/photographer), vesting on creation. A bag's design being trademarked gives you **no** right to copy a third party's photo of it. `HIGH` — nolo.com/.../photographs-violate-copyright-or-trademark
- **Straight reproduction usually fails fair use.** §107's four factors hinge on "transformative" purpose; copying a product photo *to show the product* is the same purpose (*Otto v. Hearst*, SDNY 2018 — fair use rejected). `HIGH` — copyright.gov/fair-use/summaries/otto-hearst...
- **Scraping reseller photos: CFAA weak, copyright/ToS strong.** Post-*hiQ v. LinkedIn* / *Van Buren*, scraping public pages may clear the CFAA, but still = copyright infringement + ToS breach (hiQ later found to have breached LinkedIn's agreement). **Fashionphile's ToS expressly bans harvesting/scraping** (snippet-confirmed); RealReal/Vestiaire wording unverified. `HIGH` (law) / `MEDIUM` (Fashionphile ToS) / `LOW` (RealReal/Vestiaire)
  - whitecase.com/.../web-scraping-hiq ; help.fashionphile.com/s/terms-of-use
- **Legitimate licensed path: affiliate feeds/APIs.** Programs grant a *limited, revocable, non-exclusive* license to display merchant product images **only via the feed/API and only when linking to the merchant** (e.g., Amazon PA-API — "solely on your Site," images pulled via API, must link back; PA-API deprecating ~Apr 30 2026). `HIGH` (Amazon) / `MEDIUM` (generalization)
  - webservices.amazon.com/paapi5/documentation/read-la.html

## User-submitted photos (UGC) — the scalable reference path

- **Standard license grant:** uploader keeps ownership but grants the platform a **non-exclusive, royalty-free, worldwide, sublicensable** license (Instagram/YouTube/Poshmark/eBay/Vinted patterns), plus a **warranty that they own/have rights** and an **indemnity** for third-party IP claims. `HIGH` — poshmark.com/terms ; lawinsider.com/clause/user-generated-content
- **DMCA §512(c) safe harbor** shields the platform from users' copyright infringement IF you: (a) register a **designated agent** with the Copyright Office, (b) run **notice-and-takedown**, (c) adopt + *actually implement* a **repeat-infringer** policy. *BMG v. Cox* (4th Cir. 2018): a policy "on paper" isn't enough — Cox lost the safe harbor + a $25M verdict. `HIGH` — copyright.gov/512 ; eff.org/.../bmg-v-cox
- **A user's own photo of their genuine bag is lower trademark risk** (first-sale + nominative use) than platform-generated imagery — but not zero (fails if goods aren't genuine or presentation implies endorsement). `HIGH` (doctrine) / *inference on the comparison* — sternekessler.com/.../first-sale-doctrine

## What comparable references actually do

- **Fashionpedia: draws everything** — original illustrations/infographics it owns outright (© Fashionary). The cleanest model: *create the art yourself*. `HIGH` — fashionary.org/products/fashionpedia
- **The RealReal / Fashionphile: first-party photography** of inventory in hand (they shot it, they own it; ToS bar reuse). `HIGH`
- **PurseBlog / Fragrantica / IMDb: UGC + license + DMCA** — users retain copyright, grant a publish license, uploads must be owned/rights-cleared, DMCA agent + takedown. IMDb also uses studio-supplied promo material and **rejects fan-created AI images**. `MEDIUM` (snippet-only ToS)
- **Licensed silhouette/illustration stock is plentiful** (iStock 9,000+ handbag drawings) — supports the Tier-A illustration approach. `MEDIUM`

---

## Open gaps / verify before relying
- 2nd Circuit *MetaBirkins* appeal outcome (post-mid-2025) — may change the Rogers analysis after *Jack Daniel's*.
- Birkin registration numbers + any US Kelly trade-dress registration (USPTO TSDR).
- RealReal / Vestiaire exact ToS wording (only Fashionphile's anti-scraping clause was snippet-confirmed).
- Everything is snippet-sourced (WebFetch blocked) — a human/lawyer should confirm primary sources for the load-bearing items.
- No source squarely addresses a *non-selling, affiliate-monetized editorial catalog* — the affiliate-as-"commercial-use" risk is reasoned synthesis, not a holding.
