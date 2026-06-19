# Luxury Catalog — Deployment Checklist

*Written 2026-06-19 at end of Phase 6. This is the canonical go-live runbook.*

---

## 1. Vercel environment variables

Go to **Vercel → luxury-catalog project → Settings → Environment Variables**.

Required for the app to function:

| Variable | Where to get it | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → anon/publishable key | Production, Preview, Development |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Production, Preview |

The Supabase vars were added in Phase 1 — verify they're still there. `ANTHROPIC_API_KEY` is new in Phase 4 (camera tool); the `/identify` route returns a 503 with a human-readable error if it's missing, so the site won't break, but the camera tool won't work.

## 2. Set production branch in Vercel

Vercel currently deploys on every push to `claude/desktop-display-test-d621oc` as preview deployments. To get a stable production URL:

**Option A (recommended):** In Vercel → Project Settings → Git → Production Branch, change from `main` to `claude/desktop-display-test-d621oc`. Every push to this branch then deploys to the production domain.

**Option B:** Merge `claude/desktop-display-test-d621oc` → `main` and keep `main` as production branch. Safer for future work isolation — create feature branches off `main`, PR to `main`, auto-deploy on merge.

## 3. Verify the production deployment

After the branch is set and env vars are confirmed:

```bash
# Check all 9 routes respond with 200
curl -sI https://luxurycatalog.com/ | head -1
curl -sI https://luxurycatalog.com/search?q=chanel | head -1
curl -sI https://luxurycatalog.com/identify | head -1
```

Spot-check one real bag page — find a variantId from the Supabase brand table or the search page and confirm `/bag/[variantId]` loads real data.

## 4. DNS cutover: luxurycatalog.com → Vercel

### Step 1: Add domain in Vercel

In Vercel → luxury-catalog project → Settings → Domains, add:
- `luxurycatalog.com`
- `www.luxurycatalog.com`

Vercel will give you the DNS records to set.

### Step 2: Update DNS at Squarespace Domains

Log in to Squarespace Domains (domains.squarespace.com). Go to luxurycatalog.com → DNS.

Set these records (Vercel will show the exact values after Step 1):

```
Type    Name    Value                    TTL
A       @       76.76.21.21              3600
CNAME   www     cname.vercel-dns.com.    3600
```

*(Vercel's actual IPs/CNAME targets; confirm in the Vercel UI — do not rely on the above values blindly.)*

Remove any existing A/CNAME records for `@` and `www` that point to the old host (Squarespace, etc.) to avoid conflicts.

### Step 3: Wait for DNS propagation

DNS typically propagates in 15–60 minutes, fully global within 24 hours. Vercel will show "Valid Configuration" in the Domains panel once it verifies.

### Step 4: SSL

Vercel provisions SSL automatically once DNS resolves. Nothing to configure.

## 5. Post-launch verification

- [ ] `https://luxurycatalog.com` loads and shows real brand/hero data (not an error)
- [ ] Search returns results for "Chanel", "Birkin", "Coach"
- [ ] `/brand/[id]` loads for a live brand (Chanel, Hermès, Coach)
- [ ] `/bag/[variantId]` loads for a real hero variant
- [ ] `/identify` page loads and camera input works on mobile
- [ ] `/identify` camera tool returns results (requires `ANTHROPIC_API_KEY` set)
- [ ] Footer links all resolve
- [ ] No JS errors in browser console on any route

## 6. One thing that's not done yet (deferred by design)

**`luxurycatalog.com` email forwarding** — `hello@luxurycatalog.com` and `arielle@luxurycatalog.com` were set up at Squarespace but the MX records for forwarding may conflict with or be overwritten by the Vercel DNS cutover. After pointing DNS at Vercel, re-verify email forwarding still works by sending a test message to `hello@luxurycatalog.com`. If forwarding broke, re-add the MX records for Squarespace email forwarding alongside the Vercel A/CNAME records.
