# Social Content Calendar & Campaigns

*Created 2026-06-21. The operating plan for what to post, where, how often, and
why — across Pinterest, Email/Newsletter, Instagram, and TikTok/YouTube Shorts.
Every recommendation is filtered through revenue impact and solo-operator effort.
Pairs with `docs/voice-and-tone.md` (how it sounds), `docs/marketing-plan.md` (the
channel strategy this implements), and `docs/utm-conventions.md` (how we tag it).*

> **Strategy in one line** (from `docs/marketing-plan.md`): the website + GEO is the
> compounding, faceless asset that monetizes while you sleep; social is the
> **on-ramp** that drives strangers to it. Social is rented from an algorithm —
> never let it become the business. Every post ends at a real page with a
> where-to-buy / where-to-sell link.

---

## 0. Operating constraints (read before planning a single post)

1. **One operator, AI leverage.** Time is the only non-scaling resource. Favor
   batchable, repurposable, evergreen formats over daily live obligations
   (`docs/marketing-plan.md` §intro).
2. **AI never generates footage; AI only assists.** The hard line: AI may *edit*
   real footage (cut, color, caption, clean up), but AI may never *generate* footage
   or *alter reality* (face, voice, appearance, scene, object), and never touch an
   authentication frame at all. This is stricter than "no *obviously*-AI video"
   on purpose, because trust is our product. Full ruleset + the TikTok disclosure
   map: **§8 below.** Same principle for copy: `docs/voice-and-tone.md` §8.
3. **Every post drives to a page.** A million views that never reach the site is an
   ego hit, not revenue (`docs/marketing-plan.md` §6). The link is the point.
4. **Tag everything** per `docs/utm-conventions.md` so we can prove which channel
   actually moves affiliate clicks.
5. **Coach/thrift is the wedge** (Decision 1): cheapest data, widest audience, most
   viral format, fastest traffic. Lead acquisition with it; monetize the
   ultra-luxury tier behind it.

---

## 1. Prioritization matrix — revenue impact × human effort

Score each format on **revenue impact** (proximity to an affiliate click /
consignor referral) and **human-in-the-loop effort** (your scarce time). Do the
high-impact/low-effort quadrant first.

| Format | Channel | Revenue impact | Human effort | Do… |
|---|---|---|---|---|
| Pin → bag page | Pinterest | High (search-intent, long half-life) | **Low** (repurpose existing pages) | **First** |
| Quiz-result + welcome email | Email | High (taste → targeted where-to-buy) | **Low** (automated once built) | **First** |
| "Ledger" newsletter | Email | High (owned audience, recurring) | Low–Med (batch monthly) | **First** |
| IG carousel (auth / comps) | Instagram | Med–High (saves, decision content) | **Low** (repurpose page data) | **First** |
| Thrift-reveal Short | TikTok/YT | **Highest** (viral + live demo, ~18% → resale clicks) | **High** (film, edit) | Batch |
| Authentication Short series | TikTok/YT | High (decision-point trust) | High (film, QC claims) | Batch |
| Founder talking-head | TikTok/IG | Med (trust, top-funnel) | High (on-camera, edit) | Batch |
| IG Reel (repurposed Short) | Instagram | Med | Low (cross-post) | Ongoing |
| Reddit answer + link | (n/a here) | Med (backlinks, GEO rep) | Med | Opportunistic |

**The sweet spot (do-first):** Pinterest + Email + IG carousels — high revenue
proximity, low effort, fully repurposable from data we already have. **The
high-impact/high-effort block** (video) is real and worth it, but **batch-filmed**:
one session → weeks of content, so it never becomes a daily tax.

---

## 2. Channel playbooks

Each channel: funnel role, content pillars it carries, recurring formats, cadence,
effort, the affiliate-revenue path, the AI-assist boundary, and UTM usage.

### 2.1 Pinterest — *the underrated compounding search engine*
- **Funnel role:** top-of-funnel *discovery that behaves like search* — visual,
  long content half-life (pins resurface for months/years), audience (collectors,
  aspirational buyers) is exactly ours (`docs/marketing-plan.md` Tier 2).
- **Pillars:** comparison/fit, price-resale intelligence, it-bag histories.
- **Formats:** vertical pins built from existing bag-page data; idea pins for
  comparisons ("Birkin 25 vs 30"); each pin → the bag page.
