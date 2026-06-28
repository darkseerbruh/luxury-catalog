# Analyst — open decisions

*The strategy analyst's decision feed. Newest OPEN decisions sit at the top, so any chat
you open leads with what needs your call. Format + thresholds: `docs/analyst-standard.md`.
The `analyst` subagent appends here on every daily scan + weekly brief; flip a Status to
`DECIDED — <what you chose>` once you act and it ages down.*

---

## Open decisions

### 2026-06-28 DECISION: Add a rental-affiliate outbound event (known taxonomy gap)
- **Evidence:** `src/lib/analytics/events.ts` has no rental event, but `monetization-projections.md` models rental as the 5th revenue stream on the `want` intent. The Vivrelle program is Pending approval (as of 2026-06-27); once it clears and the "Rent it first" CTA ships, rental clicks would go unmeasured.
- **Options:** (Recommended) add `outbound_rental_clicked` to the taxonomy when you build the CTA (which is itself gated on approval), so measurement ships with the feature, vs. add it now, vs. skip.
- **Moves:** the rental-affiliate proxy (revenue stream #2).
- **Confidence:** low-stakes, deterministic gap, not a judgment call.

> **Baseline note (2026-06-28, not a decision):** 30d ≈ 225 visitors / 299 pageviews_7d, but history only starts ~2026-06-20 and is mostly first-party, so **no week-over-week comparison is meaningful yet** and **no strategy bet can be called** (GEO-as-lead-channel: no organic search visible yet; quiz completion: 1 of 2 starts, n far too small; persona signatures: top brands Chanel/Hermès/LV skew ultra-luxury but n is tiny). Top entry pages: `/` (128), the Coach auth article (21), `/quiz` (10), `/bag/199` (8). Revisit the register once external/indexed traffic is non-trivial.

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
