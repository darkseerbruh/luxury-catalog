# Luxury Catalog — Product Brief
*Last updated: June 2026*

---

## The Concept

Luxury Catalog is the definitive global reference database for designer handbags. Think IMDb for luxury bags, or Fragrantica for perfume — a comprehensive, structured, searchable catalog that tells a serious buyer everything they need to know about any bag ever produced: what exists, when it was made, where it was sold, in what materials, hardware, sizes, and colorways, and what it's worth.

The product fills a gap that no one has filled: a single authoritative source of truth for bag production history across brands, across years, and across global markets — including regional exclusives that never appear on English-language resale sites.

The closest existing resource is PurseForum, which is a forum — not a database. It's chaotic, gatekept by insiders, unreliable for authentication, and completely useless for finding something like a Fendi Peekaboo that was only produced in green ostrich for Asian markets in a specific year. Luxury Catalog replaces it with something trustworthy, structured, and searchable.

---

## The Problem It Solves

Serious luxury bag buyers currently piece together research from:
- Multiple resale sites (using filter menus to reverse-engineer what variants exist)
- Private Facebook groups (tribal knowledge that lives nowhere else)
- Japanese and Korean resale platforms they may not be able to read
- PurseForum (unreliable, hostile to newcomers)
- Personal relationships with sales associates and authenticators

There is no single place that answers: *does this bag, in this color, with this hardware, from this year, for this market, actually exist — and how do I know if what I'm looking at is real?*

Luxury Catalog is that place.

---

## User Personas

### 1. The Serious Collector / Investor
- Buying Hermès, Chanel, LV as appreciating assets
- Spending $5,000–$500,000+
- Obsessed with production details: year, hardware, leather type, market exclusivity
- Needs the global production database more than anyone
- Will pay for intelligence that helps find what doesn't appear on English-language sites
- **Most monetizable user**

### 2. The Resale Flipper
- Gen Z / Millennial, buying to resell at profit
- Needs price history, trend data, what's appreciating vs. depreciating
- Highly research-driven
- Uses the catalog as a market intelligence tool

### 3. The First Serious Purchase Buyer
- Saving for their first Chanel or LV ($3,000–$10,000 purchase)
- Doing enormous research before committing
- Terrified of buying fake, wrong year, or bad condition
- Needs authentication detail, production history, "what to look for" guides
- Huge audience, high anxiety, highly motivated

### 4. The Authentication-Paranoid Buyer
- Buying resale and needs to know: does this year have feet? Gold or ruthenium hardware? What date codes should I see?
- Currently served badly by PurseForum — opinions are unreliable, gatekept, and sometimes deliberately wrong
- Needs structured, trustworthy authentication markers by year and variant

### 5. The Thrift Store / Estate Sale Hunter
- Standing in a Goodwill or estate sale, phone in hand, 60 seconds to decide
- Coach is the most common find; vintage Coach has surged in value
- Needs a camera-first, instant answer: does this bag exist, is this hardware right, what's it worth?
- Highest-intent buyer in the moment of discovery
- Enormous viral potential — "I found a real Chanel at Goodwill" content dominates TikTok

---

## Brand Scope

The catalog spans all authentic designer bags, with depth of data varying by tier:

**Thrift Store Tier** (authentication focus, serial numbers, vintage value)
- Coach, Kate Spade, Burberry, Gucci

**Mid Resale Tier** (production history, authentication, resale pricing)
- Prada, Fendi, Celine, Dior, Bottega Veneta

**Ultra-Luxury Tier** (full global production catalog, market exclusives, year-by-year variation)
- Chanel, Louis Vuitton, Hermès

**Why breadth matters:** One brand is a brand guide, not a catalog. The concept only proves itself when someone can search across brands. Launch with ~10–12 brands minimum.

**Why Coach must be present:** Coach is the thrift store use case. It's the viral acquisition engine. Real vintage Coach bags appear at Goodwill daily, everywhere, and people need exactly this tool in that moment. It's also the easiest tier to build data for — the serial number and creed stamp system is well documented.

---

## Core Features

### 1. Global Production Catalog
The foundation. Every bag, every variant, every year, every market. Structured data including:
- Brand, style name, style family
- Year(s) produced
- Sizes available
- Hardware options (color, type)
- Leather/material types
- Interior details
- Colorways
- Market availability (US, EU, Asia, limited release, etc.)
- Retail price history
- Authentication markers by year

### 2. Natural Language Search
Instead of filter dropdowns, users describe what they want:
*"structured black bag under 10 inches wide that Hermès made in the early 2010s"*
AI finds it. No other luxury resource offers this.

### 3. Thrift Store Camera Tool
Point your phone at a bag, get an immediate read:
- Does this style exist?
- Does this hardware match what was produced in this era?
- Key authentication markers to check right now
- Estimated value if authentic

Mobile-first, camera-first. Designed for 60-second decisions.

### 4. Authentication Marketplace (Thumbtack Model)
- Buyers submit photos and get matched with verified professional authenticators
- Authenticators pay for leads / platform takes percentage of authentication fees
- Human authenticators handle complex cases; AI handles first-pass screening
- Authenticators get a professional profile on the most authoritative bag reference on the internet

*Post-launch feature — not in v1 scope.*

### 5. Price Tracking & Alerts
- Historical resale price data across platforms
- Price drop alerts for specific bags on a watchlist
- Market trend data ("is now a good time to buy a Chanel Classic Flap?")
- What's appreciating vs. depreciating

*Post-launch feature — price history table is in the schema from day one, alerts UI is future work.*

