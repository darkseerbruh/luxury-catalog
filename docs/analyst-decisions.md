# Analyst — open decisions

*The strategy analyst's decision feed. Newest OPEN decisions sit at the top, so any chat
you open leads with what needs your call. Format + thresholds: `docs/analyst-standard.md`.
The `analyst` subagent appends here on every daily scan + weekly brief; flip a Status to
`DECIDED — <what you chose>` once you act and it ages down.*

---

## Open decisions

---

### 2026-08-27 DECISION: Paste the Turnstile SECRET into Supabase now — the widget is live in prod and /signup just took a 50x bot surge

- **Evidence:** All PostHog, prod host only (`www.luxurycatalog.com`), pulled 2026-08-28T03:37Z.
  - **`/signup` pageviews: 61 in the last 7d vs 1 in the prior 7d.** On 2026-08-27 alone: **49 pageviews from 49 distinct persons**, one pageview each, no second event. It is now the site's #1 entry page (66 entries, 7d), ahead of the Coach authentication article (40).
  - **Signature of the surge (2d window):** `$direct` + Chrome on Linux dominates — 149 distinct persons US/Linux/direct, then UK 23, France 15, Singapore 13, Japan 9. Same fingerprint flagged in the 2026-07-25 bot decision below.
  - **Site-wide daily visitors:** 2026-08-26 = 112 and 2026-08-27 = 185, against a 30d daily baseline of 16 to 38 (pulse `traffic.by_day`, 2026-07-29 → 2026-08-28). This is what is driving the pulse's `wow_change_pct: 86`; it is not audience growth.
  - **Precedent, in her own code:** `src/components/TurnstileField.tsx:5-13` records six bot accounts registered through the open form 2026-07-10 → 2026-07-23 (deleted 2026-07-26), each one making Supabase send a confirmation email to an address we do not control.
  - **Widget state:** the live site key `0x4AAAAAAEeQ3P0isTCTt6jP` is present in the deployed prod bundle (`/_next/static/chunks/1s827s1nul2t7.js`, fetched 2026-08-28), so the widget renders in prod. `docs/handoff.md:53` still lists the Supabase Attack-Protection secret paste as outstanding and hers. The documented ordering (widget first, toggle second) is now satisfied, so the toggle is safe to flip.
  - **What I cannot see:** `account_created` has fired **0 times all-time**, so analytics cannot tell you whether any of the 49 registered. That blind spot is the 2026-07-25 "Instrument account creation" decision, still OPEN.
- **Options:**
  | Option | What it does | Rating vs her stored preferences |
  |---|---|---|
  | **(Recommended) Paste the Turnstile SECRET into Supabase → Authentication → Attack Protection today, then load `/signup` once and complete a real signup to confirm the form still works** | Closes the form the six bot accounts came through, before a 50-a-day surge turns into a sender-reputation problem ahead of the first newsletter send | Best. It is the last step of work already shipped, and secret-pasting is hers by rule (secrets via the provider UI, never `.env`) |
  | Wait and watch another 48h to see whether the surge is a one-off scan | Cheap, but the cost of being wrong is Supabase emailing addresses we do not control, which is the one cost that is not reversible | Weak. The widget is already live, so waiting buys nothing |
  | Leave signup open and handle bot accounts by cleanup passes | This is the status quo that already produced six accounts in thirteen days, at a manual-cleanup cost each time | Do not choose |
- **Moves:** Intent funnel step (signup) and the email channel that lane 5 (premium tools) converts against. Secondarily it cleans the acquisition denominator that Bet 1 (GEO is the lead channel) is measured on.
- **Confidence:** High that the surge is automated, not human: 49 distinct persons, one pageview each, no second event, `$direct`, Chrome/Linux, spread across geos with no marketing in them. That is a fingerprint, not an inference. My read, not a verdict, is that at least some of it is registration probing rather than plain crawling, since `/signup` and `/where-to-sell` took the hit while article traffic held flat. I also cannot verify from here whether you already pasted the secret today; if you have, close this out.
- **Class:** OWNER (a secret pasted into a third-party dashboard; outward-facing auth behavior).
- **Status:** OPEN

---

### 2026-07-25 DECISION: Do NOT ship a view-count signup trigger yet — the behavior it would tax does not exist

