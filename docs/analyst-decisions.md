# Analyst — open decisions

*The strategy analyst's decision feed. Newest OPEN decisions sit at the top, so any chat
you open leads with what needs your call. Format + thresholds: `docs/analyst-standard.md`.
The `analyst` subagent appends here on every daily scan + weekly brief; flip a Status to
`DECIDED — <what you chose>` once you act and it ages down.*

---

## Open decisions

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
- **Confidence:** Too thin to call a confirmed bug on counts alone (pre-launch, first-party). My read: seven wired sites + zero all-time makes a one-session live verification worth doing before launch. A leaning toward "break," not a verdict.
- **Class:** OWNER (needs a live end-to-end drive + her call on auth-gating vs. bug; not a blind in-repo edit).
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** DECIDED 2026-07-10 (owner) — hard check-in set for 2026-08-10: if non-direct traffic is still under 10% of weekly visitors, treat Bet 1 (GEO) as broken and open a strategy-revision decision.

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
