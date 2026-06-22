# Finance & Money Compliance — What to Know Before You Touch Anyone's Money

*Written 2026-06-21. A plain-language guide to the financial/“money” side of Luxury Catalog: what
the app does today, what the planned revenue features would do, the legal requirements each one
triggers, and what to be careful about. Read this before building anything that charges, pays,
or routes money.*

> **This is general information, not legal, tax, or financial advice.** It was compiled from
> public regulatory sources (FTC, IRS, FinCEN, state regulators, Stripe docs, payments-law firms).
> Rules change, several depend on your state, and a few sources could not be opened directly during
> research (see *Sourcing & confidence* at the bottom). **Before you launch any feature that handles
> money, get one review from a payments/consumer-protection attorney and a CPA.** That single review
> is the highest-value thing on this page.

---

## TL;DR — the one mental model to keep

**Regulatory burden is not a smooth ramp. It has one cliff: *do you ever take custody/control of
other people's money?***

| Phase | What you do | Burden | The line |
|---|---|---|---|
| **A — Today** | Show price data; send users to resellers via affiliate/referral links. Money never touches you. | **LOW** | You earn commissions. Obligations: *disclosure + a privacy policy + honest pricing*. No payment regulation at all. |
| **B — Premium subscription** *(planned M9)* | Users pay **you** $40/yr through Stripe for search/alert features. | **MEDIUM** | You're a normal merchant. Stripe carries the heavy licensing; you handle PCI-via-Stripe, auto-renewal law, and SaaS sales tax. |
| **C — Authentication marketplace** *(planned M9)* | Buyers pay authenticators **through your platform**; you take ~25%. | **HIGH — but avoidable** | This is the “people's money” line. If you *hold* buyer funds and release them yourself, you can become a regulated **money transmitter** (40+ state licenses, ~$250K+/yr). The standard fix: **never hold the funds** — let Stripe Connect custody and move them. |
| **D — Collection “investment” tracking + insurance + tax** *(the feature you asked about)* | Show a user their collection's value; help insure it; help tax-report it. No money custody. | **LOW–MEDIUM** | You don't hold money, so no transmitter risk. The risk is **professional liability**: your value is an *estimate, not an appraisal*; for insurance you must **refer, not act as an agent**; for tax you must provide **records, not advice**. See **Phase D**. |

**The single most important rule for this whole project:** in Phase C, **keep 100% of money flow
inside Stripe Connect and never route buyer funds into your own bank account.** That one discipline
is what keeps a solo LLC out of money-transmitter territory and out of most AML burden. Everything
else below is detail around that line.

You said you don't want to “mess with people's money without the education and proper backing.”
Good instinct. The honest answer: **today you aren't touching anyone's money** — you're an
information site with affiliate links, which is low-risk. The heavy stuff only starts when the
marketplace/subscriptions go live, and even then the architecture (Stripe Connect) is designed to
keep the licensing burden off you. This doc draws those lines so you know exactly when each
obligation kicks in.

---

## Where the “money” actually lives in the code today

There is **no payment processor in the repo** (`package.json` has no Stripe/PayPal/Plaid). Today the
finance surface is entirely **data display + outbound links + user-entered numbers**:

| Surface | Files | Handles money? | Obligation it creates |
|---|---|---|---|
| Outbound resale links (buyer affiliate) | `src/lib/affiliate.ts`, `src/app/bag/[variantId]/WhereToBuy.tsx` | No — deep-links to resellers | **FTC affiliate disclosure** |
| Price history + “Up +X%” trend chart | `src/app/bag/[variantId]/PriceTrend.tsx`; `price_history` table (`0001_init_schema.sql`) | No — shows recorded sale prices | **No deceptive pricing; no “investment” framing** |
| Watchlist target price + price-drop alerts | `watchlist` table (`0002`), `src/app/api/cron/price-alerts/route.ts` | No — user-entered target | Privacy (personal data); accuracy |
| Thrift “price paid” log | `thrift_find.price_paid` (`0002`) | No — user-entered | Privacy (personal data) |
| Consignor / “where to sell” referral | *planned (marketing-plan Decision 3); not built* | No — referral link | **FTC disclosure + claim substantiation** |
| Premium subscription $40/yr | *planned M9; not built* | **Yes (future)** | Phase B (below) |
| Authentication marketplace | *planned M9; not built* | **Yes (future)** | Phase C (below) |