- **Evidence:** All figures PostHog, prod host only (`www.luxurycatalog.com`), 30d window ending 2026-07-25T21:11Z. n = 597 sessions / 596 distinct persons.
  - **Bag pages per person, 30d:** 0 → 485 people (81%); 1 → 99; 2 → 5; 3 → 2; 4 → 1; 5 → 1; 6 → 1; then two outliers at 56 and 78. The two outliers viewed those pages in 2 minutes and 7 minutes respectively (2026-07-12 and 2026-07-14, both `$direct`, Chrome/US) — machine pacing, not browsing. **Excluding them, exactly 9 people in 30 days viewed 2 or more bag pages, and 0 viewed more than 6.**
  - **Return behavior:** sessions per person, 30d = 1 for 595 of 596 people; 1 person had 2. Returning-visitor share ≈ 0.2% (n=1).
  - **Session quality:** median session duration 5 seconds (p90 = 85s, n=680 sessions); 534 of 597 sessions (89%) were a single pageview.
  - **What "capture" holds today (Supabase, read 2026-07-25):** `profile` = **8 rows all-time**; `closet_item` = **2 rows all-time**; `newsletter_subscriber` = **0 rows**.
  - Any threshold she'd pick (3, 5, 10 bag pages) would fire on roughly 2 to 9 people per month, most of them her, previews, or crawlers.
- **Options:**
  | Option | What it costs / gains | Rating vs her stored preferences |
  |---|---|---|
  | **(Recommended) Hold the gate. Ship non-gated capture at the value moment instead** (email capture on the bag page + the existing logged-out save heart), and revisit a soft prompt only after ~500 organic sessions/week with a measured multi-page rate | Zero acquisition cost, zero GEO risk, and it builds the list now. The list is the thing premium (lane 5) converts against | Best. Consistent with "Catalog stays free forever" (`monetization-projections.md:30`) and "she hates walling results behind a signup" (`preferences.md:252`) |
  | Ship a soft, dismissible prompt after N views now (no content blocked) | Low harm, but unmeasurable: there is no signup event, so she cannot tell whether it worked. Also fires on ~9 people/month | Premature. Revisit once signup is instrumented and traffic is real |
  | Ship a hard gate (content blocked after N views) | Directly contradicts the GEO bet: an interstitial on a page a crawler or an AI assistant reads is a soft-404 risk, and the bet is that bag pages are the compounding asset | Do not choose |
- **Moves:** Acquisition (Bet 1, GEO) and the Intent funnel step. The gate would tax the top of the funnel to protect a capture step that currently receives ~9 humans a month.
- **Confidence:** High on the behavioral read — this is a count, not an inference, and every count is far below any plausible threshold. The leaning, not a verdict, is on the *future*: I cannot tell you what real organic visitors will do, because none have arrived at volume yet. Revisit the question with data, not now.
- **Class:** OWNER (strategy fork; touches the account value prop and the GEO bet).
- **Status:** OPEN

---

### 2026-07-25 DECISION: Instrument account creation before ANY capture experiment — signup is 100% dark

- **Evidence:** `src/lib/analytics/events.ts` defines 41 events (read 2026-07-25). **None of them is a signup, registration, or account-created event.** `src/app/signup/page.tsx` fires no `track()` call. PostHog prod, 90d to 2026-07-25: `$identify` **never fired** (only `$autocapture`, n=1,602, appears in the auth-signal query), so no session has ever been tied to a logged-in identity on prod. Meanwhile `/signup` is the **#2 most-viewed path** in 30d (43 views, 43 distinct people) and `/login` is #5 (21 views, 21 people) — every one of those people had a single pageview, which reads as path-probing, not intent. Net: the funnel step she wants to optimize has no numerator and no denominator.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Add `account_created` (with `source` + `trigger` props) fired on successful signup, and `$identify` on session start for logged-in users** | Makes signup rate, and therefore any capture experiment, measurable at all. Cheap, in-repo, reversible | Best. Matches her locked pattern: measurement ships with the feature |
  | Add the event only when/if a gate ships | The first real signups go unmeasured and set no baseline | Do not choose — same mistake as the quiz (2026-07-13 decision) |
  | Rely on Supabase `profile` row counts | Gives a total but no source, no funnel, no per-surface attribution | Insufficient alone |
- **Moves:** Every lane indirectly; directly it makes lane 5 (premium tools, "converting a few % of registered users") measurable. Today that modeled lever has no observable denominator.
- **Confidence:** Deterministic. Confirmed by reading the taxonomy file and by a 90d PostHog query returning no `$identify`. Not a judgment call.
- **Class:** AUTO (in-repo, reversible, no published number, no nav, no strategy doc touched).
- **Status:** OPEN

---

### 2026-07-25 DECISION: Filter bot traffic out of the pulse — "596 visitors" is roughly 30 human sessions

