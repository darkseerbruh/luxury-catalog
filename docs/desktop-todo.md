# Desktop To-Do — everything that needs a real browser, a dashboard, or a human

*Created 2026-06-20. Consolidates every operator action that **cannot be done from a
cloud Claude session** (no credentials, no dashboard access, outward-facing, or a
business decision). Work top-down. Updated live during the 2026-06-20 working session.*

Legend: ⛔ blocking · 🔧 infra · 📣 growth · ⚖️ legal/biz · 🧠 decision

> **⚠️ Security note (2026-06-20):** the Supabase **`service_role` key** and DB
> password were pasted into a chat transcript during setup. **Rotate them** before
> launch — see item **A6**.

---

## ✅ Done in the 2026-06-20 session
- **Migrations 0002–0007 applied** to Supabase (via `supabase db push` on laptop; `0001` repaired-as-applied). Includes the new `0007_taste_and_social_links`.
- **Catalog seeded** — `seed-hero-styles` (7 styles) + `seed-breadth` (120+56 styles / 218+ variants). `.env.local` created locally.
- **Vercel env vars set** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (=`https://luxury-catalog-omega.vercel.app` for now), `NEXT_PUBLIC_AUTHOR_NAME`, `CRON_SECRET`. *(All saved "Sensitive" — cosmetic only; can't read back in dashboard.)*
- **DNS configured** — domain moved off uniregistry parking to **Squarespace nameservers**; custom records added: `A @ → 216.198.79.1`, `CNAME www → da85d5fe69f1eefe.vercel-dns-017.com`. Vercel canonical = **www**. *Propagating; waiting on "Valid Configuration."*
- **Auth configured** — Site URL + redirect URLs set; **email confirmation disabled** for now (free tier can't edit templates; re-enable with Resend before launch).
- **App runs locally** against the live seeded DB on the feature branch.
- **Georgia LLC filing submitted** (`Luxury Catalog, LLC`, NAICS 519130). Awaiting approval.

---

## A. Go-live blockers

- [x] ⛔🔧 **A1. Apply Supabase migrations 0002–0007.** Done via `db push`.
- [x] ⛔🔧 **A2. Seed the catalog.** Done.
- [x] ⛔🔧 **A3. Set Vercel env vars.** Done (six vars above).
- [x] ⛔🔧 **A4. Auth URLs + confirmation.** Site/redirect URLs set; confirm-email disabled (interim).
- [ ] ⛔ **A5. Smoke-test the full path** on the live DB: sign up → onboarding → save to closet → watchlist → review → quiz → recommendations → notifications. *(Partly testable locally now; finish after the branch is deployed.)*
- [ ] 🔧 **A6. Rotate exposed secrets — DEFERRED to before full launch** (owner, 2026-06-22). The old Supabase `service_role` key + DB password were pasted in a transcript. **Plan worked out (do this before going truly public):** the project now has Supabase's **new key system** (Publishable + Secret keys) alongside the legacy `anon`/`service_role`. Migrate off the leaked legacy key:
  1. Supabase → Settings → API → **Secret keys** → create **Key A** (`app-server`). Copy the **Publishable key** too.
  2. In **Vercel** env vars (keep names, swap values): `SUPABASE_SERVICE_ROLE_KEY` → Key A; `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Publishable key. **Redeploy.**
  3. **Verify the live site works** (log in, browse) on the new keys.
  4. Then **reset the DB password** (Settings → Database) and **disable the legacy keys** — this kills the leaked one.
  5. Update local `.env.local` with the new values so the CLI/dev still work.
  - **Pairs with cloud access (I1/I2):** create a SEPARATE secret key **Key B** (`cloud-agent`) for the cloud workspace, so a future leak there is revocable without touching the live site. **⚠️ Do NOT paste key values into chat** — they go straight into Vercel / the cloud env config.
- [x] ⛔🔧 **A7. Merge feature branch → `main`.** Done (2026-06-20, `--no-ff` merge; `tsc`/eslint/`next build`/50 tests green pre-merge). Vercel auto-deploys `main` to production. **Verify the deploy succeeds** in Vercel, then run A5 against it. Migrations `0008`–`0010` still need `supabase db push` for the new features (admin gate, corrections, settings) to work.

---

## B. DNS go-live (`luxurycatalog.com`)

- [x] 🔧 **B1. Added domain in Vercel** (`luxurycatalog.com` + `www`, apex→www redirect).
- [x] 🔧 **B2. Squarespace DNS** — switched to Squarespace nameservers; added `A @ → 216.198.79.1` and `CNAME www → da85d5fe69f1eefe.vercel-dns-017.com`.
- [x] 🔧 **B3. DNS validated** (2026-06-22) — Vercel shows "Valid Configuration"; `luxurycatalog.com` loads over HTTPS.
- [ ] 🔧 **B4. Email forwarding (optional)** — set up `hello@luxurycatalog.com` (MX records) if/when you want branded email. Not needed for the site to work.
- [x] 🔧 **B5. `NEXT_PUBLIC_SITE_URL` set to `https://www.luxurycatalog.com`** + redeployed (2026-06-22).

---

## C. Analytics, alerts & integrations

- [x] 🔧 **C1. PostHog live** (2026-06-22) — `NEXT_PUBLIC_POSTHOG_KEY` set (US region), redeployed, events verified flowing in incognito. *(Note: events are blocked by ad-blockers in your everyday browser — test in incognito + the PostHog "Live" tab.)*
- [ ] 🔧 **C2.** Add `.mcp.json` for the PostHog MCP (snippet in `handoff.md`/`.env.example`); set `POSTHOG_PERSONAL_API_KEY`.
- [ ] 🔧 **C3. Price alerts** — `CRON_SECRET` is set ✅; `vercel.json` already schedules the daily job. Verify it runs after deploy.
- [ ] 🔧 **C4. Email delivery (Resend)** — sign up, **verify a sender domain**, set `RESEND_API_KEY`. Unlocks alert emails **and** Supabase email-template editing (so you can re-enable verified signup — A4).

---

## D. SEO / GEO (the #1 marketing channel)

- [x] 📣 **D1. Sitemap submitted to Google + Bing** (2026-06-22) — GSC Domain property (DNS TXT verified) + `https://www.luxurycatalog.com/sitemap.xml` submitted; Bing imported from GSC + sitemap submitted. Indexing is the slow part (~8–16 wks) — check GSC→Pages / Bing→Site Explorer in a couple weeks.
- [x] 📣 **D2. Curate video resources** — BUILT: `supabase/seed/research/creators.json` (real channels + real video IDs verified from web search) + `supabase/seed/seed-creators.ts` (idempotent). **Operator action:** run `npx tsx supabase/seed/seed-creators.ts` (needs service-role key; 0004 applied + hero styles seeded first) to populate the bag-page "Video reviews."

---

## E. Monetization setup

- [ ] ⚖️📣 **E1. Affiliate applications** *(in progress — direct-first)* — decided to skip aggregators and go direct (higher rates, esp. the consignor lever). **Status (2026-06-22):**
  - ✅ **The RealReal — Real Partners** (consignor referral, the ~$1,250 lever): applied; **they'll email to schedule an onboarding call — TAKE IT.**
  - ✅ **The RealReal — affiliate** (buyer side): applied via **Impact**, in review.
  - ✅ **Awin** (the network Vestiaire **and** Fashionphile are both on — ShareASale merged into Awin & closed late 2025): applied, in review. **⚠️ Next: once Awin approves, log in → Advertisers → search "Vestiaire Collective" AND "Fashionphile" → Join each** (network ≠ brand; both brands live in this one account now).
  - ⬜ ~~**Fashionphile — affiliate** via ShareASale~~ → **now reached through Awin** (above). Fallback if not in Awin's directory: Fashionphile's Impact "Partners/Influencer" program. NOT the "Partners Program" reseller form (needs a resale certificate — wrong door).
  - Apply as sole prop (SSN) now; switch payee to the LLC + EIN later. **When codes/tracking-links arrive → send them to Claude to wire into `NEXT_PUBLIC_AFFILIATE_THEREALREAL` / `_VESTIAIRE` / `_FASHIONPHILE` (and the consignor referral may need a small custom touch in `WhereToSell`).**
- [ ] ⚖️ **E2. Authenticator outreach** — line up 3–5 pro authenticators for the Marketplace (Rev #2). **The v1 on-ramp is now built** (lead capture, money-free): apply migration `0017`, then grant each pro `is_authenticator` (`update profile set is_authenticator = true where id = '<their-id>';` — same flag that auto-publishes their photos). They'll then see the claim queue at **/authenticate**. Requests come in from the bag-page "Want a pro to check it?" CTA. Pricing/payment is arranged off-platform in v1 (on-platform payments = Phase C, attorney-gated — don't enable yet).

---

## F. Data depth & integrity

- [ ] 🔧 **F1. Brand depth** — drop the full Google Drive reseller CSV into `data/raw/` and re-run the seeder to fill the 9 stub brands.
- [x] ⚖️ **F2. Re-verify hero-research accuracy** — DONE (2026-06): re-verified the **Hermès blind-stamp four-era shape system** (no-shape 1945-1970 / circle 1971-1996 / square 1997-2014 / no-shape 2015-present + 2016 interior relocation) and **Chanel serial era system** (6-digit from 1984 / 7-digit from 1986 / 8-digit 2005-2021, 31 last on handbags / April-2021 microchip) across multiple independent guides. System-level facts raised medium→high with cited sources; fine-grained per-year letter/series tables left unasserted (never-invent). **Operator action:** re-run `seed-hero-styles.ts` to apply the corrected JSON.

---

## G. Legal / compliance

- [ ] ⚖️ **G1. Entity cleanup (Utah → Georgia)** *(in progress)*:
  - [x] Filed **Georgia domestic LLC** (`Luxury Catalog, LLC`).
  - [ ] **Check Utah LLC status** (businessregistration.utah.gov); if Active/Delinquent, file dissolution. If already admin-dissolved, no action.
  - [ ] **Get a new EIN** (free, instant — irs.gov → EIN Assistant) once the GA Certificate of Organization is issued.
  - [ ] **Open a business bank account** (EIN + Articles + operating agreement).
  - [ ] **Set an April-1 reminder** for the GA Annual Registration (~$50/yr).
  - [ ] Update affiliate/payment **W-9 / payee** info to the new LLC + EIN.
  - [ ] *(Recommended)* 30-min CPA/attorney check to confirm dissolve-Utah-and-reform-GA vs. domestication, given taxes.
- [ ] ⚖️ **G2. Image rights / fair-use** — UGC license + ownership attestation + registered **DMCA agent** before the photo-contribution feature ships.
- [ ] ⚖️ **G3. Trademark / brand-usage** review for using brand + style names at scale.
- [ ] ⚖️ **G4.** Confirm `luxurycatalog.com` domain auto-renew (~Aug 9 annually).

---

## H. Decisions / future-build (mostly resolved this session)

- [x] 🧠 **H1/H2. Build order + first feature** — DECIDED: build the full engagement track now (social UI → feed → taste quiz → recs → **Taste Map** → notifications). Built on the feature branch this session.
- [x] 🧠 **H3. Admin auth gate** — BUILT: `/admin/*` gated behind `profile.is_admin` (migration `0008`, fail-closed). **Operator:** after applying `0008`, set your own flag (`update profile set is_admin = true where id = '<your-id>';`) or you're locked out.
- [ ] 🧠 **H4. Social links policy** — confirm allowed networks (IG/TikTok/YouTube/Poshmark/Substack) + verified-link treatment.
- [ ] ⚠️ **H6. Identify / camera tool isn't "real" yet — DO NOT public-launch it as-is (owner flag, 2026-06-22).** Like the authenticator marketplace was, the `/identify` camera tool presents as a working feature but doesn't actually deliver trustworthy results yet. **Before public launch, either (a) make it genuinely work, or (b) give it the same coming-soon / "notify me" fake-door treatment we used for authentication** (gate the real flow, capture demand). Keep this item on the to-do list until resolved — **no in-chat reminders needed** (owner preference). Next step: audit `/identify` (`src/app/identify/page.tsx`) to confirm current behavior, then decide build-vs-fake-door.
- [x] 🧠 **H5. Photo-contribution system** — BUILT (2026-06-22): `bag_photo` + contributor tiers, hybrid moderation, bag-page gallery/upload, `/admin/photos`, `/photos/most-wanted`, profile tier card. **Operator actions:** (1) apply **`0016_photo_contributions.sql`** (`supabase db push` — it also creates the public `bag-photos` Storage bucket + policies); (2) ensure `SUPABASE_SERVICE_ROLE_KEY` is set (admin queue + auto-publish + Most-Wanted demand ranking need it); (3) grant `is_authenticator` to vetted contributors so they auto-publish; (4) **register a DMCA agent before promoting UGC widely** (see G2). Galleries/upload degrade gracefully until 0016 is applied. **Smoke-test checklist: `docs/photo-smoke-test.md`** (run on your laptop after applying 0016).

---

## I. Permanent fix — make the cloud self-sufficient for DB work (optional, high-value)

The cloud sandbox **can't reach Supabase** (network egress blocks all `*.supabase.*`
hosts), which is why migrations/seeding had to run from the laptop. To let future
cloud sessions do DB work directly (no laptop, no `.env.local` syncing):
- [ ] 🔧 **I1.** Edit this environment (claude.ai/code → cloud icon → hover env → gear): **Network access → Custom**, add allowed domains `pewmdztviyrtbhtebcct.supabase.co` + `api.supabase.com`, and ✅ keep "Also include default list of common package managers."
- [ ] 🔧 **I2.** In the same dialog, add env vars `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (note: stored in env config, visible to anyone who can edit it — no secrets store yet). Changes apply to **new** sessions.

---

## Quick reference — accounts

| Service | For | Where |
|---|---|---|
| Supabase | DB (`pewmdztviyrtbhtebcct`, region us-west-2) | supabase.com |
| Vercel | Hosting (team `darkseerbruh`, prod `luxury-catalog-omega.vercel.app`) | vercel.com |
| Anthropic | Camera tool + NL search + analytics digest | console.anthropic.com |
| PostHog | Analytics | posthog.com |
| Squarespace Domains | `luxurycatalog.com` DNS (now on Squarespace nameservers) | domains.squarespace.com |
| Resend | Alert email + Supabase SMTP | resend.com |
| GA Secretary of State | `Luxury Catalog, LLC` filing / annual registration | ecorp.sos.ga.gov |
| IRS | EIN | irs.gov |
</content>