- **Cadence:** 5–10 pins/week, fully batchable; schedule in advance.
- **Effort:** **Low.** Repurpose pages we already have.
- **Revenue path:** pin → bag page → where-to-buy affiliate link.
- **AI-assist boundary:** AI drafts pin titles/descriptions from real page fields;
  human checks specificity + slop sweep. No invented facts.
- **UTM:** `utm_source=pinterest&utm_medium=social&utm_campaign=<yyyy-mm>-<name>`.

### 2.2 Email / Newsletter — *the owned audience you don't rent*
- **Funnel role:** the asset you own forever; turns one-time visitors into a
  returning, monetizable list (`docs/marketing-plan.md` Tier 2, §6).
- **⚠️ Dependency — the missing first step.** Email today is **purely
  transactional** (price alerts via Resend + Supabase auth; `notifications.ts`,
  `email.ts`). There is **no newsletter opt-in, list, or drip.** The quiz captures
  high-intent users (`quiz_completed` fires with `completeness`) but we don't ask
  for the newsletter at that moment. **Recommendation (separate build task):** add a
  newsletter opt-in at quiz completion and closet/watchlist creation. This calendar
  plans the *content*; standing up the list/drip is a prerequisite build, not part
  of this doc.
- **Pillars:** all five (the newsletter is where the brand voice is fullest).
- **Formats (plan-level):**
  - **Quiz-result email** — "Your taste: Structured Minimalist" + 3 matching bags
    with where-to-buy. Highest-intent moment we have.
  - **The "Ledger" (recurring newsletter, Ffern-inspired)** — a monthly/biweekly
    note: "what showed up secondhand under retail," a price move worth knowing, one
    authentication tip, one it-bag history. Human, specific, names the things. Open
    it in the **"grab a coffee, let's talk bags" register** (the Je Suis Lou
    settle-in pattern — see `docs/voice-and-tone.md` §2): warm, informed, with you
    not at you.
  - **Re-engagement** — "bags matching your taste dropped" / "your watched bag moved."
  - **Price-trend digest** — for the premium/collector segment: comps and movers.
- **Cadence:** Ledger monthly to start (batchable); transactional/triggered fire
  automatically.
- **Effort:** Low–Med (the Ledger is the only hand-written piece; the rest automate).
- **Revenue path:** every email links to bag pages (affiliate) and, for sellers, to
  consignor-referral links (a small, down-weighted line now, not the higher-payout side).
- **AI-assist boundary:** AI drafts the Ledger from real catalog + price data; human
  edits to voice and runs the §8 checklist. Never auto-send unreviewed.
- **UTM:** `utm_source=newsletter&utm_medium=email&utm_campaign=<yyyy-mm>-<name>&utm_content=<block>`.

### 2.3 Instagram — *the relationship + repurposing layer*
- **Funnel role:** mid-funnel trust and relationship; the home for repurposed video
  and saveable decision-content.
- **Pillars:** authentication, comparison/fit, thrift-flip economics, it-bag history.
- **Formats:** **carousels** (auth checklists, "real vs fake," comps — high save
  rate, low effort from page data); **Reels** (cross-posted Shorts); Stories for
  polls/quiz hooks → taste quiz.
- **Cadence:** 3–4 posts/week; carousels are the workhorse, Reels repurposed.
- **Effort:** **Low** for carousels, Low for repurposed Reels.
- **Revenue path:** carousel → "full guide + where to buy in bio/link" → bag page.
- **Founder-as-face vs faceless:** carousels and comps run **faceless** (brand
  system, `docs/voice-and-tone.md` §5); Reels can feature the **founder persona**
  when repurposed from talking-head video.
- **AI-assist boundary:** AI drafts captions + carousel copy from page data; human
  voice-edit + slop sweep.
- **UTM:** `utm_source=instagram&utm_medium=social&utm_campaign=<yyyy-mm>-<name>`.

### 2.4 TikTok / YouTube Shorts — *the viral on-ramp (you, batched)*
- **Funnel role:** top-of-funnel awareness and virality; the thrift-reveal is the
  hero format and doubles as a live product demo (`docs/marketing-plan.md` Tier 1).
