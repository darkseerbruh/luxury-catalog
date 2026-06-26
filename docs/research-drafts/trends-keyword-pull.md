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
- Set 1 (icons 12mo): _ranking highest→lowest + any riser_ …
- Set 2 (Birkin vs Kelly): …
- Set 3 (Neverfull vs Speedy): …
- Set 4 (entry tier): …
- Set 5 (icons 5y, rising/fading): …
- Set 6 (next it-bag 5y): …
- Set 7 (auth intent): …
- Date run: …
