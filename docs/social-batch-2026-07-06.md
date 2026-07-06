# Social batch 1 — staged for approval (2026-07-06)

*From `docs/tiktok-swipe-file.md` (§7 hooks, §8 payoffs, §1 sounds), taste rules
applied. Nothing published or scheduled. Approve / tweak / cut each, then wire live
URLs + UTMs (`utm_campaign=2026-07-swipe-batch-1`) before posting.*

| # | Format | Content type | Sound | Metric |
|---|---|---|---|---|
| 1 | Netflix documentary | Faceless slideshow / b-roll | trending-pick | comments + follows |
| 2 | Here's exactly what I'd do | Faceless slideshow (step/card) | "How my brain sounds…" bed | saves + tool clicks |
| 3 | I wish someone had told me | Slideshow / b-roll + text | original/trending | saves + follows |
| 4 | Value reframe (Fendi) | Faceless slideshow (2 prices) | original/trending | tool clicks + saves |
| 5 | Product-led (site) | Mobile walkthrough (fallback slideshow) | original/trending | tool clicks + follows |
| 6 | Affirmation | B-roll + text (warm) | soft/aspirational | shares + saves |
| 7 | Confessional | B-roll + text / slideshow | original/trending | comments + follows |
| 8 | Collector hot-take | Faceless slideshow (1 hill/card) | original/trending | comments + saves |

---

**1. Netflix documentary**
- Hook: *A Netflix documentary on holding my bag the whole flight because I don't trust the overhead bin.*
- Payoff: *It did not go under the seat in front of me either. It had my full attention for four hours. Tag someone who'd do the same.*
- Link: reach post → home or /data hub. No number.

**2. Here's exactly what I would do if I were…**
- Hook: *Here's exactly what I would do if I were buying my first big girl bag.*
- Payoff: *1. Pick the shape you'll actually carry, not the one that's trending. 2. Check what it sells for preloved before you pay retail. 3. Learn two or three authentication markers for that exact style. 4. Buy from a seller with real, in-hand photos and a return window. 5. Budget a little extra for a liner and dust bag.*
- Link: authentication-markers article or taste quiz. Verify page live.

**3. I wish someone had told me this before…**
- Hook: *I wish someone had told me this before I tried to play the Hermès game.*
- Payoff: *You do not have to play it. The bag you actually want is often on the resale market right now, no relationship-building required.*
- Link: resale/where-to-buy or Hermès-on-resale article. Flag: confirm live page.

**4. Value / resale reframe (Fendi — real figures)**
- Hook: *Friendly reminder, you can buy that Fendi on Emily in Paris three times over if you get it used vs new.*
- Payoff: *That Baguette from Emily in Paris? New, the medium runs about $3,900. A classic Zucca Baguette on the resale market right now? Around $1,000 to $1,300. That's your bag three times over.*
- Numbers (July 2026): Fendi Mamma Baguette Medium $3,900 (fendi.com); preloved Zucca/Zucchino Baguettes $995–$1,645 across 145 live listings (fashionphile.com). **Refresh the resale range the day before posting.**
- Link: Fendi Baguette bag page or /data resale-range view.

**5. Product-led ("I used to… now Luxury Catalog")**
- Hook: *I used to watch every review video on YouTube to find out whether a medium-sized bag would fit my MacBook. Now I just look on Luxury Catalog.*
- Payoff: *The measurements and what actually fits inside are right on the bag's page. No more 47 review videos.*
- Link: a specific bag page with dimensions/fit data. Flag: verify page live + data populated (payoff over-promises otherwise).

**6. Affirmation / you deserve**
- Hook: *You deserve beautiful things in your life just because you love them.*
- Payoff: *Not because you earned it, not because it's on sale. Because you love it. Send this to someone who needs to hear it.*
- Link: keep-warm CTA is FOLLOW; link to home. No number.

**7. Confessional**
- Hook: *I'm not afraid to admit I wasted thousands on designer bags. And I'll do it again because I'm a junkie.*
- Payoff: *No notes. No shame. Comment your latest 'oops' purchase, I'll go first.*
- Link: reach post → home or /data hub. No number.

**8. Collector hot-take**
- Hook: *Hills I will die on: purses never go on the ground, you don't need to condition the leather as often as they say, and bag liners should come included.*
- Payoff: *Purses off the ground (bacteria and scuffs are real), over-conditioning dries leather out, and yes, a liner should just come in the box at these prices.*
- Link: care/authentication article if live, else home. No number.

