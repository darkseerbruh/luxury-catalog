# CJ token rotation — the 3-minute phone runbook

*The one manual step in the CJ affiliate pipeline. Keep it close; when the alarm
fires you want this to be muscle memory, not a hunt.*

## Why this exists

The **CJ affiliate token** (`CJ_API_TOKEN`) powers two live feeds: **The Luxury
Closet** and **Rebag** listings, the "for sale right now" rails on bag pages. It is a
JWT with a **built-in expiry date**, and CJ offers **no auto-renew** (their API only
takes a static Personal Access Token, verified 2026-07-15 from developers.cj.com). So
once it lapses, both feeds return `403: Could not authenticate given token` and go
stale until you mint a fresh token by hand.

You never have to catch this by surprise:

- 🔔 A daily job (`.github/workflows/cj-token-expiry.yml`) reads the token's own expiry
  date and opens a GitHub issue at **10 days left**.
- 📲 At **2 days left** the vendor-inbox engine pings your phone.
- Both point back here.

## The rotation (do it from your phone, ~3 min)

> 🔑 You mint and paste the token. Claude can't (creating and entering credentials is a
> hard line). Everything on either side of the paste is Claude's job.

1. **Mint a new token.** Go to **developers.cj.com** → sign in → your account →
   **Personal Access Tokens** → create a new token, and **revoke the old one**. If it
   offers an expiry length, **pick the longest** so this comes around less often.
   *(The token shows only once. Copy it straight into step 2.)*

2. **Update GitHub.** Repo → **Settings** → **Secrets and variables** → **Actions** →
   `CJ_API_TOKEN` → **Update** → paste → save.

3. **Update Vercel.** **luxury-catalog** project → **Settings** → **Environment
   Variables** → `CJ_API_TOKEN` → edit → paste the same value → save.

## Then hand it back to Claude

Say **"CJ token rotated."** Claude will:

- re-run **Refresh TLC live listings** and **Refresh Rebag live listings**,
- confirm both go green,
- close the expiry issue,
- and confirm the new expiry date so you know when the next rotation lands.

## If a feed is already 403-ing

Same three steps. The feeds refresh on their daily schedule, and Claude can re-trigger
them the moment you've pasted the new token, so there's no waiting.

## Reference

- Token format + auth: [developers.cj.com/authentication/overview](https://developers.cj.com/authentication/overview)
- The feeds it powers: `supabase/ingest/sources/tlc.ts`, `supabase/ingest/sources/rebag.ts`
- The alarm: `.github/workflows/cj-token-expiry.yml` + `scripts/check-cj-token-expiry.ts`
- Engine escalation rule: `docs/vendor-inbox-engine.md` §5
