# Desktop To-Do — everything that needs a real browser, a dashboard, or a human

*Created 2026-06-20. Consolidates every operator action that **cannot be done from a
cloud Claude session** (no credentials, no dashboard access, outward-facing, or a
business decision). Pulled from `handoff.md`, `additive-features-port.md`,
`product-brief.md`, and `marketing-plan.md`. Work top-down: Section A unblocks the
live product; nothing DB-backed works until A1–A3 are done.*

Legend: ⛔ blocking · 🔧 infra · 📣 growth · ⚖️ legal/biz · 🧠 decision

---

## A. Go-live blockers (do these first — in order)

- [ ] ⛔🔧 **A1. Apply Supabase migrations** (SQL editor / CLI), in order:
  `0002_user_features` → `0003_reviews_notifications` → `0004_resources_creators` →
  `0005_closet_status_want_have_had` → `0006_social_expert_layer`. *(0001 already
  applied.)* `0005` is data-migrating (collapses researching/wishlist→want, owned→have).
- [ ] ⛔🔧 **A2. Create `.env.local`** with `NEXT_PUBLIC_SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY`, then run the seeders (both idempotent):
  `npx tsx supabase/seed/seed-hero-styles.ts` and `npx tsx supabase/seed/seed-breadth.ts`.
  *(Live DB still has old seed data until this runs.)*
- [ ] ⛔🔧 **A3. Set Vercel env vars** (Project → Settings → Environment Variables):
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
  (→ luxurycatalog.com once DNS is live), `NEXT_PUBLIC_AUTHOR_NAME` (your real name —
  strengthens E-E-A-T), `CRON_SECRET`. See `.env.example` for the full list.
- [ ] ⛔🔧 **A4. Supabase email-confirm template** → point at
  `/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}` (Auth → Email
  Templates), or disable confirmation while testing.
- [ ] ⛔ **A5. Smoke-test the full path on the live DB**: sign up → onboarding →
  save to closet → watchlist → review → trigger a price alert. This is the one thing
  the cloud sessions could never verify.

---

## B. DNS go-live (`luxurycatalog.com`, registered at Squarespace, points nowhere)

- [ ] 🔧 **B1. Vercel** → Project → Domains → add `luxurycatalog.com` + `www`; note the
  A record IP + CNAME target Vercel shows.
- [ ] 🔧 **B2. Squarespace** (domains.squarespace.com → DNS): delete existing `@` A and
  `www` CNAME; add A `@` → the IP Vercel shows (was `76.76.21.21` — **verify against
  Vercel**) and CNAME `www` → `cname.vercel-dns.com.`
- [ ] 🔧 **B3.** Wait 15–60 min for **"Valid Configuration"** in Vercel.
- [ ] 🔧 **B4. Email forwarding** — test `hello@luxurycatalog.com`; re-add MX
  `fwd1.squarespace.com.` (10) / `fwd2.squarespace.com.` (20) if they were wiped.
- [ ] 🔧 **B5.** After DNS is live, update `NEXT_PUBLIC_SITE_URL` (A3) to the real domain.

---

## C. Analytics, alerts & integrations

- [ ] 🔧 **C1. PostHog** — set `NEXT_PUBLIC_POSTHOG_KEY` (+ optional `POSTHOG_KEY`);
  enable **"Cookieless server hash mode"**; optionally run `node scripts/setup-posthog.mjs`.
- [ ] 🔧 **C2.** Add `.mcp.json` manually for the PostHog MCP (snippet in `handoff.md` /
  `.env.example`). Set `POSTHOG_PERSONAL_API_KEY`.
- [ ] 🔧 **C3. Price alerts** — confirm `CRON_SECRET` is set (Vercel injects it as the
  cron Authorization header); `vercel.json` already schedules the daily job.
- [ ] 🔧 **C4. Email delivery (Resend)** — sign up, **verify a sender domain**, set
  `RESEND_API_KEY`. Without it, alerts are in-app only.

---

## D. SEO / GEO (the #1 marketing channel — see `marketing-plan.md`)

- [ ] 📣 **D1.** After deploy, **submit `/sitemap.xml`** to **Google Search Console**
  *and* **Bing Webmaster Tools** (Bing powers ChatGPT search). Verify domain ownership in each.
- [ ] 📣 **D2. Curate video resources** — add `creator` rows (vetted reviewers) +
  `resource` rows (their best videos linked to styles) via admin/seed, to light up the
  bag-page "Video reviews" sections.

---

## E. Monetization setup (outward-facing / business)

- [ ] ⚖️📣 **E1. Affiliate program applications** — sign up for **Fashionphile,
  TheRealReal, Vestiaire** (and any others). Some require traffic/leverage first, so
  start the applications now. Then set `NEXT_PUBLIC_AFFILIATE_*` codes /
  `NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE` (A3).
- [ ] ⚖️ **E2. Authenticator outreach** — begin recruiting professional authenticators
  (the Marketplace, Rev #2). The contributor ladder + `is_authenticator` profiles feed
  this; even pre-build, line up 3–5 willing pros.

---

## F. Data depth & integrity

- [ ] 🔧 **F1. Brand depth** — drop the full Google Drive reseller CSV export into
  `data/raw/` and re-run the seeder to auto-fill the 9 stub brands.
- [ ] ⚖️ **F2. Re-verify hero-research accuracy** — Session-2 snippet-sourced data was
  capped at `medium` confidence (WebFetch was blocked). Re-verify **Hermès blind-stamp**
  and **Chanel serials** especially before presenting as fact (never-invent rule).

---

## G. Legal / compliance (founder + counsel)

- [ ] ⚖️ **G1. Image rights / fair-use review** — the photo-contribution path needs a
  **UGC license at upload + ownership attestation + a registered DMCA agent**. See
  `image-strategy-research.md`. (AI-render path already ruled out.)
- [ ] ⚖️ **G2. Trademark / brand usage** review for using brand + style names at scale.
- [ ] ⚖️ **G3.** Confirm `luxurycatalog.com` auto-renew (~Aug 9 annually) and LLC standing.

---

## H. Decisions needed from you (unblock the next build sessions)

- [ ] 🧠 **H1. Social UI scope** — confirm the build order in
  `engagement-strategy.md` §3 (social profiles → activity feed → taste quiz → recs).
- [ ] 🧠 **H2. Taste quiz vs. photo-contributions** — which engagement feature do you
  want built **first**? Both are spec'd; they're independent.
- [ ] 🧠 **H3. Admin auth gate** — `/admin/*` is currently **unauthenticated**. Approve
  gating it behind `profile.is_admin` (code task) before any sensitive data lands.
- [ ] 🧠 **H4. Social links policy** — confirm the allowed networks (IG / TikTok /
  YouTube / Poshmark / Substack) and the verified-link treatment from
  `engagement-strategy.md` §1f.

---

## Quick reference — accounts

| Service | For | Where |
|---|---|---|
| Supabase | DB (`pewmdztviyrtbhtebcct`) | supabase.com |
| Vercel | Hosting (team `darkseerbruh`) | vercel.com |
| Anthropic | Camera tool + NL search + analytics digest | console.anthropic.com |
| PostHog | Analytics | posthog.com |
| Squarespace Domains | `luxurycatalog.com` DNS | domains.squarespace.com |
| Resend | Alert email delivery | resend.com |
</content>