---

## Post-ready package (rendered videos + caption + sound)

Renders live at `tools/video-pipeline/output/<name>.mp4` (text-card reels, silent by
design). For each: pick a current trending audio in-app; the on-screen hook stays as
filmed. Captions are on-voice (no em dashes). Swap the placeholder tags for whatever
is trending the day you post.

**1. aff-deserve** — metric: shares + saves → follows
> In case you needed the reminder today: you don't have to earn the bag, and it
> doesn't have to be on sale. Loving it is reason enough. Save this for the next time
> you talk yourself out of something beautiful. Follow for the facts behind every bag.
> #luxurybags #designerbags #handbagcollector #treatyourself #luxurycatalog
Sound: soft, aspirational trending audio.

**2. value-fendi** — metric: tool clicks + saves
> That Baguette from Emily in Paris? New, the medium runs about $3,900. A classic
> Zucca Baguette on the resale market right now sits around $1,000 to $1,300. Same
> bag, three times over. This is why I check the resale range before I ever pay retail.
> #fendi #fendibaguette #emilyinparis #preloved #luxuryresale #luxurycatalog
Sound: trending audio pick. **Refresh both figures the day you post (live inventory).**

**3. doc-flight** — metric: comments + follows
> It did not go under the seat in front of me either. Four hours, full attention, zero
> regrets. Tag someone who would do the exact same thing.
> #handbagcollector #designerbags #luxurybags #relatable #luxurycatalog
Sound: a comedic/relatable trending audio.

**4. first-bag** — metric: saves + tool clicks (tips = the "more in caption")
> Here's exactly what I'd do buying my first big girl bag: 1) Pick the shape you'll
> actually carry, not the one that's trending. 2) Check what it sells for preloved
> before you pay retail. 3) Learn two or three authentication markers for that exact
> style. 4) Buy from a seller with real, in-hand photos and a return window. 5) Budget
> a little extra for a liner and dust bag. Save this for when you're ready.
> #firstluxurybag #designerbags #howtobuyluxury #authentication #luxurycatalog
Sound: trending audio pick.

**5. hermes-game** — metric: saves + follows (tips = the "more in caption")
> I wish someone had told me this before I tried to play the Hermès game: you don't
> have to play it. The bag you actually want is often on the resale market right now,
> no years-long relationship or spending quota required. Check the resale market
> first, then decide.
> #hermes #hermesbirkin #hermeskelly #luxuryresale #preloved #luxurycatalog
Sound: trending audio pick.

**6. macbook-fit** — metric: tool clicks + follows
> The measurements and what actually fits inside are right on the bag's page. No more
> 47 review videos to find out if your laptop fits. Follow for the facts behind every
> bag.
> #luxurybags #designerbags #whatfitsinmybag #baginsides #luxurycatalog
Sound: trending audio pick.

**7. junkie** — metric: comments + follows
> No notes. No shame. I check resale prices for fun on bags I already own. Comment your
> latest oops purchase and I'll go first.
> #handbagcollector #designerbags #luxurybags #shopaholic #luxurycatalog
Sound: trending audio pick.

**8. hills** — metric: comments + saves
> Hills I will die on as a handbag collector: purses never go on the ground (bacteria
> and scuffs are real), you don't have to condition the leather as often as they say
> (over-conditioning dries it out), and a bag liner should just come in the box at
> these prices. What's yours?
> #handbagcollector #baghacks #luxurybags #designerbags #luxurycatalog
Sound: trending audio pick.

*Outward-facing steps that stay with her: pick + add the trending sound in-app, wire
any link + UTM (`utm_campaign=2026-07-swipe-batch-1`), and publish. Metricool staging
needs her to reconnect the connector first.*

## Before anything posts
- **Numbers:** only #4 carries figures (real, sourced, July 2026); refresh resale range day-of. No other draft is blocked on data.
- **Live-page checks:** #2, #3, #5, #8 promise a destination; confirm each is live/populated or route to the closest live page. #1, #6, #7 route to home/data hub and are safe.
- **UTMs:** tag every link per `docs/utm-conventions.md` (`utm_source=tiktok`, `utm_medium=organic-social`, `utm_campaign=2026-07-swipe-batch-1`). None wired yet.
- **Mix:** 5 slideshow, 2 b-roll+text, 1 mobile walkthrough. No face, no owned-bag footage, no logos illustrated.