- **Evidence:** PostHog prod, 30d to 2026-07-25 (n=597 sessions):
  - **Geography:** United States 266 sessions, then Germany 67, Sweden 66, **Singapore 64**, Austria 35, Netherlands 27, **Luxembourg 16**. There is no marketing, no social, and no content aimed at any of those markets.
  - **Client:** Chrome on **Linux = 93 sessions** (16%), the second-largest OS after macOS. Desktop 501 vs mobile 96 — inverted for a luxury-resale consumer audience.
  - **Shape:** 92% `$direct` (547/597); 89% single-pageview; median session 5 seconds; 1.00 sessions per person.
  - **Real external human traffic, 30d:** organic search referrers total **8 sessions** (google.com 4, cn.bing.com 2, duckduckgo 1, yahoo 1), AI referral **2** (chatgpt.com), social **23** (l.instagram.com 15, m.facebook.com 6, www.facebook.com 2). That is ~33 sessions of identifiable outside humans in a month.
  - The pulse currently reports `real_visitors_30d: 636` and `wow_change_pct: 20`. Every baseline note in this feed since 2026-07-10 quotes those numbers.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Add a bot/low-quality filter to the pulse** (exclude sessions with duration < 2s AND 1 pageview; report Linux-desktop-direct separately) and report "identified human sessions" alongside the raw count | Stops a WoW swing in crawler volume from reading as audience growth or collapse; makes the 2026-08-10 GEO check-in honest | Best. This is exactly the §1 "a broken tracker reads as demand" failure, inverted |
  | Report raw counts with a standing caveat line | Cheaper, but every future reader re-derives the caveat, and the urgent thresholds still fire on bot swings | Acceptable fallback |
  | Leave it | The 2026-08-10 GEO call gets made against an inflated denominator, which biases the organic-share ratio **downward** and could false-FAIL the bet | Do not choose |
- **Moves:** Acquisition read (Bet 1) and every §3 urgent threshold, all of which are denominated in visitors.
- **Confidence:** My read is that the majority of the 596 is automated. The signature (datacenter geos, Chrome/Linux share, 5s median session, 1.00 sessions/person, 92% direct) is consistent and mutually reinforcing. I cannot prove it per-session without IP/UA data PostHog does not expose here, so treat it as a strong leaning, not a verdict — the fix is defensive either way.
- **Class:** AUTO (in-repo change to `scripts/analytics-pulse.ts`; adds a field, does not remove the raw one).
- **Status:** OPEN

---

### 2026-07-25 DECISION: Verify the newsletter write path, then put email capture on the bag page

- **Evidence:** `newsletter_subscribed` has fired **2 times all-time** (last 2026-06-22T20:49Z), and the event only fires inside the `result.ok` branch of `subscribeNewsletter` (`src/components/NewsletterSignup.tsx:39-41`). The `newsletter_subscriber` table returns **0 rows** (Supabase, read 2026-07-25). Two successful client-side subscribes and zero stored rows is either a deleted test pair or a silent write failure; it is worth two minutes to know which, because this is the surface I am recommending she scale. Separately: the form is mounted on `/` (`src/app/page.tsx:194`), the footer (`src/app/layout.tsx:134`), `/articles` (`:542`) and `/taste` (`:142`) — **not on the bag page**, which is where the depth actually happens (30d: `variant_viewed` 109 people, `value_module_viewed` 109, `price_history_viewed` 103).
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Drive one live subscribe end-to-end, confirm a row lands, then add the capture to the bag page at the value moment** (price-alert framing, no gate, no blocked content) | Turns the deepest engagement surface into the one capture point that costs nothing in acquisition. Any reader-facing copy runs through `brand-voice` first | Best |
  | Verify the write path only, defer placement | Half the value; the bag page stays capture-less | Partial |
  | Scale placement without verifying the write | Risks building a funnel into a table that never receives rows | Do not choose |
- **Moves:** Intent step → the owned-audience asset the projections lean on ("a registered-user base premium converts against", `monetization-projections.md:16`). Email is the only capture channel that does not tax GEO.
- **Confidence:** The 0-rows-vs-2-events gap is a fact; my read on *why* is genuinely uncertain (deleted test rows is at least as likely as a bug). Sending is still blocked (no Resend), so this builds a list she cannot yet mail — that is the correct order, not a blocker.
- **Class:** OWNER (needs a live submit from a real session; the placement half is AUTO once the write path is confirmed).
- **Status:** OPEN

---

### 2026-07-25 DECISION: Act on indexing before the 2026-08-10 GEO check-in — 4,030 bag URLs submitted, ~0 indexed