- **Pillars:** thrift-flip economics, authentication, it-bag history.
- **Formats:**
  - **Thrift-find reveal** (hero) — "Is this Goodwill Coach real? Let's check the
    creed stamp" → pull up Luxury Catalog on camera → answer in 60s.
  - **Authentication myth-busting / "fake vs real by year."**
  - **"What your date code actually means."**
  - Every video ends at a URL.
- **Cadence:** **batch-film** — one session → weeks of content. This is the rule
  that protects your time (Decision 5).
- **Effort:** **High** (the only high-effort channel) — hence batching.
- **Founder-as-face vs faceless:** these are the founder-persona channel (the plan's
  "be the face"). Faceless cutdowns (screen-recording the catalog, B-roll of the
  bag) can extend a filming session without more on-camera time.
- **Revenue path:** view → bio/link → bag page → where-to-buy / where-to-sell.
- **AI-assist boundary:** AI helps script hooks and outlines; **no
  obviously-AI-generated video.** Authentication claims are human-QC'd before
  filming (a wrong call is brand risk).
- **UTM:** `utm_source=tiktok` / `utm_source=youtube`, `utm_medium=social`.

---

## 3. Content pillars

Five repeatable themes, each drawn from **real catalog data** (the
`supabase/seed/research/*.json` files, price history, fits/carry taxonomy) and each
written in the brand voice. These are the columns of the calendar.

1. **Authentication markers** — "real vs fake," date codes, creed/blind stamps,
   hardware tells. *Source:* per-bag authentication fields (honoring `confidence_level`
   and never-invent). *Highest-trust, decision-point pillar.* Best on TikTok + IG
   carousels.
2. **What fits / comparison** — "Birkin 25 vs 30," "which bag actually fits a
   laptop." *Source:* the fit (phone/tablet/laptop) + carry-method taxonomy the app
   already ships. *Best on Pinterest + IG.*
3. **Price & resale intelligence** — comps, what it actually resells for, what's
   holding value. *Source:* `price_history`, retail vs resale spreads. *Bridges to
   the collector/premium audience; best on email + Pinterest.*
4. **Thrift-flip economics** — "$12 Goodwill find → $180 resale," P&L breakdowns.
   *Source:* Coach wedge data + resale comps. *The viral acquisition pillar; best on
   TikTok.*
5. **It-bag histories** — the Tabby's Bonnie Cashin lineage, the Classic Flap's
   1983 Lagerfeld redesign, the Neverfull's story. *Source:* the `style`
   description/year fields in research JSON. *Craft-and-belonging pillar; best on
   newsletter + Pinterest + IG.*

> Pillar → audience bridge: pillars 1, 2, 5 carry the *craft/taste* shared ground;
> pillar 4 leads with the *flipper*; pillar 3 leads with the *collector/investor*.
> Same voice, register flexed (`docs/voice-and-tone.md` §3–§4).

---

## 4. Email playbook (detail)

> **Blocked on the opt-in dependency in §2.2** — content-ready, build-pending.

| Email | Trigger | Core content | Revenue path |
|---|---|---|---|
| **Welcome / quiz result** | `quiz_completed` + opt-in | Named taste profile + 3 matching bags | where-to-buy on each match |
| **The Ledger** (recurring) | Monthly batch | Under-retail finds, one price move, one auth tip, one history | buy + sell links throughout |
| **Re-engagement** | Taste-match drop / watched-bag move | "A bag matching your taste just dropped" | direct to bag page |
| **Price-trend digest** | Monthly, collector segment | Movers, comps, what's holding value | buy/sell + premium-tool hook |

- The **consignor-referral** link still belongs in any email touching sellers/flippers
  ("found one? here's where to sell it"), but it is a small ~$250 niche line now, not the
  ~$1,250 high-payout lever (TRR ruled out 2026-06-24, final pitch rejected 2026-06-30).
  Buyer affiliate is the backbone.
- Premium price-trend content is also the soft on-ramp to the future paid
  investment-tracking tier (`monetization_interest` event exists; no UI yet).

---

## 5. Campaign ideas

Six named, calendar-anchored campaigns. Each: hook, channels, cadence, effort,
revenue path, audience bridge.

1. **"Real or Replica?" (authentication series)**
   - *Hook:* one bag per episode, the single tell that settles it.
   - *Channels:* TikTok/Shorts hero → IG carousel recap → Pin.
   - *Cadence:* weekly episode from a batch film. *Effort:* High (batched).
   - *Revenue:* decision-point trust → where-to-buy. *Bridges:* both (craft).
