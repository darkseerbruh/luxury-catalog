# Security baseline

Last verified: 2026-06-26. Owner: Arielle. This is the at-a-glance record of how the
site is protected. Update the "Last verified" date and the relevant row whenever any of
this changes. Keep it to one page (anti-bloat rule).

## The three risks, and what closes each

| Fear | Defenses in place | Where it lives |
|------|-------------------|----------------|
| Money taken (runaway API bill) | 1. Per-IP rate limit on `/api/identify` (6 / 5 min) and newsletter signup (5 / 10 min). 2. Working `ANTHROPIC_API_KEY` (the `KEY2` typo that left it keyless in prod is fixed). 3. Anthropic hard spend cap $100/mo. | `src/lib/rate-limit.ts`; Vercel env; Anthropic console |
| Site locked / abused | 1. All 5 cron routes fail closed (deny unless `CRON_SECRET` matches). 2. `CRON_SECRET` set in Vercel. 3. 2FA on GitHub + Google. | `src/app/api/cron/*`; Vercel env; account settings |
| Data exposed / key leaked | 1. Service-role key walled off with `import "server-only"` (build fails if imported client-side). 2. Key rotated 2026-06-26. 3. Row-Level Security on every table. | `src/lib/supabase/admin.ts`; Supabase console; migration `0029` |

## What is public by design (not a leak)

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are meant to ship in the
  browser. They are safe because Row-Level Security, not secrecy, protects the data.
- `NEXT_PUBLIC_POSTHOG_KEY` and the affiliate IDs are public project keys.

## How Row-Level Security is set up (migration 0029)

- **Catalog / reference tables** (brand, style, variant, price_history, etc.): RLS on,
  public SELECT only. Anyone can read the catalog; only the service role can write.
- **User tables** (profile, watchlist, closet, notifications, user_profile, etc.): RLS on,
  scoped so a user reaches only their own rows.
- **Append-only logs** (search misses, feedback): anon may INSERT, reads go through the
  service-role admin client.
- **Privileged columns** (`is_admin`, trust flags, contribution points): `REVOKE`d from the
  client roles so a user cannot self-grant admin. Service role writes them only.

## Where secrets live (the only correct homes)

1. **Vercel → Environment Variables** for anything production uses.
2. **`.env.local`** for local dev (gitignored, file mode 600). Never committed.
3. **A password manager** as the source of truth.

No secret has ever been committed to this repo, current tree or git history (audited
2026-06-26). `.gitignore` blocks all `.env*` and `*.pem` files.

## If a key leaks (incident playbook)

1. Rotate it in the provider's console first (Supabase / Anthropic / Resend / eBay / Meta).
2. Update the new value in Vercel env and `.env.local`.
3. Redeploy.
4. For the Supabase service-role key or DB password, also rotate the DB password and any
   access tokens, since that key bypasses RLS.

## Open verification (small)

- [ ] Confirm Vercel, Supabase, Anthropic, and Resend all log in via Google sign-in (so the
      Google 2FA covers them). If any has its own email-and-password login, turn on 2FA there.

## Known limitation, logged on purpose

- The rate limiter is in-memory and per-server, so on Vercel it throttles per warm instance,
  not globally. The $100/mo Anthropic cap is the hard backstop behind it. If `/api/identify`
  ever takes heavy real traffic, upgrade to a shared counter (Upstash). Not urgent now.