- **Evidence:** `https://www.luxurycatalog.com/sitemap.xml` (fetched 2026-07-25) contains **4,152 URLs, of which 4,030 are `/bag/…`** and 49 are `/brand/…`. A `site:luxurycatalog.com` query against DuckDuckGo (Bing-backed index, same 2026-07-25) surfaces **9 distinct URLs**: `/`, `/about`, `/articles`, one article, `/authentication`, `/how-we-tier`, `/login`, `/rankings`, `/shop`. **No `/bag/` page and no `/brand/` page appears.** `robots.txt` is permissive (`Allow: /`, only `/admin` disallowed), so this is not a blocking problem — it is a crawl-budget/indexation problem. Consistent with behavior: 8 organic-search sessions and 2 AI-referral sessions in 30d.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Open Bing Webmaster Tools + Google Search Console now and read actual index coverage** (submitted vs indexed, crawl errors, discovered-not-indexed), rather than waiting for 2026-08-10 to read it off referrer share | The 8/10 trigger tests the *symptom*. Index coverage tests the *cause*, and it is available today. If bag pages are "discovered, currently not indexed," the fix is content/internal-linking, not patience | Best |
  | Wait for 2026-08-10 as decided | Keeps the existing discipline but spends 16 more days not knowing whether the asset is even in the index | Acceptable, weaker |
  | Reduce the sitemap to a high-quality subset and grow it | A real lever if coverage confirms crawl-budget dilution across 4,030 thin URLs; do not act on it without the coverage data | Conditional on option 1 |
- **Moves:** Acquisition, Bet 1 (GEO is the lead channel) — the spine feeding all five lanes. This outranks any capture question by an order of magnitude: capture rate on ~30 human sessions a month is worth roughly nothing; indexation of 4,030 pages is the whole model.
- **Confidence:** The sitemap count is exact. The index count is a **weak proxy** — `site:` results are truncated and deduplicated by the engine, and DuckDuckGo is not authoritative for Google. Read this as "no evidence bag pages are indexed," not "proof they are not." The authoritative source is Search Console, which is why the recommendation is to go look.
- **Class:** OWNER (needs her logins to Search Console / Bing Webmaster Tools).
- **Status:** OPEN

---

### 2026-07-13 DECISION: Verify the `item_saved` flow before launch — 7 wired call sites, zero fires all-time

- **Evidence:** `item_saved` is wired at seven call sites (`BagActions.tsx` ×2, `StickyActionBar.tsx` ×2, `ReviewForm.tsx`, `QuickSaveHeart.tsx`, `PendingSaveFlusher.tsx`) yet the pulse shows `count_all_time` = 0, `last_seen` = null (2026-07-13, all-time). Over the 30d prod journey (to 2026-07-13): variant_viewed 91 → price_history_viewed 84 → value_module_viewed 86 → **item_saved 0**. Depth engagement is strong (94% of bag-page viewers reach the value module), but the save-intent step is completely dark. The design even has a logged-out stash-and-flush path (`PendingSaveFlusher` fires `item_saved` after signup), so a save firing zero across 91 bag views and all history is more consistent with a break than with "no one saved."
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Drive the save flow end-to-end on preview** (logged-out heart → signup → flush, and a logged-in save) and confirm `item_saved` fires; fix the break if it does not | Cheapest before external traffic sets a false baseline; a break here is the "tracker reads as demand dropped" mistake | Best |
  | Wait for external traffic, then read it | If it is a break, the first real saves go unmeasured | Acceptable only after a quick drive confirms wiring |
  | Assume first-party noise; do nothing | Blinds the flywheel's core intent signal | Do not choose |