2. **Thrift-Flip P&L**
   - *Hook:* "$12 in, $180 out — if it's real." Show the math.
   - *Channels:* TikTok hero → IG Reel → newsletter feature.
   - *Cadence:* biweekly. *Effort:* High (batched).
   - *Revenue:* buyer affiliate plus a light where-to-sell consignor referral (down-weighted, not high-payout).
   - *Bridges:* flipper-led.
3. **Is This Bag Holding Value? (investment series)**
   - *Hook:* retail vs. resale vs. 12-month trend for one icon.
   - *Channels:* newsletter (Ledger block) → Pin → IG carousel.
   - *Cadence:* monthly. *Effort:* Low–Med (data-driven, faceless).
   - *Revenue:* premium-tool hook + where-to-buy. *Bridges:* collector/investor-led.
4. **Seasonal It-Bag Retrospective**
   - *Hook:* "The bag everyone carried in [season] — and what it's worth now."
   - *Channels:* Pinterest-led (long half-life) → newsletter → IG.
   - *Cadence:* quarterly. *Effort:* Low (history + comps from data).
   - *Revenue:* where-to-buy. *Bridges:* craft/belonging (both).
5. **Find Your Taste (quiz share campaign)**
   - *Hook:* "What's your bag taste?" → shareable result card (the `/quiz` artifact).
   - *Channels:* IG Stories + Reels, TikTok, Pinterest → quiz → newsletter opt-in.
   - *Cadence:* evergreen + a launch push. *Effort:* Low (quiz exists).
   - *Revenue:* viral acquisition → list growth → recs → where-to-buy.
   - *Bridges:* both (taste).