### ⚠️ Two gaps already visible in the current build
1. **No affiliate-disclosure text anywhere.** `WhereToBuy.tsx` correctly sets
   `rel="...nofollow sponsored"` on the links — but that's an SEO/technical attribute, **not** the
   FTC-required *visible* disclosure a human reads. There is no “we may earn a commission” text on the
   page. This is the highest-priority, cheapest fix on the whole list (Phase A below).
2. **No Terms of Service, Privacy Policy, or disclaimer pages exist** (`src/app/` has no
   `terms`/`privacy`/`legal`/`disclosure` route). You need at least a Privacy Policy and an
   Affiliate/Pricing disclaimer before meaningful traffic, and a ToS before you ever take a payment.

Also worth a look: `PriceTrend.tsx` renders a **stock-chart-style “Up +X%”** sparkline. That's fine
as *historical recorded data*, but it edges toward “investment” framing — give it a one-line
disclaimer (Phase A, §2).

---

# Phase A — Today: affiliate links + price data (LOW burden)

You're an information publisher monetized by affiliate/referral links. Two requirement areas.

## A1. Affiliate / referral disclosure (FTC) — **do this first**

**Requirement.** The FTC's **Endorsement Guides (16 CFR Part 255)**, updated by a final rule
effective **July 26, 2023**, treat a paid recommendation as an *endorsement* with a *material
connection* (your commission) that must be disclosed **“clearly and conspicuously”** — defined in
the new §255.0(f) as *“difficult to miss (i.e., easily noticeable) and easily understandable by
ordinary consumers.”*

**What to be careful about (the parts sites get wrong):**
- **Proximity beats footers.** Put a short disclosure **right next to the affiliate link/block**, not
  only in a footer or a separate page. The FTC's own FAQ says a single homepage/“About” disclosure is
  **not enough**, because people land on individual bag pages without seeing it.
- **Use plain money words.** *“Paid link”* or *“We may earn a commission when you buy through links on
  this page, at no extra cost to you.”* are adequate. **Inadequate:** the bare phrase “affiliate
  link,” a lone “Shop” button, or `#ad` buried in a stack.
- **You (the LLC) are liable.** Using an affiliate network doesn't shield you. Civil penalties are
  inflation-adjusted and **per violation** (in the ~$51K–$53K range depending on the year/violation
  date — verify the live FTC penalty table before quoting it).
- **Consignor/seller referrals are the same rule, in the other direction.** Referring people who
  *sell* their bags (marketing-plan Decision 3, the high-value `$1,250`-per-consignor line) is still a
  paid endorsement → disclose the **referral fee** too. And seller-side content tends to make
  **outcome claims** (“get the most for your bag,” “sell fast”) — those are **performance
  representations** that must be **truthful and substantiated**. Don't promise payout amounts or sale
  speed unless the reseller's published terms back it.

**Concrete actions.**
1. Add an inline disclosure to `WhereToBuy.tsx` (and any future “where to sell” component) — e.g.,
   *“Affiliate links — we may earn a commission, at no extra cost to you.”* Keep the existing
   `rel="sponsored nofollow"`; it's good practice but is **in addition to**, not instead of, the
   visible text.
2. Add a site-wide **Affiliate Disclosure** page (linked in the footer) — *in addition to*, never
   *instead of*, the inline note.
3. Scrub any future seller-referral copy for payout/speed/“best price” claims.

## A2. Price data & “investment”/valuation framing

**The good news on securities law:** handbags are **not securities**, so showing resale prices or
even calling a bag a good “investment” colloquially does **not** make you a regulated investment
adviser. Impersonal, generally-published commentary is also protected (the *Lowe v. SEC* publisher's
exclusion, reaffirmed in *Mournes v. Seeking Alpha*, 2024). **SEC registration risk is low.**

**Your real exposure is FTC deceptive-pricing / consumer protection** (FTC Act §5; the Guides
Against Deceptive Pricing, 16 CFR Part 233), because you *publish price claims*:
- **No fictitious “was” prices.** If you ever show “retail $X → resale $Y” or “down from,” the higher
  number must be a price **actually and openly offered** (Part 233.1), not inflated to make a deal
  look bigger.
- **Label estimates as estimates; timestamp them.** Resale prices move. A months-old “current price”
  can mislead. State the **source and date** (your `price_history` rows have `date_recorded` and
  `platform` — surface them).
