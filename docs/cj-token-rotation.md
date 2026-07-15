# CJ token rotation — the 3-minute phone runbook

*The one manual step in the CJ affiliate pipeline. Keep it close; when the alarm
fires you want this to be muscle memory, not a hunt.*

## Why this exists

The **CJ affiliate token** (`CJ_API_TOKEN`) powers two live feeds: **The Luxury
Closet** and **Rebag** listings, the "for sale right now" rails on bag pages. CJ offers
**no auto-renew** (their API takes a static Personal Access Token, verified 2026-07-15
from developers.cj.com), and the token is an **opaque string** with no expiry date we
can read off it (confirmed against the live token 2026-07-15). So when it stops working,
both feeds return `403: Could not authenticate given token` and go stale until you mint
a fresh one by hand.

Because the expiry isn't readable, a daily monitor watches whether the token still
works, rather than counting down to a date:

- 🔎 A daily job (`.github/workflows/cj-token-expiry.yml`) makes one tiny authenticated
  CJ request. If CJ rejects it (401/403), the token is dead and it opens a GitHub issue.
- 📲 The vendor-inbox engine sees that issue and pings your phone.
- Both point back here. (If CJ ever issues a token with a readable expiry, the job also
  warns 10 days ahead automatically.)

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
