# Article ideas mined from our own data + Google Trends (2026-06-26)

*Data-analyst pass over the data captured this session (421 Coach peer-to-peer SOLD prices on eBay +
the 3,855 newly-promoted asking rows across ~15 brands) crossed with the Google Trends pull
(`trends-keyword-pull.md`). Goal: surface the surprising, purchase-relevant stories that should become
articles. Every figure below traces to a query against prod on 2026-06-26 with its n; values are our
captured market data, framed as estimates, never appraisals.*

## The data-analyst read: what is surprising and purchase-relevant

1. **Coach Tabby: sellers ask ~$365, buyers pay ~$198.** Tabby 26 realized median **$198** (eBay sold,
   n=177, last ~12mo) vs **$365** asking on the authenticated resellers (TRR/FP, n=43). The "list price"
   on resale is nearly double what the bag actually sells for. This is the single most decision-changing
   number we hold: it tells a buyer not to pay the ask, and a seller to price realistically.
2. **The Rogue holds 2.5–3x the Tabby.** Same brand, very different fate: Rogue 25 sold median **$499**
   (n=41), Rogue Standard **$645** (n=88) vs Tabby's **$198**. The structured leather Rogue is the Coach
   that keeps value; the trendy Tabby depreciates hard. A "which Coach actually holds value" story.
3. **The luxury "size paradox": smaller costs more.** Lady Dior asking medians invert by size: **Mini
   $3,925 (n=146) > Small $3,890 (n=105) > Medium $2,475 (n=184) > Large $1,750 (n=73).** Same pattern on
   Hermès Constance (18cm $11,950 > 24cm $9,995) and the Saddle (Medium $2,895 > Large $1,750). The
   smallest, least-practical size commands the highest price across maisons. Counterintuitive and buy-relevant.
4. **Search demand and price are inversely ranked among the icons.** Trends: the **Chanel Classic Flap is
   the LOWEST-searched of the five icons** (set 1) yet sits among the priciest; **Kelly slightly out-searches
   Birkin** (sets 1–2). Most-wanted ≠ most-expensive. A "demand vs price" data story.
5. **The LV tote torch is passing: Speedy is overtaking the Neverfull.** Trends: Speedy out-searches
   Neverfull today (set 3) and the **Neverfull is the one icon fading over 5 years** (set 5) while Speedy
   rises. *(Content lane already building `NeverfullSpeedyChart.tsx` — leave this to them; feed them the
   Trends line.)*
6. **Dior Saddle is genuinely back.** Trends ranks it second in the entry tier (set 4, ahead of Neverfull
   and Marmont), and we now hold its pricing (Saddle Medium $2,895, n=254). Rising demand + data in hand.
7. **"Real vs fake Chanel" dominates authentication intent** (set 7, far above LV and Marmont auth). The
   highest-demand authentication guide we could write is Chanel. (Research-heavy, never-invent; flag for
   the auth-content track, not this batch.)
8. **Polène is the breakout accessible-luxury riser** (set 6, 7→25 over 5y). We hold no Polène data yet;
   a capture + "is Polène worth it" piece is a strong early-mover bet once data exists.

## Ranked article slate (what to write)

| # | Article | Evidence base | Status / why | Metric |
|---|---|---|---|---|
| 1 (Recommended) | **What a Coach Tabby actually sells for (and why the Rogue holds more)** | Insights 1+2 — our 421 sold prices | **Draft written this batch.** Original data, brief-mandated Coach, thrift-aligned. | Engagement (original data, viral thrift) + monetization (Coach affiliate, high volume) |
| 2 | **The luxury size paradox: why the mini costs more than the medium** | Insight 3 — our asking data, n stated | **Draft written this batch.** Surprising, cross-maison, pure data (no new capture). | Engagement (counterintuitive) + monetization (Dior/Hermès links) |
| 3 | **Most wanted vs most expensive: the icon demand–price gap** | Insight 4 — Trends + our icon prices | Idea. Needs a clean demand-vs-price chart. | Engagement (data story) + GEO (icon SEO) |
| 4 | **Dior Saddle is back: what it costs now** | Insight 6 — Trends riser + our Saddle data | Idea. Timely. | Engagement (trend-timely) + monetization (Dior links) |
| 5 | **Speedy vs Neverfull** | Insight 5 | **Owned by Content lane** (`NeverfullSpeedyChart.tsx`). Hand off the Trends finding. | — |
| 6 | **Chanel authentication guide** | Insight 7 | Highest auth demand, but research-heavy + never-invent. Auth-content track, later. | GEO (top auth search) |
| 7 | **Is Polène worth it** | Insight 8 | Needs a Polène data capture first. Early-mover. | Engagement (riser) |

**Recommended next:** publish-ready drafts #1 and #2 are written (below, in `docs/research-drafts/`). They
need the Content lane to wire the body into the `post` renderer + build the one chart each references +
seed as a draft post. #3–#4 are quick follow-ups off data already in prod.