- **Don't promise returns.** “Bags appreciate,” “guaranteed to hold value,” “X% annual return” are
  **unsubstantiated performance claims** — the highest-risk language on the site. Keep it descriptive
  (“historically sought-after; resale values can fall”). The `PriceTrend` “Up +X%” chart is fine as
  *recorded history*; just don't frame it as a forecast.

**Disclaimer language you can adapt (have counsel review):**
- *Price data:* “Prices shown are estimates compiled from third-party resellers, for general
  information only. They are not offers to buy or sell, may be out of date, and may differ from actual
  transaction prices. We don't guarantee accuracy, availability, or any resale price.”
- *No investment advice:* “Nothing here is financial, investment, tax, or legal advice. Luxury
  handbags are collectible goods, not regulated securities; their value can go down as well as up. Any
  reference to ‘investment,’ ‘value,’ or ‘price trends’ is general commentary, not a prediction.”
- *Independence/affiliate:* “We earn commissions or referral fees from some links, which may influence
  which retailers we link to.” (Candor here also helps preserve the ‘disinterested publisher’ posture.)

---

# Phase B — Premium subscription $40/yr (MEDIUM burden)

When you charge users directly through Stripe, you're an ordinary merchant. Stripe carries the
money-movement licensing. Four things become your job.

## B1. PCI DSS (card-data security) — handled by *using Stripe correctly*
- **Never store card numbers, CVV, or magnetic-stripe data.** Current standard is **PCI DSS v4.0.1**.
- Use **Stripe Checkout or Elements** so the card data goes straight to Stripe and you only ever
  receive a **token**. That qualifies you for **SAQ A**, the shortest self-assessment (Stripe pre-fills
  much of it). **Keep third-party scripts off the payment page** — the 2025 SAQ-A update added an
  attestation that your payment page isn't susceptible to script attacks. A custom card form would drop
  you into a much heavier SAQ — don't.

## B2. Auto-renewal / “negative option” law — **build to the surviving law**
- ⚠️ **Status note:** the FTC's **“Click-to-Cancel” / Negative Option Rule was vacated nationwide by
  the Eighth Circuit on July 8, 2025**, on procedural grounds — **it is not currently in force.** The
  FTC restarted rulemaking (draft ANPRM submitted ~Jan 30, 2026), so a replacement may appear in your
  launch window. *Monitor it.*