- **Moves:** `item_saved` is the Intent step (`want`/`have`) feeding Maya's aspiration loop, Sofia's `have`-add, and every downstream lane. A dark save event blinds the whole engagement→monetization flywheel.
- **Code audit 2026-07-13 (owner-directed):** all seven call sites read clean. Each fires `track(EVENTS.itemSaved, …)` only inside the success branch of a save/watch server action (`QuickSaveHeart`, `BagActions` ×2, `StickyActionBar` ×2, `ReviewForm`, `PendingSaveFlusher`); the logged-out heart correctly stashes intent + routes to `/signup`, and `PendingSaveFlusher` fires the event after the account exists. **No wiring bug found.** The zero is fully consistent with a behavioral zero pre-launch: a save requires a logged-in user, the owner (the main first-party saver) is internal-excluded from the pulse, and external non-internal logged-in traffic ≈ 0. This **downgrades the earlier "leaning toward break" read** to "expected pre-launch."
- **Confidence:** No bug on inspection; zero is behavioral. Still worth one opportunistic end-to-end drive (logged-out heart → signup → flush) at/after launch to confirm the event fires from a real non-internal session before the first external saves land — a launch-day check, not a pre-launch blocker.
- **Class:** OWNER (needs a live end-to-end drive from a real logged-in, non-internal session; can't be driven in-repo — creating accounts / signing in is out of scope for automation).
- **Status:** OPEN (code audited clean 2026-07-13; awaits a live fire-confirmation)

---

### 2026-07-13 DECISION: Wire `quiz_started` + `quiz_completed` on the /quiz page so Bet 4 becomes measurable

- **Evidence:** Grep of `src/` (2026-07-13): `quiz_completed` has **zero call sites anywhere** — defined in `events.ts`, never fired by any surface. `quiz_started` fires only from the homepage `StyleReadCallout` (flag-gated), **not** from the dedicated `/quiz` page (`TasteQuizClient.tsx`), which is the route linked from the header nav, footer, About, profile, and PersonalizedRecs. `TasteQuizClient` fires no `track()` calls at all. Pulse all-time: quiz_started 2, quiz_completed 1 (last 2026-06-26) — the lone completion predates the current page and cannot recur. Bet 4 (engagement-strategy §2b: "quiz completes ~65%") is therefore untestable by construction.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Wire `quiz_started` on first advance + `quiz_completed` (with completeness) on reaching the result**, inside `TasteQuizClient` | Makes the start→complete funnel real; fires in `next()` so the post-signup restore path is excluded | Best |
  | Wire only `quiz_completed` | Leaves the start→complete rate uncomputable | Partial |
  | Leave it | Bet 4 stays permanently unmeasurable | Do not choose |
- **Moves:** the Intent step (quiz) + Bet 4 measurability. The quiz is the cold-start engine feeding recommendations → buyer affiliate (lane 1) and shareable acquisition.
- **Confidence:** Deterministic instrumentation gap, confirmed by grep (no call site). Completion-rate reads stay pre-launch-thin until real traffic arrives.
- **Class:** AUTO (in-repo, reversible; two `track()` calls in `TasteQuizClient`; no published number, nav, or strategy touched).
- **Status:** DECIDED (auto-implemented 2026-07-13, commit 9d78de9) — `quiz_started` (first advance) + `quiz_completed` (with `completeness`) now fire from `TasteQuizClient.next()`; green gate passed (tsc / lint / build / 841 tests). Bet 4 is now measurable once real traffic arrives.

---

### 2026-07-13 DECISION: Redefine the 2026-08-10 GEO check-in as organic+AI-referral share, not "non-direct" share

- **Evidence:** The 2026-08-10 check-in (DECIDED 2026-07-10) reads Bet 1 (GEO) as broken if "non-direct traffic is still under 10% of weekly visitors." But the non-direct traffic that is actually appearing is **social, not GEO**. Acquisition 7d to 2026-07-13 (n=194 visitors, +143% WoW): $direct 148 (76%), luxurycatalog.com self-ref 15, ig 11, tiktok 3, facebook 4, google.com 1. External non-direct ≈ 19 (~10%), of which ~18 is social (ig/tiktok/fb) and organic search is a single google.com hit; **zero AI-referral** (the lone chatgpt.com referrer seen 7/10–7/11 has dropped out of the 7d window). So a social bump alone could push "non-direct" over 10% and register a **false PASS** on a GEO bet that is still effectively at zero. The trigger measures the wrong thing.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Redefine the 8/10 trigger:** GEO is broken if **organic-search + AI-referral** (chatgpt / perplexity / bing / google) share is under ~5% of weekly visitors, measured separately from social | Tests the actual bet; keeps the date | Best |
  | Keep "non-direct <10%" | Risks a false pass from social | Do not choose |
  | Add a second GEO-specific line alongside the existing one | Works, but cleaner to just redefine | Acceptable |
- **Moves:** Acquisition / Bet 1 (GEO is the lead channel) — the spine feeding all five lanes. A false pass would let a broken acquisition thesis go unchallenged.
- **Confidence:** The definitional gap is deterministic. Whether GEO is on track stays too thin to call today (organic+AI ≈ 1 visitor/7d; pre-launch indexing window runs to ~8/10). Leaning: keep the 8/10 date, fix what it measures.
- **Class:** OWNER (edits a strategy trigger she set + the acquisition-thesis read).
- **Status:** DECIDED (owner-directed 2026-07-13, "fix everything you can") — the operative 2026-08-10 trigger is redefined: **treat Bet 1 (GEO) as broken if organic-search + AI-referral share (chatgpt / perplexity / bing / google organic) is under ~5% of weekly visitors, measured separately from social (ig / tiktok / fb).** Replaces the "non-direct < 10%" definition, which social traffic could false-pass. Date (2026-08-10) unchanged; ~5% threshold inherited from the recommendation, tunable. Reversible doc edit — revert if you prefer the original wording.

---

### 2026-06-29 DECISION: Add three newly-wired events to the analytics pulse query

- **Evidence:** Three events were added to `src/lib/analytics/events.ts` on 2026-06-28 (commit 945281e) and are now firing from live surfaces: `article_viewed` (editorial article reads, excluding drafts), `attribute_object_viewed` (all five object pages via `AttributeObjectPage`), and `bags_compared` (side-by-side compare CTA). None of the three appear in the `journey_step_order` array in `scripts/analytics-pulse.ts`, so they produce data in PostHog but are invisible to the decision feed. The `bags_compared` event is the decision-intent signal for the Cross-Shopper overlay persona; `article_viewed` is the primary GEO/content-channel engagement signal; `attribute_object_viewed` feeds the Collector persona's depth signature. Measured as of 2026-06-29T13:40Z, n=249 30d visitors.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Add all three to the pulse journey query now** | Closes the gap before external traffic arrives; baseline is near-zero so cost is trivial; signals ship with the feature per her stated preference | Preferred -- cheap, complete, no loss |
  | Add only `bags_compared` (highest-value signal) | Partial fix; leaves article and attribute depth invisible | Acceptable if time-boxed |
  | Skip; add when traffic is material | Risks missing the early baseline entirely; the Coach auth article already draws 21 entries/week | Do not choose |
- **Moves:** `article_viewed` moves the GEO/content-channel acquisition read (no other event captures editorial engagement). `bags_compared` moves the Cross-Shopper intent signal and decision-depth read (buyer affiliate, lane 1). `attribute_object_viewed` moves the Collector/Sofia depth funnel read.
- **Confidence:** Deterministic gap, not a judgment call. The events are wired and firing; the pulse just does not ask for them. Fix is a four-line addition to `analytics-pulse.ts`.
- **Status:** DECIDED 2026-07-10 — all three (`article_viewed`, `attribute_object_viewed`, `bags_compared`) verified present in the pulse `journeyEvents` array (`scripts/analytics-pulse.ts:205-208`); no further change needed.

---

### 2026-06-29 DECISION: Set a GEO-channel watch deadline and define what "confirmed" looks like

- **Evidence:** As of 2026-06-29T13:40Z (9 days of PostHog history, data starts ~2026-06-20): 7d visitors = 246, of which $direct = 190 (77%). No organic search referrer, no AI-referral, no social referrer appears in the top-12 source list. The written bet in `monetization-projections.md` §1 is explicit: "GEO is the lead channel. Every bag page is front-loaded, fact-dense, schema-marked, named-author, with cited sources and a sitemap submitted to Bing (ChatGPT). That's a compounding, faceless traffic engine." The projections model base-case M3 at 4,500 visitors (launch + 8 weeks), which is 18x current run-rate. The 2026-06-20 baseline note said "no organic search visible yet" and deferred the call -- that deferral is still valid, but the window for deferring is closing: if GEO is the channel, indexed organic traffic should begin appearing within the next 4-6 weeks. An absolute threshold is needed now so the call is made on data, not intuition. Absolute counts are too thin to call the bet broken today (n=246, 9 days), but the absence of any non-direct traffic is a leading indicator worth monitoring actively. No urgent threshold (section 3) has been crossed.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Set a hard check-in: if non-direct traffic is still under 10% of weekly visitors by 2026-08-10 (six weeks from now), treat Bet 1 as broken and open a strategy-revision decision** | Gives GEO the 8-12 week indexing window the projections assume; creates a concrete, date-gated trigger; prevents both premature alarm and indefinite deferral | Best fit with her instrument-then-decide pattern |
  | Investigate indexing health now (Bing Webmaster Tools, sitemap submission status, GSC if set up) | Useful regardless; adds signal without changing the call | Complementary, not exclusive |
  | Do nothing; keep deferring | No trigger, no call; the strategy assumption stays unchecked indefinitely | Do not choose |
- **Moves:** GEO/AI-referral is the acquisition spine feeding all five revenue lanes. If Bet 1 breaks, the traffic ramp in `monetization-projections.md` compresses toward the conservative case (~$7K yr-1 take-home vs. ~$32K base), and the strategy doc needs a revised acquisition thesis.
- **Confidence:** Too thin to call the bet broken or confirmed today (n=246, 9 days, mostly first-party). My read: the absence of any organic referrer at day 9 is within the expected indexing delay -- but a six-week watch deadline is the right discipline. The 2026-06-24 model explicitly says "recalibrate the moment you have 4-6 weeks of real PostHog data."
- **Status:** DECIDED 2026-07-10 (owner) — hard check-in set for 2026-08-10. **Trigger redefined 2026-07-13** (see the 2026-07-13 GEO-redefinition decision above): if **organic-search + AI-referral share is under ~5% of weekly visitors** (measured separately from social), treat Bet 1 (GEO) as broken and open a strategy-revision decision. Supersedes the original "non-direct < 10%" wording, which social traffic could false-pass.

---

### 2026-06-29 DECISION: Remove or repurpose the dead `style_viewed` event from the taxonomy and pulse

- **Evidence:** `style_viewed` appears in `src/lib/analytics/events.ts` (documented as "A style detail page was opened") and in the pulse's `journey_step_order` array, with a 30d count of 0. The 2026-06-28 wiring audit (now in the Decided section) confirmed the reason: the app is a variant-PDP architecture, so `variant_viewed` is the functional bag-page view event. No surface calls `track(EVENTS.styleViewed, ...)`. Keeping it in the taxonomy misleads future contributors into thinking it fires (or should fire); keeping it in the pulse query wastes a PostHog API call and adds a 0 row that implies a tracking break on every read. Measured: n=0 over 30d, 249 30d visitors.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Delete `styleViewed` from `events.ts` and remove it from the pulse `journey_step_order`** | Clean taxonomy; no misleading zero; saves one PostHog query slot for a live event | Best |
  | Re-wire it to fire alongside `variant_viewed` (a style-level view, not variant-level) | Only useful if the analytics strategy needs a style-level (not variant-level) funnel step -- not currently modeled | Defer until a use case exists |
  | Leave it | Perpetuates a misleading zero on every pulse read | Do not choose |
- **Moves:** Taxonomy hygiene; frees a pulse slot for one of the three new events above. No direct revenue-lane move, but accurate instrumentation protects every downstream decision.
- **Confidence:** Deterministic. The event is unwired and has no call site. This is a cleanup, not a judgment call.
- **Status:** DECIDED 2026-07-10 — `styleViewed` already gone from `events.ts` and the pulse `journeyEvents`; removed the last lingering reference (`scripts/setup-posthog.mjs` "Depth actions" tile). Taxonomy clean.

---

### 2026-06-29 DECISION: Investigate the value-to-click gap before external traffic arrives

- **Evidence:** 30d journey funnel (2026-06-29T13:40Z, distinct people, n=249 30d visitors): pageview 244 -> variant_viewed 28 (11% reach a bag page) -> price_history_viewed 25 (89% of bag-page viewers) -> value_module_viewed 22 (88%) -> outbound_resale_clicked 0 (0%). Twenty-two distinct people reached the value module -- the deepest pre-purchase step -- and zero clicked an affiliate outbound link. The rigor bar requires absolute counts: n=22 is below the threshold for a confident claim, and the traffic is predominantly $direct (first-party/developer), which will never produce affiliate clicks. However, the funnel shape itself is notable: depth engagement (price history, value module) is high relative to the base, but the handoff to affiliate is zero. Two competing explanations: (a) the current visitors are first-party and not shopping -- the 0 is expected and will self-correct as external traffic arrives; (b) the CTA placement or prominence at the end of the value module is weak and will cost real visitors too. The distinction matters because (b) is a build decision, not a wait decision, and it is cheapest to fix before external traffic arrives and sets a behavioral baseline. The Vivrelle affiliate program is still pending approval, so rental is not yet a comparison point.
- **Options:**
  | Option | Effect | Rating |
  |---|---|---|
  | **(Recommended) Do a qualitative CTA audit now: confirm the buy/sell/rent hand-off is above-the-fold on mobile and reachable without scrolling past the value module; fix any gap before external traffic arrives** | Cheap, one session; does not require more data; protects the affiliate backbone before it matters | Best -- fixes it at zero cost before it counts |
  | Wait for external traffic (target: 200+ non-direct visitors) and then evaluate outbound CTR | Data-grounded but delays a potentially cheap fix; if the CTA is buried, the first real visitors set a low baseline | Acceptable only if a quick visual audit already confirmed CTA placement is solid |
  | Do nothing | The 0 is probably first-party noise, but if the CTA is actually buried this costs the backbone lane | Do not choose |
- **Moves:** Directly moves `outbound_resale_clicked` (buyer affiliate, lane 1 -- the backbone). The model's base-case CTR assumption is 4.5%; even a buried CTA on a pre-launch site is a pre-launch fix, not a post-launch optimization.
- **Confidence:** The n=22 is too thin to call the drop-off a real problem vs. first-party noise. My read: the first-party explanation is more likely (developer traffic does not shop), but a CTA audit costs one hour and is right to do before external traffic creates a baseline. Frame this as "pre-launch hygiene," not "the funnel is broken."
- **Class:** OWNER (recommended action is a qualitative CTA/visual placement audit + judgment, not a blind in-repo edit).
- **Status:** OPEN

---

### 2026-06-28 DECISION: Add a rental-affiliate outbound event (known taxonomy gap)
- **Evidence:** `src/lib/analytics/events.ts` has no rental event, but `monetization-projections.md` models rental as the 5th revenue stream on the `want` intent. The Vivrelle program is Pending approval (as of 2026-06-27); once it clears and the "Rent it first" CTA ships, rental clicks would go unmeasured.
- **Options:** (Recommended) add `outbound_rental_clicked` to the taxonomy when you build the CTA (which is itself gated on approval), so measurement ships with the feature, vs. add it now, vs. skip.
- **Moves:** the rental-affiliate proxy (revenue stream #2).
- **Confidence:** low-stakes, deterministic gap, not a judgment call.
- **Class:** OWNER (gated on the Vivrelle program clearing approval + the "Rent it first" CTA build — outward-dependent).

> **Baseline note (2026-07-10, daily scan):** real_visitors 7d = 141 (+44% WoW vs 98), 30d = 386. Pre-launch mode, so counts are readiness not audience. First real non-direct traffic now present: $direct 118, ig 8, tiktok 4, facebook 4, chatgpt.com 1, cj.com 1 (7d) -- direct is down to ~84% and social + one AI referrer have appeared. Top entry pages (7d): `/` (32), `/signup` (13), `/social/instagram` (9), `/bag/589` (6), `/rankings` (5). Value proxies: `outbound_resale_clicked` all-time = 4 (last fired today 2026-07-10, so wired + live, not broken); `outbound_consign_clicked` still 0. Instrumentation: 19/40 events have fired ever; `bags_compared` + `attribute_object_viewed` (n=1) still effectively silent (see 2026-06-29 pulse-query decision). Quiz still n<3 (too thin). Top brands 30d: Chanel 23 / Hermes 18 / Coach 10 / Fendi 5 / LV 4 -- ultra-luxury skew holds but n too thin to call distribution. No section-3 urgent threshold tripped this scan. Full strategy-register walk deferred to Monday deep brief; revisit once 200+ non-direct visitors accumulate.
>
> *(Prior 2026-06-29 baseline: 30d 249 visitors, 77% $direct, no non-direct traffic; superseded above.)*

> **Baseline note (2026-07-11, daily scan):** real_visitors 7d = 172 (+107% WoW vs 83 prior 7d), 30d = 424; 21 internal excluded. Pre-launch, so counts are readiness not audience. Acquisition 7d: $direct 149 (~87%), ig 8, tiktok 3, facebook 4, chatgpt.com 1, cj.com 1 -- direct share ticked back up vs 7/10 (~84%), non-direct still tiny (n too thin to read the GEO bet; the 2026-08-10 check-in still governs). Top entry pages (7d): `/` (31), `/signup` (19, up from 13), `/social/instagram` (9), `/bag/589` (6), `/rankings` (5). Value proxies: `outbound_resale_clicked` all-time = 4 (last fired 2026-07-10, wired + live, not broken); `outbound_consign_clicked` still 0. Instrumentation: 20/40 events fired ever (+1 WoW); `attribute_object_viewed` (n=1) + `bags_compared` (n=3) still effectively silent (see 2026-06-29 pulse-query decision, now DECIDED). Quiz still n<3 (too thin: started 2, completed 1). `search_not_found` all-time = 1 (no gap cluster). Top brands 30d: Chanel 23 / Hermes 18 / Coach 10 / Fendi 5 / Gucci 4 / LV 4 -- ultra-luxury skew holds, n too thin to call distribution. No section-3 urgent threshold tripped this scan. Full three-lens + strategy-register walk deferred to Monday deep brief.

---

## Decided / archived

### 2026-06-28 DECIDED — wiring audited in code; fixed the one real gap (`auth_section_engaged`)
The "verify the value-proxy events fire" decision, resolved by a source audit of every value event's `track()` call site in `src/` (more reliable than one self-traffic click):
- **Wired and reachable, so the 0s are thin/first-party traffic, not bugs:** `outbound_resale_clicked` (`WhereToBuy.tsx`, `/identify`), `outbound_consign_clicked` (`WhereToSell.tsx`, `ThriftFindForm`, `/identify`), `item_saved` (`BagActions`/`StickyActionBar`/`ReviewForm`), `authentication_interest` (`RequestAuthentication`, `AuthInterestButton`).
- **Unwired but no surface exists yet, so expected:** `monetization_interest` (no premium fake-door built), `inquiry_submitted` (no contact/lead form), `style_viewed` (the app is variant-PDP, so `variant_viewed` is the page view; this taxonomy entry is effectively dead).
- **Unwired WITH a live surface = the real gap, now FIXED:** `auth_section_engaged`. The bag page has authentication disclosures (the "How to authenticate" checklist and the "Serial & authentication tags" expander) but nothing fired the event. Added `AuthEngagementTracker.tsx` (client island, matches the `TrackBagView` idiom): fires once when the auth checklist scrolls into view (`section: how_to_authenticate`) and once when the serial-tags disclosure is expanded (`section: serial_tags`). Gates green (tsc / eslint / build / 448 tests).
- **Moves:** unblocks the **Authentication Marketplace (Rev #2)** top-of-funnel read (who actually engages the auth/trust pillar), and confirms the **buyer-affiliate backbone** proxy is wired.
- **Follow-ups:** wire `monetization_interest` when a premium fake-door ships; consider deleting the dead `style_viewed` from `events.ts` + the pulse query.

_Decisions move here once you act on them. Kept as a short audit trail of what the data
drove, then pruned when the list gets long._
