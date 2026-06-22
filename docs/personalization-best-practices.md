# User Modeling & Journey Personalization — Best Practices for This Stack

*Prepared 2026-06-22. Stack: Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS + Storage) · PostHog (cookieless-first) · Anthropic Claude · Vercel.*

**Method/limitation:** Findings come from a 5-angle web research pass; `WebFetch` was 403-blocked, so web claims are **search-snippet sourced** and rest on cross-source corroboration (confidence tagged). **Anthropic/Claude API facts are from the authoritative `claude-api` skill and override anything from the open web.** Benchmark numbers move release-to-release — re-measure on your own catalog before committing. Legal items are direction-setting, not advice — confirm with counsel.

---

## Reference architecture (one line)

Catalog + closet + signals → **Voyage embeddings** (text + image) in **Supabase pgvector (HNSW)** → **hybrid retrieval (BM25 + vector, RRF) → rerank with taste/business rules** → **Claude** (Haiku for routine copy, Sonnet/Opus for hard reasoning) emitting **schema-constrained, RAG-grounded** output → personalization served from a **precomputed per-user table**, gated by **PostHog flags/experiments**, with **deterministic aggregation feeding the LLM-synthesized taste profile** and **prompt-injection/PII/consent guards** on all user data.

The loop, mapped to what you already have: **Capture** (PostHog events, taste quiz, closet, watchlist) → **Model** (taste vector + persona + intent in a Supabase profile) → **Act** (rank/recommend/tailor copy per journey stage) → **Measure** (PostHog experiments) → refine.

---

## A. Profile + feature store (Supabase / Postgres)

