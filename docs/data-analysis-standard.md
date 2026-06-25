# Data Analysis Standard — the rigor bar for any value or price claim

*Created 2026-06-25. We write data-backed articles, so a number or comparison we publish
must clear a senior-analyst bar, not an eyeballed-median bar. This is binding for any
article, bag-page module, or social post that makes a quantitative claim. Pairs with the
factuality protocol in `docs/preferences.md` and the visualization rule in
`docs/content-strategy.md`.*

## 0. The one rule
**A raw median gap is not a finding.** Before we claim a difference is real or caused by a
factor, we test it, bound it, and try to break it with the obvious confounders. If it does
not survive, we do not claim it, or we frame it as a leaning and say why.

## 1. Use the right test for the data
- Resale prices are **right-skewed, not normal**, so use **non-parametric** methods:
  - **Mann-Whitney U / Wilcoxon rank-sum** to test whether one group tends to be priced
    higher than another. Robust to outliers and skew.
  - **Bootstrap (resample with replacement)** for confidence intervals on a median or a
    median difference. No normality assumption.
- Report, every time: **n per group, the median and IQR, the median difference, its 95%
  bootstrap CI, and the test p-value.** A CI that crosses zero means no claim.
- Method sources: Mann-Whitney guidance (Statistics By Jim, r-statistics.co) and the
  bootstrap-for-non-normal-comparison literature (Johnston 2021, New Phytologist).

## 2. Control for confounders by stratifying
- A pooled difference can be created by a confounder. Re-run the test **within strata** of
  the obvious confounders (platform, production era, color) and see if it survives.
- If it survives within strata, it is robust (example: caviar > lambskin held within
  TheRealReal alone, p=0.0002, and within Fashionphile alone, p=0.024, so it was not just
  platform mix). If it only appears pooled, it is likely confounded.
- **Name the confounders we could not control.** If condition is unrecorded (it usually is),
  say so plainly: we cannot rule it out.

## 3. Respect the sample frame (no overreach)
- **Scope the claim to where the data came from.** Our prices are premium US resale
  (Fashionphile, TheRealReal, some Vestiaire). That supports "asking prices on premium
  resale," not "what bags sell for" or "the global market."
- **Asking is not sold.** Always "listing for," never "sells for." No resale time-series
  claims (we have snapshots, not a sold-price history).
- **A sweeping claim needs replication across sources**, not one platform. One platform is a
  hypothesis; agreement across platforms is evidence.

## 4. The publish bar
Publish a comparative or causal price claim only if ALL hold:
- [ ] Significant (p < 0.05) by the right non-parametric test, with n and the test reported.
- [ ] A 95% bootstrap CI on the effect that excludes zero, reported in the article.
- [ ] Survives stratification by the obvious confounders (or is framed as pooled-only).
- [ ] Unmeasured confounders (e.g. condition) stated plainly.
- [ ] Scoped to the sample frame; framed as estimate/leaning, never a verdict (preferences §8).
- [ ] The numbers are shown, not just told (a visualization, per content-strategy).

If a claim is borderline (wide CI, small n, one source), it ships as an explicit leaning
with its limits, or it does not ship.

## 5. Show the work to the reader, in plain language
The article states the method in plain words: how many listings, from where, and what we
could not control for. Transparency is the credibility.

**Readers are not researchers.** Translate the statistics into intuition, do not dump them.
"The gap held across four marketplaces and in actual sold prices, so it is unlikely to be
chance" lands; "Mann-Whitney p=0.0006" does not, on its own. Lead with what it means, then
offer the number for those who want it. Sound smart and trustworthy, never condescending.
The rigor lives under the hood; the surface is a knowledgeable friend explaining what the
data shows.