### 6. User Feedback & Research Loop
Baked into the product from day one:
- Searched but not found → "Request this bag be added"
- Automatic tracking of all searches with no results → weekly prioritization list
- "Does this information feel accurate?" on every bag page
- Post-authentication survey: "Was this helpful?"
- Thrift store find logging: "What did you find? What did you pay?"
- Embedded surveys at key moments throughout the experience

---

## Data Strategy

### Sources for Building the Database
1. **Reseller filter menus** — Fashionphile, TheRealReal, Vestiaire filter taxonomies reveal every hardware color, strap length, leather type ever cataloged. This is the attribute schema, reverse-engineered.
2. **Facebook groups** — Private collector groups hold the tribal knowledge that exists nowhere in a database: market exclusives, year-specific variations, production anomalies.
3. **Japanese / Korean / Chinese resale platforms** — Mercari JP, Rakuten, Chinese resale sites catalog Asian market exclusives that never appear on English-language sites.
4. **Professional authenticators** — Career authenticators have deep production knowledge. Partnership, revenue share, or equity could unlock this.
5. **User contributions** — Collectors will correct errors and contribute knowledge if given a structured way to do so. This is how the database improves over time.
6. **Searched-not-found data** — The product itself tells you what to build next. Top weekly searches with no results = your data roadmap.
7. **Legacy CSV datasets** — Two multi-brand reseller exports from 2022 (TheRealReal ~2,000 listings; The Luxury Closet, richer structured data) live in Google Drive. Useful for breadth seeding; treat as `confidence_level: low` due to age and resale-site origin.

### The Photo Problem
Real photography is the unresolved challenge. Options:
- **Affiliate partnership photos** — resellers share photo libraries in exchange for affiliate placement (requires leverage/traffic first)
- **Launch without photos** — use text-first, add photos as the product grows ← **current plan for v1**
- **User-submitted photos** — opt-in, licensed by the contributor
- **Legal counsel needed** — brand photos and reseller photos are copyrighted; fair use for educational/reference purposes is a real but untested angle for this use case

**v1 ships text-first. No photos until legal question is resolved.**

### Authentication Data Integrity Rule
Authentication markers, date codes, serial number formats, stamp placements, and hardware details must never be invented or hallucinated. A wrong authentication detail causes real harm — users make real purchasing decisions based on this information. If a field cannot be verified from a real source, leave it null and set `confidence_level: low`. Accuracy over completeness, always.

---

## Monetization Model

### Revenue Stream 1: Affiliate Commissions (Primary, Passive)
- Every "where to buy" link to Fashionphile, TheRealReal, Vestiaire etc. is an affiliate link
- Programs pay 5–10% on high-ticket items
- One $3,000 bag sale = $150–300
- Scales with traffic, requires no user payment, aligns with user experience
- User never pays; reseller pays invisibly when a sale happens

### Revenue Stream 2: Authentication Marketplace
- Thumbtack model: buyers find authenticators through the platform
- Authentication fees: $50–150 per written statement
- Platform takes percentage or charges authenticators for leads
- Someone spending $8,000 on a resale Chanel will absolutely pay $75 for a verified authentication

### Revenue Stream 3: Premium Tools (Future)
- Annual fee (~$30–50/year) for power users
- Price drop alerts for specific watchlisted bags
- Full price history and trend data
- Advanced authentication checklists
- **NOT a paywall on the core catalog — catalog stays free forever**
- The correct paywall lever is search precision / capability, not content access

---

## Competitive Landscape

### PurseForum
The current go-to for collector community knowledge. Weak competitor:
- Forum, not database — no structured, searchable record
- Authentication opinions unreliable, sometimes deliberately wrong
- Hostile to newcomers, gatekept by insiders
- Not global — misses Asian market exclusives entirely
- MapQuest to Luxury Catalog's Google Maps

### TheRealReal / Fashionphile / Vestiaire
Already building AI authentication — but for their own internal pipelines. Their AI authenticates bags for their inventory. Ours makes buyers smarter. Different products, different moments in the journey. Crucially: an educated buyer is harder for resellers to upsell. They will never build Luxury Catalog because it's somewhat adversarial to their interests.

### The Gap
No one has built the global production reference database. The information exists scattered across reseller filters, Facebook groups, Japanese platforms, and collector memory. Luxury Catalog aggregates and structures it. That's the moat.

---

## Tech Stack

- **Database:** Supabase (free tier — database + auth + API)
- **Authentication:** Supabase Auth (free up to 10,000 monthly active users)
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **AI:** Anthropic API (claude-sonnet-4-6) — natural language search + camera tool
- **Hosting:** Vercel (free tier)
- **Domain:** luxurycatalog.com (held at Squarespace Domains)
- **LLC:** Luxury Catalog LLC (already formed)

Total cost to launch v1: $0

---

## What's Still Unsolved

1. **Photos** — launch text-first; resolve legal question before adding images
2. **Data at scale** — 10–12 brands with full production history is a large research effort; user feedback loops and searched-not-found data help prioritize ongoing additions
3. **Authenticator partnerships** — will professional authenticators share knowledge for equity/revenue share? Needs outreach post-launch
4. **Legal review** — fair use for reference/educational image use, brand trademark considerations, data scraping terms of service

---

## Assets In Place

- `luxurycatalog.com` domain (Squarespace Domains, auto-renews ~Aug 9 annually)
- Luxury Catalog LLC (already incorporated)
- Next.js 15 app scaffolded in this repo
- Full 15-table database schema written (`supabase/migrations/0001_init_schema.sql`)
- Supabase account created; project setup is next step
- Vercel account created and linked to this GitHub repo; deployment is next step
- Two legacy CSV datasets in Google Drive (`therealreal_data-1.csv`, `theluxurycloset_data.csv`)
- Deep domain expertise and HCI/UX research background

---

*This brief is the north star. When in doubt about a product decision, the answer is here.*