1. **Use `pgvector` with an HNSW index, not IVFFlat** — HNSW builds on a near-empty table and tolerates a growing/changing catalog (IVFFlat needs representative data first and rebuilds as data shifts). `HIGH`
2. **Keep embeddings ≤2000 dims with the `vector` type (use `halfvec` above that).** 1536-dim or smaller (Voyage's 1024 default) stays within the HNSW page limit and indexes cleanly. `HIGH`
3. **Push filters *into* the match RPC, never `.eq()` after `.rpc()`.** PostgREST applies a chained filter *after* ranking + `match_count`, so selective filters (budget band, brand) silently return too few rows. Define `match_items(query_embedding, match_count, filter_band, …)` with the predicate inside the SQL function. `HIGH`
4. **Schema: typed columns for what you rank/filter on (taste vector, `budget_band`, `intent`, `persona` enum), JSONB only for sparse affinities.** Postgres keeps no stats inside JSONB, which degrades the planner for filtered ranking. `MEDIUM`
5. **RLS: `(select auth.uid()) = user_id` (wrapped in a subquery so it runs once, not per-row); index `user_id`; do NOT add a `service_role` policy** — the service role bypasses RLS by design. Derived-feature writes come from a server-side service-role client. `HIGH`
6. **Compute derived features on a schedule with Supabase Cron (pg_cron) → `REFRESH MATERIALIZED VIEW CONCURRENTLY`; invoke Edge Functions via pg_net.** Keep heavy work (taste-vector recompute, decayed scores) on the cron path; let a lightweight trigger upsert simple counters on the events table so the insert path and ranking query stay fast. `HIGH`
7. **For live profile updates prefer Realtime *Broadcast* over Postgres Changes** — Postgres Changes runs an RLS check on every event (the documented scaling bottleneck). Write features server-side, then broadcast to the user's channel. `HIGH`

## B. Recommendation & ranking

8. **Stay content-based-first; keep your item-item co-occurrence; defer collaborative filtering until interaction data is dense.** Pure CF is the most cold-start-vulnerable approach — wrong for your stage. Don't rip out the taste-quiz vector: learned embeddings only beat a good attribute vector once you have behavior to fuse in. `HIGH`
9. **Make hybrid search the default: BM25 (exact: SKUs, brand/model names) + dense vectors (intent/synonymy), fused with Reciprocal Rank Fusion.** ~7% NDCG over either alone on an e-commerce benchmark. `HIGH`
10. **Add a rerank stage over the hybrid candidate set and encode taste/business rules in natural language** ("rank in-season + in-stock higher; prefer the user's saved brands"). Adds ~100–300 ms — skip for tiny result sets. `HIGH` (mechanism) / `MEDIUM` (exact gains)
11. **Cold-start: Bayesian-shrunk popularity prior (shrink toward category averages), not raw counts** — and use an *informative* category prior, since a naive uniform prior over-explores weak items in a low-base-rate luxury catalog. `MEDIUM-HIGH`
12. **Exploration: start with decayed epsilon-greedy (trivial in app code), upgrade to Thompson sampling later.** `HIGH`
13. **Diversity: apply MMR as a cheap post-ranking re-rank (one λ knob)** so one dominant brand/silhouette in a taste vector doesn't collapse the results — counters the filter-bubble that pure relevance creates. `HIGH`
14. **Precompute per-user recs in a nightly/hourly pg_cron job into a table; do only lightweight session-aware re-ranking on-request.** "Everything real-time" explodes cost/complexity for a small app. `HIGH`
15. **Gate releases on offline recall@k, but trust online CTR/conversion A/B as ground truth** — offline↔online correlation is weak for small e-commerce. `MEDIUM-HIGH`

## C. PostHog as the targeting + experiment layer

16. **Evaluate personalization flags server-side in the App Router with `posthog-node` (`flushAt: 1`, `flushInterval: 0`, `await shutdown()`)** — server functions are short-lived and otherwise drop events. `HIGH`
17. **Enable local flag evaluation (cuts ~500ms → ~10–50ms); pass `personProperties`/`groups` explicitly on every server-side `getFeatureFlag`** — server SDKs are stateless and silently skip conditions for properties you don't pass. `HIGH`
18. **Bootstrap client flags from server-evaluated values to kill load-time flicker** (worse under cookieless mode, where flag values aren't cached in storage). `HIGH`
19. **Compute the persona/taste and write it as a PostHog *person property*, then target that — do NOT target behavioral/dynamic cohorts in flags** (they're disallowed as flag targets and lag ≤24h). This is the single most load-bearing PostHog finding and it's exactly what makes flags both locally-evaluable *and* personalization-capable. `HIGH`
20. **Validate every personalization change with an Experiment; cap guardrail metrics at 1–2** (each extra guardrail inflates false-positive risk). `HIGH`
21. **Use a consistent `distinct_id` and call server-side `identify` at login** to stitch anonymous → identified history so a pre-login taste carries forward. `HIGH`
22. **Cookieless tension is real and unavoidable:** opted-out users appear as a new person each day, so durable per-user personalization isn't possible for them. PostHog's reconciliation: count them via server hashing, bootstrap flags, and reserve identity-bound personalization for consented/identified users — fall back to **server-side, session-scoped, or contextual** targeting otherwise. `HIGH`

## D. LLM layer (Claude + embeddings) — *authoritative API facts*

23. **Embeddings: Anthropic ships NO first-party embedding model and officially recommends Voyage AI.** Current general-purpose model is the `voyage-4` family (32K context, Matryoshka dims 256/512/1024/2048). `HIGH`
24. **For a fashion catalog, default to `voyage-multimodal-3.5` so product images and text share one vector space** — aligns with your image-identify feature, no separate text-only pipeline. Always set `input_type` (`"query"` vs `"document"`); omitting it degrades retrieval. `HIGH` (don't pick on MTEB score alone — top models are within ~1 pt; Voyage's edge is domain models + the Anthropic-blessed integration + instruction-tuned rerank.)
25. **Model tiering (your choice; current app uses `claude-sonnet-4-6`):** route routine per-user copy to **`claude-haiku-4-5`** ($1/$5 per MTok), hard reasoning to **`claude-sonnet-4-6`** ($3/$15) or **`claude-opus-4-8`** ($5/$25). Tiered routing commonly cuts blended cost materially vs all-Opus. `HIGH` (mechanics)
26. **Synthesize the taste profile with the LLM only over *pre-aggregated* signals** — do the counting/rollups deterministically in Postgres, then hand Claude a compact summary for the fuzzy "what does this say about their style" step. Feeding raw event streams wastes context (JSON syntax can eat ~half the window) and is slower, costlier, and less auditable. `MEDIUM`
27. **Emit the profile via structured outputs (`output_config.format` + JSON schema), not a "respond in JSON" prompt.** On Sonnet/Opus 4.6+ this is the supported replacement for the now-rejected assistant-prefill trick; negligible cost, big reliability gain. `HIGH`
28. **Ground all personalized copy/recs in retrieved catalog records (RAG) and constrain generation to retrieved facts — this is how you operationalize "never invent authentication facts."** RAG reduces hallucination but is not zero; for any factual/auth claim, back it with a deterministic lookup/check, not just a system-prompt instruction. `HIGH`
29. **Cost control: prompt caching + Batches.** Cache the stable prefix (catalog system prompt, profile schema, tool defs) — cache reads ≈0.1× input; keep volatile per-request data after the last cache breakpoint. Run nightly profile rebuilds / catalog enrichment through the **Batches API (50% off)**. `HIGH`
30. **Treat every user-derived input (searches, closet, notes, retrieved metadata) as untrusted — defend against prompt injection (OWASP LLM01).** Delimit untrusted content; keep operator instructions in a non-spoofable channel (Opus 4.8 supports mid-conversation `role:"system"` messages — safer than embedding operator text in a user turn); redact PII before it reaches the model; require tool/human gating for sensitive or irreversible actions. Injected content must never be able to flip an authentication decision (reinforces #28). `HIGH`

## E. Privacy, consent & ethics (you're a US LLC, cookieless-first, trust brand)

31. **Make in-session, first-party personalization the default engine; reserve consent-gating for cross-context/cross-device profiling.** Going cookieless-first *shrinks* your consent surface — a strength. `HIGH`
32. **NEVER deploy personalized/surveillance pricing.** FTC's Jan-2025 study flagged it; NY's Algorithmic Pricing Disclosure Act is in effect; CA AB 2564 proposed penalties up to $12,500/violation. Personalize *content and recommendations*, never *price*. `HIGH`
33. **Ship "Why am I seeing this?" + steerable controls** (toggle interests, exclude categories, reset/diversify, view/edit your taste profile). For luxury this is a trust feature, not just compliance — and it doubles as your GDPR access/edit surface. `MEDIUM`
34. **Separate marketing notifications (opt-in) from transactional (lower bar); never smuggle promos into transactional messages.** US TCPA makes marketing SMS opt-in ($500–$1,500/violation); adding a discount reclassifies a transactional message as marketing. Ties directly to your price-alert/notification feature. `HIGH`
35. **Avoid FTC/EDPB dark patterns** — no fake scarcity ("only 1 left" when untrue), no asymmetric consent buttons, no nagging. Enforcement is escalating. `HIGH`
36. **Ordinary product recommendations generally sit outside GDPR Art. 22 and California's ADMT "significant decisions" (advertising is excluded there) — but document why, keep a human in the loop for anything with significant effect, and honor access/opt-out.** `MEDIUM-HIGH`
37. **Lead with privacy-as-luxury: infer taste from *declared history and stated taste*, not invasive scanning; make access/edit/delete frictionless; collect the minimum.** HNW customers value discretion; over-personalization reads as surveillance. `MEDIUM`

---

## Phased rollout (lowest-risk first, building on what exists)

1. **Profile store + deterministic aggregation** — a `user_profile` table (typed cols + JSONB), pg_cron rollups from PostHog/closet/quiz signals into a taste vector + persona + budget band. *(A4–A7, B8)*
2. **Server-side personalization, gated** — precompute recs into a table; rank with hybrid + MMR; gate via PostHog flags targeting the persona *person property*; wrap in an experiment. *(A14, B9–B15, C16–C20)*
3. **Embeddings + semantic layer** — Voyage `voyage-multimodal-3.5` into pgvector HNSW; hybrid + rerank with taste/business instructions. *(A1–A3, D23–D25)*
4. **LLM taste synthesis + personalized copy** — Claude over pre-aggregated signals, structured output, RAG-grounded, tiered models + caching/batch, injection/PII guards. *(D26–D30)*
5. **Trust surface** — "Why am I seeing this?", taste controls, consent separation for notifications, privacy-as-luxury polish. *(E31–E37)*

## Verify before relying
- All web claims are snippet-sourced (WebFetch blocked); benchmark/cost figures move — re-measure on your catalog. Confirm your Supabase project's `pgvector` version (≥0.8.0 enables iterative index scans for filtered queries). Pull Voyage's live pricing. For load-bearing legal items (pricing laws, TCPA, ADMT scope, EDPB dark-pattern guidance) read the primary sources / consult counsel before implementation.
