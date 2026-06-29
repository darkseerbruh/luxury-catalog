# Google Trends keyword pull — cross-chat task

*Created 2026-06-26 by the Content chat. Browser work, delegated to whichever chat holds the
logged-in Chrome (the sold-data/Data chat). The Content chat is blocked from the browser to
avoid colliding with the sold capture. Run these, record the directional findings in the
"## FINDINGS" section at the bottom, and the Content chat will use them to prioritize articles.*

## What we need
Directional answers (no precise numbers needed): which bags are searched **most**, which are
**rising vs fading**, and which comparisons have the most interest. **Trends is relative interest
(indexed 0–100), not absolute volume**, so report rankings + trend direction, not exact figures.

## Method
For each URL: navigate, let the "Interest over time" chart render (screenshots can time out on
this heavy page; retry, or read the chart via the DOM/zoom). Read which line sits highest on
average and whether each line is trending up or down over the window. Record a one-line ranking
per set in FINDINGS below. US, the date window is baked into each URL.

## The queries (navigate to each)
1. **Icons head-to-head (12 mo):**
   `https://trends.google.com/trends/explore?date=today%2012-m&geo=US&q=Chanel%20Classic%20Flap,Hermes%20Birkin,Louis%20Vuitton%20Neverfull,Gucci%20Marmont,Hermes%20Kelly`
2. **Birkin vs Kelly (12 mo):**
   `https://trends.google.com/trends/explore?date=today%2012-m&geo=US&q=Hermes%20Birkin,Hermes%20Kelly`
3. **Neverfull vs Speedy (12 mo):**
   `https://trends.google.com/trends/explore?date=today%2012-m&geo=US&q=Louis%20Vuitton%20Neverfull,Louis%20Vuitton%20Speedy`
4. **Entry tier (12 mo):**
   `https://trends.google.com/trends/explore?date=today%2012-m&geo=US&q=Louis%20Vuitton%20Neverfull,Gucci%20Marmont,Louis%20Vuitton%20Speedy,Dior%20Saddle,YSL%20Loulou`
5. **Icons, 5-year (rising vs fading):**
   `https://trends.google.com/trends/explore?date=today%205-y&geo=US&q=Chanel%20Classic%20Flap,Hermes%20Birkin,Louis%20Vuitton%20Neverfull,Gucci%20Marmont,Hermes%20Kelly`
6. **The "next it-bag", 5-year:**
   `https://trends.google.com/trends/explore?date=today%205-y&geo=US&q=The%20Row%20Margaux,Bottega%20Veneta,Loewe%20Puzzle,Polene`
7. **Authentication intent (12 mo):**
   `https://trends.google.com/trends/explore?date=today%2012-m&geo=US&q=how%20to%20authenticate%20Louis%20Vuitton,fake%20Gucci%20Marmont,real%20vs%20fake%20Chanel`

(If a term shows "not enough search volume," note that, it is itself a signal.)

## Why it matters (for the recorder)
The Content chat will use this to decide which comparison/value pieces to write next and which
rising names to cover early. Pure prioritization signal; do not publish Trends index numbers as
facts (relative, not absolute).

## FINDINGS (record here)

*Run 2026-06-26, US, via Trends' own `widgetdata/multiline` API (same-origin, logged-in Chrome) so the
read is the exact indexed series, not an eyeballed chart. Values are **relative interest (0–100 within
each set), not volume** — compare only WITHIN a set. "avg" = mean over the window; arrow = first-third →
last-third average. NB: in the 12-month sets almost everything reads "rising" because the window's last
third (spring 2026) sits above its first third (summer 2025) — a shared seasonal/secular lift — so for
12mo trust the RANKING; the 5-year sets carry the real rising/fading signal.*

- **Set 1 (icons 12mo):** Hermès Kelly (avg 26.2) ≈ Hermès Birkin (25.4) lead → LV Neverfull (18.5) →
  Gucci Marmont (17.2) → **Chanel Classic Flap LOWEST (14.4)**. Surprise: the Flap is the least-searched
  of the five icons, and Kelly noses ahead of Birkin.
- **Set 2 (Birkin vs Kelly 12mo):** **Kelly (56) edges Birkin (54.5)** — basically tied, Kelly slightly
  ahead. (Counter to the usual "Birkin is king" assumption for search demand.)
- **Set 3 (Neverfull vs Speedy 12mo):** **Speedy (27.8) clearly beats Neverfull (17.9).** Speedy is the
  more-searched LV tote/bag right now.
- **Set 4 (entry tier 12mo):** Speedy (27.8) >> Dior Saddle (18.4) ≈ Neverfull (17.9) ≈ Gucci Marmont
  (16.7) >> **YSL Loulou (2.3, flat — "low volume" signal).** Speedy dominates the accessible tier.
- **Set 5 (icons 5y, the real trend):** Birkin (15.8) > Kelly (15) > **Neverfull (11.6, FADING:
  13.2→12.7)** > Marmont (8.5, rising off a low base) > Classic Flap (5.8, lowest but rising). Headline:
  **Hermès is pulling away; Neverfull is the one icon fading over 5y** while Speedy rises (sets 3–4).
- **Set 6 (next it-bag 5y):** Bottega Veneta (35.2 — but that's a *brand* term, so inflated vs the model
  terms) > **Polène (17.8, strong riser 7.2→25.3)** > Loewe Puzzle (3.4, rising) > The Row Margaux (1.4,
  rising off ~0). Real story: **Polène is the breakout accessible-luxury riser.**
- **Set 7 (auth intent 12mo):** **"real vs fake Chanel" (27.8) dominates** >> "how to authenticate Louis
  Vuitton" (10.2, fading) >> "fake Gucci Marmont" (1.5, low). Chanel authentication anxiety is by far the
  largest auth-intent search of the three.
- **Date run:** 2026-06-26