6. **Date-Code Decoded**
   - *Hook:* "What your bag's date/blind stamp actually means" — one brand per drop.
   - *Channels:* TikTok → IG carousel → bag-page deep link.
   - *Cadence:* monthly. *Effort:* High (batched, QC'd claims).
   - *Revenue:* authority → bag page → where-to-buy. *Bridges:* both (craft).

---

## 6. Sample 4-week calendar

Pillars: **A**uth · **F**it/compare · **P**rice/resale · **T**hrift-flip ·
**H**istory. Cadence assumes one batch film at the start of the month.

| Week | Pinterest (5–10) | Email | Instagram (3–4) | TikTok/Shorts |
|---|---|---|---|---|
| **1** | F: "Birkin 25 vs 30 fit" + P: 3 comp pins | The Ledger (monthly) | Carousel **A**: real-vs-fake Coach Tabby | Hero **T**: $12 Goodwill Coach reveal |
| **2** | H: Classic Flap 1983 redesign + F pins | Re-engagement (triggered) | Carousel **P**: "is the Kelly holding value?" | **A**: "two zip pockets = fake Chanel?" |
| **3** | P: "Neverfull resale spread" + F pins | — | Reel (repurpose wk-2 Short) + Story quiz hook | **H**: "the Tabby's Bonnie Cashin story" |
| **4** | F + H pins (batch) | Price-trend digest (collector segment) | Carousel **T**: thrift-flip P&L | **F**: "which bag actually fits a laptop" |

Every cell links to a bag page with where-to-buy (and where-to-sell on thrift-flip
content), UTM-tagged per `docs/utm-conventions.md`.

---

## 7. Measurement — prove each channel's revenue impact

Tie every channel to existing analytics events (`src/lib/analytics/events.ts`) so
spend follows what converts (`docs/marketing-plan.md` §6: measure what predicts
revenue, ignore vanity).

| What to watch | Event | Tells us |
|---|---|---|
| Affiliate clicks (the money step) | `outbound_resale_clicked` | Which channel/campaign actually drives revenue intent |
| Quiz funnel + list growth | `quiz_started`, `quiz_completed` | Quiz-share campaign + email opt-in health |
| Recommendation pull-through | `recommendation_clicked` | Whether taste-targeting → clicks |
| Decision-point engagement | `auth_section_engaged`, `price_history_viewed` | Whether auth/price content draws the right intent |
| Saves & return intent | `item_saved`, `closet_favorited` | Owned-audience / retention signal |
| Demand roadmap | `search_not_found` | What content/pages to make next |

- **Attribution:** UTM `utm_campaign` = `<yyyy-mm>-<short-name>` lets you segment any
  event by campaign in PostHog (UTMs are session properties via
  `registerSessionAttribution`).
- **Ignore:** raw follower count, likes, time-on-page in isolation — vanity that
  doesn't predict revenue.

---

## 8. AI authenticity rules (video + social)

*Added 2026-06-29. Why this is its own section: for most brands AI-slop is a quality
problem; for us it's an existential trust problem, because trust is the product. We
sell "this bag is real" and "this is what it's worth." A single "this is AI" pile-up
in the comments makes every authentication and value claim we've made look suspect.
So our bar is not "don't look too AI." It's leave zero AI fingerprints.*

### Why the stakes are higher for us (the landscape, 2026)
- The feed is saturated. A named study (Kapwing's *TikTok AI Slop Report*) found
  ~59% of the first 500 videos served to a fresh For-You account were AI slop,
  roughly 3x YouTube's rate. Viewers are primed and scanning every clip for tells.
- The comment culture is the real danger. When a video reads as AI, the call-out
  comments out-like the post, and that backlash still counts as engagement, so the
  algorithm pushes it wider while the brand eats the reputational hit. You go viral
  for being fake. Worst possible outcome for a trust brand.
- Users now object to the *feeling of being tricked*, independent of quality. That
  is the exact opposite of our "we hand you the gatekept truth straight" positioning.

### The tells commenters hunt for → our never-do list
The reliable 2026 tells (per NPR, AOL, Colossyan, Faux Lens). Each is a rule: if a
frame could trip it, the frame does not ship.

| Category | The tell | Our rule |
|---|---|---|
| **Hands & objects** | Extra/melting fingers, a handle or clasp that morphs frame to frame, hardware that changes shape | Real hands on a real bag, filmed. AI never renders the product or the hands on it |
| **Text** | Morphing/garbled text; a logo, serial, or date code that shifts (still the hardest thing for every model) | Never show a serial, date code, creed stamp, or logo in AI footage. These are our credibility. Real macro shots only |
| **Motion & physics** | Too-smooth "gliding" movement, flickering shadows/hair/fabric, lighting that shifts as the camera pans | If a clip has that uncanny glide or flicker, cut it. Real handheld has micro-imperfection; keep it |
| **Voice/audio** | Monotone or over-smooth voiceover, no breath, emotion that doesn't track the words | Founder's real voice or a real human voice. No AI voice clone, no synthetic narration |
| **Faces** | Face-continuity slips, waxy skin, off blink timing | Real face (founder-persona) or no face. Never a synthetic presenter |
| **Account pattern** | Brand-new account posting viral-optimized content; the same clip reposted with one variable swapped | No template-variant spam. Each post is genuinely distinct |
| **Writing** | The AI-slop word/phrasing tells | `docs/voice-and-tone.md` §8 blacklist applies to captions + on-screen text |

Caveat from the research: "six fingers" is no longer reliable (Sora 2, Veo 3 mostly
fixed it). The dependable 2026 tells are stable text, real physics, real voice, and
real macro detail, which is exactly where authentication content lives. Good for us:
the hardest things to fake are the things we most need to be real anyway.

### TikTok's actual disclosure rule (what's solid vs. blog-noise)
- **Solid (TikTok official / reputable):** TikTok requires a visible AI label on
  content that uses AI to *create or significantly alter* a realistic depiction of a
  person, place, or event (one a viewer could mistake for authentic). It auto-detects
  via C2PA Content Credentials + invisible watermarking, so "just don't label it" is
  not an option, it gets caught. TikTok's stated position: the label is a disclosure
  mechanism, **not** a ranking penalty by itself.
- **Treat as unverified (third-party SEO blogs):** the precise scare-figures like
  "73% reach suppression in 48 hours." Directionally plausible, not from TikTok.
  Don't build the plan on the exact numbers.
- **The real takeaway:** the penalty isn't the label, it's (a) getting auto-flagged
  for *undisclosed* AI (a strike/trust risk) and (b) user behavior (people scroll
  past or pile on, and *that* tanks ranking). So even allowed, labeled AI video
  underperforms for a brand like ours.

### Editing real footage: what needs disclosure, what doesn't
The line is *what kind* of edit, not whether AI touched the file. Ordinary editing is
exempt; altering reality is not.

| Editing operation | TikTok disclosure? | Safe for us? |
|---|---|---|
| Cuts, trims, speed ramps, transitions | No | Yes |
| Color grading, lighting, filters | No | Yes |
| Crop, stabilize, zoom | No | Yes |
| Noise reduction, audio cleanup | No | Yes |
| Auto-captions, subtitles, text overlays (even AI-generated) | No | Yes |
| Auto-cut / "assemble my clips" assists | No | Yes |
| Background music, sound effects | No | Yes |
| Beauty filter / face retouch (light) | No (light only) | Sparingly; never on an authentication frame |
| AI background removal / replacement | **Yes** (alters the "place") | Avoid |
| Generative fill, object add/remove | **Yes** | **Never**, especially on bag detail |
| Face swap / de-age / substantial appearance change | **Yes** | Never |
| AI voice clone / synthetic narration / altered lip-sync | **Yes** | Never |

So a real thrift-haul edited in CapCut with cuts, color, auto-captions, and music is
fully clean and needs no label. That is the bulk of what we actually do.

**Two catches that bite in practice:**
1. **Metadata auto-labels you, even for innocent edits.** CapCut/Runway-type tools
   write C2PA/AI tags into the export, and TikTok reads them, so a benign AI feature
   (or just exporting through an AI editor) can trip an automatic label on real
   footage. Workflow fix: prefer the non-AI tools inside the editor; if you do use an
   AI feature, expect the label and don't fight it.
2. **Never strip the label/metadata to dodge detection.** It's a real cottage
   industry online; it's against TikTok policy and flatly against our honesty stance.
   Getting caught scrubbing a label is worse than the label.

### The airtight rules (these are hard rules, not guidance)
1. No AI-generated or AI-altered footage of a bag, ever. The product is always filmed.
2. No AI anywhere near a serial, date code, stamp, logo, or hardware. Authentication
   detail is real macro footage only. "Cleaning up" evidence with AI is tampering.
3. No synthetic or cloned voice. Real human voice only.
4. No synthetic face or presenter. Founder-persona on camera, or faceless real footage.
5. No template-variant spam (same clip, one variable swapped). Each post is distinct.
6. If a clip has the uncanny glide, flicker, morph, or physics slip, it does not ship,
   even if you can't say exactly why. Your gut "something's off" is your viewer's too.
7. AI *is* allowed for: scripting/hooks, editing (cut/color/clean-up/auto-cut),
   captions and on-screen text (run the §8 voice slop-sweep), research, and shot
   planning. Disclose per TikTok in the rare case anything generative reaches a frame.
8. Never alter reality (face, voice, appearance, scene, object), and never AI-touch an
   authentication frame at all. (Stricter than TikTok requires, on purpose.)
9. Turn the constraint into the brand. "Real bags, real hands, really checked" is a
   positioning advantage while most of the feed is slop. Say it out loud sometimes.

**Metric this moves:** protects completion rate + comment sentiment + return visits
(the trust signals that actually drive ranking) and the brand-trust asset itself; and
protects reach directly by avoiding undisclosed-AI auto-flags and the AI-search
downranking we already optimize against (`docs/voice-and-tone.md` §8).

---

## 9. Quick reference

- **Do-first quadrant:** Pinterest + Email + IG carousels (high revenue, low effort,
  repurposable). **Batch** the video.
- **Every post → a page → an affiliate/consignor link**, UTM-tagged.
- **Pillars:** auth · fit/compare · price/resale · thrift-flip · history.
- **Coach/thrift leads acquisition; ultra-luxury monetizes.**
- **Build dependency:** stand up the newsletter opt-in (at quiz completion) before
  the email plan can run.
- **Voice:** deeply informed, warmly told; one voice, register flexed by surface —
  see `docs/voice-and-tone.md`. Founder-persona (on-camera, first-person gush) vs.
  brand-system (everywhere else, no empty superlatives) per its §5.
- **AI never generates footage; it only edits real footage.** Never alter reality
  (face/voice/appearance/scene/object), never AI-touch an authentication frame, never
  strip an AI label. Full ruleset + TikTok disclosure map: **§8.**
</content>
