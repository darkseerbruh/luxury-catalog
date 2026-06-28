# Analyst — open decisions

*The strategy analyst's decision feed. Newest OPEN decisions sit at the top, so any chat
you open leads with what needs your call. Format + thresholds: `docs/analyst-standard.md`.
The `analyst` subagent appends here on every daily scan + weekly brief; flip a Status to
`DECIDED — <what you chose>` once you act and it ages down.*

---

## Open decisions

### 2026-06-28 DECISION: Verify the value-proxy events actually fire before reading any funnel
- **Evidence (PostHog, 30d window; data history begins ~2026-06-20, so n is ~8 days):** depth events fire fine (`price_history_viewed` 23, `value_module_viewed` 20, `variant_viewed` 26), but **every money-line event is 0**: `outbound_resale_clicked` 0, `outbound_consign_clicked` 0, `monetization_interest` 0, `authentication_interest` 0, `inquiry_submitted` 0, `item_saved` 0. Also `style_viewed` 0 while `variant_viewed` 26 (bag pages are clearly being opened), and `auth_section_engaged` 0 despite the Coach auth article being the #2 entry page (21 entries). Traffic is dominated by `$direct` (171) plus `localhost:3000` / vercel-preview referrers, i.e. mostly first-party dev/preview, not external users.
- **Options:**
  | Option | Effort | Fit with how you work |
  |---|---|---|
  | **(Recommended) Manually click a real outbound buy link + a save + a fake-door on a live bag page, confirm each lands in PostHog, wire any that do not** | ~20 min | Matches "instrument it, then let usage decide"; cheap insurance before launch |
  | Assume the zeros are just thin pre-launch traffic, revisit after launch | 0 | Risk: launch with a blind revenue meter |
  | Defer until external traffic arrives | 0 | Same blindness, later |
- **Moves:** protects the **buyer-affiliate backbone** proxy (`outbound_resale_clicked`) plus the auth + premium fake-door proxies. If these are unwired, every revenue read is blind, so this gates the whole metric tree.
- **Confidence:** my read, not a verdict. 20 value-module views with 0 outbound clicks is suspicious enough to check, but it could also be genuinely no buyers among self-traffic. It is cheap to verify, so verify rather than assume.
- **Status:** OPEN

### 2026-06-28 DECISION: Add a rental-affiliate outbound event (known taxonomy gap)
- **Evidence:** `src/lib/analytics/events.ts` has no rental event, but `monetization-projections.md` models rental as the 5th revenue stream on the `want` intent. The Vivrelle program is Pending approval (as of 2026-06-27); once it clears and the "Rent it first" CTA ships, rental clicks would go unmeasured.
- **Options:** (Recommended) add `outbound_rental_clicked` to the taxonomy when you build the CTA (which is itself gated on approval), so measurement ships with the feature, vs. add it now, vs. skip.
- **Moves:** the rental-affiliate proxy (revenue stream #2).
- **Confidence:** low-stakes, deterministic gap, not a judgment call.

> **Baseline note (2026-06-28, not a decision):** 30d ≈ 225 visitors / 299 pageviews_7d, but history only starts ~2026-06-20 and is mostly first-party, so **no week-over-week comparison is meaningful yet** and **no strategy bet can be called** (GEO-as-lead-channel: no organic search visible yet; quiz completion: 1 of 2 starts, n far too small; persona signatures: top brands Chanel/Hermès/LV skew ultra-luxury but n is tiny). Top entry pages: `/` (128), the Coach auth article (21), `/quiz` (10), `/bag/199` (8). Revisit the register once external/indexed traffic is non-trivial.

---

## Decided / archived

_Decisions move here once you act on them. Kept as a short audit trail of what the data
drove, then pruned when the list gets long._