- **What still binds you regardless:** the federal **ROSCA** (Restore Online Shoppers' Confidence Act)
  and **state auto-renewal laws** — most notably **California's ARL (AB 2863, effective July 1, 2025)**,
  which requires clear-and-conspicuous renewal disclosure, **affirmative consent**, **easy online
  one-click cancellation** (cancel the way you signed up), annual reminders, change notices, and
  keeping consent records **≥3 years**.
- **Design guidance:** build subscriptions to **ROSCA + California ARL** from day one (it's the de
  facto national floor and mirrors the vacated FTC rule): pre-checkout renewal disclosure → affirmative
  opt-in → in-account one-click cancel → annual reminder emails → store consent. Then you're covered
  whichever way the FTC rule lands.

## B3. Sales tax on the subscription (SaaS)
- A digital subscription is **more likely taxable than a service** — roughly **half the states** tax
  SaaS/digital subscriptions, and it **varies materially**. (No state sales tax at all: AK [local
  only], DE, MT, NH, OR.)
- Register in your **home state** if it taxes SaaS; use **Stripe Tax** (or Avalara/TaxJar) to
  auto-determine taxability and watch **economic nexus** (commonly $100K or 200 transactions per state,
  but varies). At $40/yr you're unlikely to hit out-of-state nexus early.

## B4. Refunds & chargebacks (operational)
- **Refund** = you return funds (the processing fee generally isn't returned). **Chargeback** = the
  customer disputes with their bank; Stripe pulls the amount **plus a non-refundable ~$15 dispute
  fee**, and you get a short window to submit evidence.
- Reduce disputes with a clear billing descriptor, email receipts + renewal reminders, easy
  cancellation/refunds, and retained consent records as evidence (consider Stripe Radar).

---

# Phase C — Authentication marketplace (HIGH burden — but structurable)

Buyers pay authenticators *through* your platform; you take ~25%. This is the “handling people's
money” feature. Done wrong, it makes you a money transmitter. Done right (Stripe Connect), the
licensing stays with Stripe.

## C1. Money transmission — the cliff, and how to stay off it
- **The definition (FinCEN, 31 CFR §1010.100(ff)):** accepting funds from one person and transmitting
  them to another. **There is no dollar/volume floor** — “we're small” is *not* a defense. Triggering
  it means **FinCEN MSB registration *and* state Money Transmitter Licenses** — there's no national
  license, so nationwide operation can mean **40+ state licenses**, with Year-One direct cost commonly
  estimated at **~$250K–$350K** plus bonds and net-worth minimums. This is fatal for a solo LLC, and
  it's the thing to architect around.
- **How Stripe Connect keeps you out:** **Stripe** is the licensed money transmitter / registered MSB
  and moves the funds; the platform “benefits from Stripe's licenses” and **never takes possession or
  control of buyer money.** Two doctrines support this: FinCEN's **payment-processor exemption**
  (§1010.100(ff)(5)(ii)(B)) and the state-level **agent-of-the-payee** exemption (codified in the
  spreading **Money Transmission Modernization Act**, but *not uniform* — a handful of states lack it).
- **You are a “marketplace,” not a “payment facilitator.”** A PayFac onboards sub-merchants under its
  own acquirer relationship and receives/distributes their settlement — closer to transmission. A
  marketplace on Stripe Connect lets Stripe be the regulated entity and route money to connected
  accounts. **Keep it that way.**
- **The one thing that flips you over the line:** routing buyer funds into your **own/operating bank
  account** and paying authenticators yourself, holding funds for days under your discretion,
  commingling buyer/seller funds, or issuing **wallet/stored-value balances** (which specifically
  **breaks** the agent-of-payee exemption in California). Take your 25% as a Stripe
  **`application_fee`/transfer split handled by Stripe**, not as money you receive and redistribute.

**Actions.** Use **Stripe Connect** with **hosted onboarding (Express or Standard)**; take your cut as
an application fee; never pool/escrow funds yourself; get a payments attorney to confirm the fund flow
and any state agent-of-payee specifics before launch.

## C2. KYC / AML / sanctions
- **KYC:** with Stripe-hosted/Express onboarding, **Stripe runs identity verification, KYC, and
  sanctions checks** on authenticators. Your residual duty: don't pay out before an account is
  verified (`payouts_enabled`), and chase accounts stuck in verification. **Stripe is explicit that
  fraud prevention remains yours.**
- **AML:** a non-transmitter marketplace generally **isn't directly subject** to BSA/AML program rules
  (that sits with Stripe) — but do basic hygiene: a published **prohibited-goods policy** (counterfeit
  or stolen items — directly relevant to *authentication*), fraud/collusion monitoring (watch for buyer
  = authenticator, payout velocity), and recordkeeping.
- **OFAC sanctions are *your own* obligation** — strict liability, no small-business carve-out, can't
  be fully outsourced. Restrict to permitted geographies, treat any Stripe sanctions hold as a hard
  stop, optionally screen authenticator names with OFAC's free **Sanctions List Search**, and keep a
  short written sanctions policy.

## C3. Tax reporting for the marketplace
- **Form 1099-K (to authenticators):** the **One Big Beautiful Bill Act (signed July 4, 2025)** repealed
  the $600 rule and **restored the threshold to *more than $20,000 **and** more than 200
  transactions*** (both required) — confirmed by IRS (“dollar limit reverts to $20,000”). For a 2026+
  launch, that's your clean federal standard. **Caveats:** several **states set lower 1099-K thresholds**
  (some $600) for residents there; and **who files** depends on your Connect config — with **Express/
  Custom** accounts (you control the 25% and pricing, your likely model) **Stripe reports gross to YOU
  and YOU are the filer of record** for authenticators (Stripe provides tooling, but the obligation is
  yours). With **Standard**, Stripe files.
- **Form 1099-NEC:** threshold is $600 for 2025, **rising to $2,000 for 2026** (OBBBA). **Do not
  1099-NEC marketplace-settled authenticator payouts** — those are 1099-K; double-reporting is
  prohibited. Reserve 1099-NEC for people you pay **off-platform** (e.g., a contractor developer paid
  by ACH). **Collect a W-9 from everyone at onboarding.**
- **Marketplace facilitator sales tax:** post-*Wayfair*, the **platform** (not the sellers) must
  collect/remit sales tax on facilitated sales **where the transaction is taxable**. The
  **authentication *service*** is likely **exempt in most states** (most don't tax professional/
  inspection services; a minority — e.g., HI, NM, SD, WV — tax services broadly). Confirm with a
  **SALT taxability study** for the service and the subscription separately; automate with Stripe Tax.

---

# Phase D — “Track your collection as an investment + insure it + tax-report it” (premium feature)

*This is the feature you actually asked about. It's not in the codebase yet, but the data model is
half-built: the closet (`want/have/had`, migration `0005`) already records holdings, and
`thrift_find.price_paid` already captures a cost basis for flippers. An “investment dashboard” is a
natural premium layer on the closet.*

**The honest framing:** this is really **three sub-features with very different risk levels.** Two are
worth doing in a safe form; the third (“tax”) is worth doing **only as a records/export tool, never as
tax advice or tax filing.** Do not let them blur together — the danger is a single screen that says
“your bag is worth $9,000, here's your insurance value and your tax bill,” because each of those three
numbers carries a different professional liability.

## D1. Collection value tracking — **low risk, high appeal → do it**
Showing a user “your closet is worth ~$X, here's the trend” from your existing comp/`price_history`
data is **fine** — handbags aren't securities, so this is **not** regulated investment advice (the
*Lowe* publisher's-exclusion analysis; collectibles fall outside the Investment Advisers Act). It's
personal record-keeping.
- **Be careful about:** framing it as a **forecast or promise** (“your collection will appreciate
  12%/yr”). Keep it descriptive and historical. Label every number an **estimate** with a source/date.
- This is the safest, most broadly appealing piece — basically your closet + price data, monetized.

## D2. Insurance — **medium risk → refer, don't act as an agent; never get licensed**
This is the part most likely to quietly create a licensing problem. Two clean models, in order of
preference:
- **Best: be a records tool, not an intermediary.** Generate an **inventory/schedule document**
  (photos, descriptions, purchase prices, your value estimate, serial/date-code fields you already
  capture) that the **user takes to their own insurer/broker**. You never touch the insurance
  transaction → **no licensing issue at all.** This is the recommended build.
- **Acceptable: a plain referral** to a specialty collectibles insurer. In most states you can pay/
  receive a **referral fee to/from a licensed producer** *only if*: (1) the fee is **not conditioned on
  a policy being sold** (flat fee per referral, not per-policy), (2) you **don't explain coverages,
  limits, premiums, rates, or make recommendations**, and (3) it doesn't violate state **anti-rebating/
  inducement** laws. The moment you “sell, solicit, or negotiate” insurance — including discussing what
  coverage someone needs — you need a **state insurance producer license**. **Don't go there.**
- **Be careful about the valuation you hand the insurer (see D4).** If a user over-insures (pays for
  coverage they can't claim) or under-insures based on your estimate, that's a complaint waiting to
  happen. Your number is a *starting point*, not an appraisal — say so.

## D3. Tax reporting — **the one to be careful about → build it as records, not advice**
**Is it even worth doing?** Candid answer: **as a tax-*prep* feature, no. As a record-keeping/export
feature, yes — especially for your flipper (`had`) segment.** Here's why:
- **It only matters when a user sells at a gain.** Most handbags **depreciate**; only the appreciating
  icons (Birkin, Kelly, some Chanel) throw off real gains. For the *typical* collector the tax angle is
  marginal.
- **For flippers/resellers it's genuinely useful** — they have actual cost bases (`thrift_find.
  price_paid`), holding periods, and gains. Good records save them real money and audit pain.
- **Handbags are “collectibles” and taxed differently** — and this is the useful, true thing your
  feature can surface: long-term gains (held >1 yr) are taxed at a **maximum 28% federal rate** (vs.
  15/20% for stocks), short-term gains at **ordinary rates up to 37%**, possibly **+3.8% NIIT** at
  higher incomes, plus state tax. Cost basis = purchase price + acquisition costs (auction premiums,
  documented restoration). Gains are reported on **Form 8949 / Schedule D** (collectibles use code “C”).
- **The trap — “dealer vs. investor.”** A high-volume flipper may be a **dealer** (gains = *ordinary*
  business income + self-employment tax), not an investor (28% collectibles rate). That determination is
  fact-specific and **is exactly the kind of thing you must not adjudicate for a user.**

**So build it as a records tool, not a tax product:**
- ✅ Track cost basis, acquisition costs, sale price, and holding period; produce a **gain/loss
  worksheet and a “give this to your accountant” export (CSV/PDF)**.
- ✅ Add a short, accurate explainer: “Handbags are generally taxed as *collectibles* (max 28% long-term
  federal rate); whether you're an investor or a dealer changes this. We don't determine that — talk to
  a tax professional.”
- ❌ **Don't** generate filed tax forms, compute “what you owe,” or tell a user their dealer/investor
  status — that's **tax preparation/advice**, a different professional/liability regime. A wrong number
  here flows straight onto someone's return.

## D4. The cross-cutting risk for D1–D3: your “value” is an estimate, **not an appraisal**
For **insurance scheduling** and for **tax** events that need a number (a charitable donation over
$5,000, estate valuation), the IRS and insurers want a **“qualified appraisal” by a “qualified
appraiser”** — someone with specific **credentials and verifiable experience** in that property type,
charging a **flat/hourly fee (never a % of the appraised value)**, within defined timing windows
(26 CFR §1.170A-17; Form 8283). **Your algorithmic comp-based estimate is not that, and you must never
imply it is.** If a user relies on your number for insurance or a deduction and it's wrong, that's your
liability surface.
- **Be careful about:** any language like “appraised value,” “certified value,” or “insurance value.”
  Use “estimated market value (from recent comparable sales),” timestamped, with a disclaimer.
- **Turn the gap into a feature:** when a real appraisal is needed, **refer the user to a credentialed
  appraiser** (a natural tie-in to the planned Authenticator/Curator marketplace — but remember an
  appraiser's fee can't be a % of value, and an *authenticator* is not an *appraiser*).

## D5. Data security — **elevated, and a real reason to think before building**
This feature turns your DB into a **per-user inventory of high-value physical assets, their estimated
values, and (for insurance) possibly home/location data** — i.e., a **shopping list for thieves**. The
breach stakes are materially higher than for anonymous price data. This argues for: collect the
**minimum** (do you really need addresses?), strong access controls and RLS (you already use Supabase
RLS — verify it for any new `holdings_value`/`insurance` tables), encryption, and a sober “is the
premium revenue worth this liability?” conversation before you build D2/D3. D1 alone carries little of
this risk.

## D6. Bottom-line recommendation
- **Build D1 (value tracking)** as a premium layer on the closet — low risk, broad appeal, mostly
  reuses what you have.
- **Build D2 (insurance) as an inventory-export + optional flat-fee referral** — never as an agent,
  never get licensed.
- **Build D3 (tax) as a cost-basis/holding-period records export** with a “collectibles are taxed
  differently; see your accountant” explainer — **not** a tax calculator or filer. Highest value to
  flippers, marginal to everyone else.
- Across all three, **your value is an “estimate,” never an “appraisal,”** and the data is sensitive
  enough to warrant extra security. Get the insurance-referral structure and the tax-disclaimer wording
  reviewed by counsel once, before launch.

---

# Cross-cutting: data privacy, business setup, and “proper backing”

## Data privacy (applies now — you store user price data)
Your stored fields — `thrift_find.price_paid`, `watchlist.target_price`, price history tied to an
account — are **personal data** once linked to a user, even though they aren't card numbers.
- **State privacy laws:** CCPA/CPRA (CA) and the ~20 other state laws mostly kick in at thresholds
  like **100,000 consumers/year** — a new solo site is initially **out of scope in most**. **Exception:
  Texas's TDPSA has *no* revenue/volume threshold** (it leans on an SBA “small business” carve-out), so
  build to a baseline now rather than retrofit.
- **Practical minimum (do regardless of thresholds):** publish a **Privacy Policy**; let users
  **access and delete** their data; **don't sell data** (keeps you clear of most “sale/share” opt-out
  duties); honor the **Global Privacy Control** signal; practice **data minimization**.
- **GDPR:** **no small-business exemption.** Your **EUR/GBP currency support is exactly the “targeting”
  signal** regulators cite. If you don't want EU obligations, don't target the EU (geo-limit, or drop
  EU currencies/shipping); if you keep EU users, you need a lawful basis (consent for cookies/marketing)
  and access/erasure handling. (GBP visitors implicate the materially identical UK GDPR.)
- **Breach notification:** all 50 states have laws; duty follows your **users'** states. Keep an
  incident-response plan. (California's fixed 30-day deadline is currently the strictest.)

## Business & tax foundations (solo operator)
- **Single-member LLC = pass-through** (“disregarded entity”): profit/loss flows to your 1040
  (Schedule C). **Self-employment tax is 15.3%** (Schedule SE) once net earnings hit **$400**.
- **Quarterly estimated taxes** are required if you'll owe **≥$1,000** (Form 1040-ES). 2026 due dates:
  **Apr 15, Jun 15, Sep 15, 2026; Jan 15, 2027.** (The `monetization-projections.md` 28% tax set-aside
  is a placeholder — confirm with a CPA.)
- **Sales-tax nexus:** register where you cross a state's threshold (commonly **$100K**; CA/NY $500K).
  Track sales by state from day one.
- **Don't commingle.** Open a **dedicated business bank account**; run everything through it. Mixing
  personal/business funds is the #1 way courts **pierce the veil** and erase your LLC protection.
- **Get a CPA** once you owe quarterlies, cross a nexus threshold, or start processing payments.

## “Proper backing” — the shields you asked about
- **The LLC** caps personal liability **only if you keep the separation** (separate account, contracts
  in the LLC's name, no commingling).
- **Insurance** (get real broker quotes — figures vary): **General Liability**, **Professional
  Liability / E&O** (relevant because users rely on your price data), and **Cyber Liability** (you
  store user data and will process payments). A bundled BOP is often cheaper.
- **Terms of Service + Privacy Policy** are contractual shields: ToS sets limitation-of-liability,
  the “price data is informational, not financial advice” disclaimer, acceptable use, and dispute
  terms. You need these published **before** you take a payment.

---

## Recommended order of operations

**Now (Phase A — cheap, high-value):**
1. Add inline **affiliate disclosure** to `WhereToBuy.tsx`; add a footer Affiliate Disclosure page.
2. Publish a **Privacy Policy** and a **price/no-investment-advice disclaimer** (and surface
   `date_recorded`/`platform` on price data; add a one-line note under `PriceTrend`).
3. Decide the **EU question** (target or geo-limit) given EUR/GBP support.
4. Open a **business bank account**; start bookkeeping.

**Before any payment feature (Phase B/C):**
5. Publish **Terms of Service**; pick **Stripe** + **Stripe Tax**; integrate via **Checkout/Elements**
   (→ SAQ A).
6. Build subscriptions to **ROSCA + California ARL** (easy cancel, clear disclosure, consent records).
7. For the marketplace: **Stripe Connect**, hosted onboarding, **never custody funds**, take the cut
   as an application fee; collect **W-9s**.
8. **One pre-launch attorney review** (payments + consumer-protection + SALT) and a **CPA** for entity
   treatment, quarterlies, and a SALT taxability study.

---

## Sourcing & confidence

This brief synthesizes research across FTC, IRS, FinCEN, state regulators, Stripe documentation, and
payments-law firms (Venable, Cooley, Mayer Brown, Gibson Dunn, and others). **Verification caveat:**
during research, automated full-page fetching was blocked (HTTP 403) on many primary sources
(irs.gov, ftc.gov, fincen.gov, stripe.com, ecfr.gov), so several quotes were confirmed via
cross-corroborated search extracts rather than a direct page read. The two genuinely unsettled,
time-sensitive items to re-check yourself:
1. **FTC “Click-to-Cancel” status** — vacated by the Eighth Circuit (July 2025); a replacement rule is
   in early drafting (~Jan 2026). Build to ROSCA + California ARL meanwhile.
2. **1099-K threshold mechanics for 2024/2025** — the OBBBA $20,000/200 standard governs a 2026+
   launch and is solid; only the back-years transition relief is fuzzy (and irrelevant to you).

Also re-verify, as they change yearly/by-state: the exact FTC per-violation penalty figure, the
current count of states adopting the MTMA / recognizing the agent-of-payee exemption, per-state SaaS
and service taxability, and per-state privacy-law and 1099-K thresholds.

**Key primary sources:** FTC Endorsement Guides (16 CFR Part 255) & 2023 final rule; FTC Guides
Against Deceptive Pricing (16 CFR Part 233); FinCEN money-transmitter definition (31 CFR §1010.100);
IRS 1099-K-under-OBBBA FAQ (“reverts to $20,000”) and 1099-MISC/NEC instructions; PCI SSC SAQ-A
update; California ARL (AB 2863); Eighth Circuit vacatur of the FTC Negative Option Rule (July 8,
2025); Stripe Connect / PCI / tax-reporting docs.

*Again: this is general information, not legal or tax advice. Have counsel and a CPA review before
you handle money.*
