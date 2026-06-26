# Evidence: caviar vs lambskin resale premium (Chanel Medium Classic Flap)

*Run 2026-06-25. The verified statistical basis for the Caviar vs Lambskin article (#2).
Method follows `docs/data-analysis-standard.md`.*

## Question
Does caviar leather command a higher resale price than lambskin for the Chanel Medium
Classic Flap (variant 199), and is it real or a confounder?

## Method
- Prices are right-skewed, so **Mann-Whitney U** (rank-sum) for the difference and a
  **bootstrap 95% CI** for the median difference. No normality assumed.
- **Stratified by source** to rule out platform mix. Two metrics: asking (TheRealReal,
  Fashionphile) and **sold** (eBay, Poshmark completed listings).
- eBay/Poshmark filtered to genuine Medium Classic Flaps: title must say flap + classic/
  double + medium, price $1,500-$60,000, excluding Chanel 19 / Boy / Reissue / 2.55 /
  accessories. Leather type parsed from the title.

## Results (all caviar > lambskin)
| Source | Price type | Caviar med (n) | Lambskin med (n) | Diff (95% CI) | Mann-Whitney p |
|---|---|---|---|---|---|
| TheRealReal | asking | $7,063 (26) | $4,821 (33) | $2,241 [1063, 2938] | 0.0002 |
| Fashionphile | asking | $8,550 (17) | $6,843 (10) | $1,708 [288, 3578] | 0.024 |
| eBay | sold | $5,500 (20) | $4,225 (30) | $1,275 [712, 2112] | 0.010 |
| Poshmark | sold | $9,600 (5) | $3,500 (8) | $6,100 [300, 10735] | 0.019 (small n) |
| All sold pooled | sold | $5,500 (25) | $3,946 (38) | $1,555 [1058, 2251] | 0.0006 |

Platform price levels differ (Fashionphile > TheRealReal > eBay), and caviar was more
Fashionphile-weighted, so the *pooled-across-everything* gap overstated it. Within each
source separately the premium still holds, which is the point.

## Conclusion
The caviar premium is **robust**: significant within four independent marketplaces, in
asking and in real sold prices. Magnitude is roughly **$1,275 (eBay sold) to $2,240 (TRR
asking)** at the median, i.e. caviar asks/sells ~25-45% higher depending on venue.

## Honest limits (state in the article)
- **Condition: 0% recorded** on any source. The one confounder we cannot control. If
  caviar bags skew better-kept, part of the gap is condition.
- **Authenticity:** all four sources authenticate at these price points. TheRealReal and
  Fashionphile authenticate everything; **eBay** makes authentication mandatory on handbags
  sold at $500+ (Authenticity Guarantee, independent inspector before the buyer receives it),
  and **Poshmark** auto-authenticates every item sold at $500+ (Posh Authenticate). Our
  eBay/Poshmark sold set was filtered to $1,500+, so every one of those completed sales passed
  third-party authentication. Residual mislabel risk (wrong leather/size in the title) remains,
  but outright-fake risk is low. (Corrected 2026-06-26; an earlier draft wrongly called
  eBay/Poshmark non-authenticating.)
- **Asking vs sold:** TRR/FP are asking; eBay/Poshmark are sold. We report them separately.
- **Snapshot:** point-in-time, June 2026.
- **Age:** lambskin listings skew older; the premium held age-for-age earlier, but per-era n
  is small.
