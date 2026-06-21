# Social Media Embed Strategy — YouTube + Instagram

*Prepared 2026-06-21. Decision-support, not legal advice — confirm the
load-bearing Instagram items with IP counsel before featuring a creator as a
partner. Companion to `docs/image-strategy-research.md` (why we don't host
images) and `docs/marketing-plan.md` (video/UGC channel).*

**Method/limitation:** UX and legal findings come from a web-research pass
(June 2026); claims are search-sourced and cross-corroborated where possible.
Creator handles were verified verbatim against live profile results. Court-case
holdings are summarized for orientation, not as a legal opinion.

---

## Bottom line (decision-first)

1. **Keep extending the *embed-don't-host* model.** We already add a visual
   layer to a text-first catalog by *embedding* third-party YouTube reviews
   rather than hosting images — this sidesteps the image-copyright trap that
   `docs/image-strategy-research.md` documents (never copy or scrape creator/
   reseller photos). Social embeds are the same move for Instagram. `HIGH`
2. **YouTube stays the primary visual layer.** Embedding via the standard player
   is explicitly permitted by YouTube's Terms, already implemented
   (`src/app/bag/[variantId]/Resources.tsx`, `src/lib/youtube.ts`,
   `youtube-nocookie` domain), and lowest-risk. Expand the roster; no
   architecture change. `HIGH`
3. **Add Instagram as a secondary layer — via the *official authenticated*
   oEmbed Read API, gated by a *permission-first* curation rule.** Instagram is
   legally and operationally trickier than YouTube (below). Treat featured
   creators as **partners we ask first**; treat un-permissioned public posts as
   interim, attribution-only link-outs. `HIGH`
4. **Reuse the existing `creator` + `resource` data model.** Instagram posts
   attach to a brand/style/variant exactly like YouTube videos and surface in
   the same per-bag "Reviews & social" section. No new surface area, no walls of
   embeds. `HIGH`

### Recommended path (buildable now)
- **Roster the creators now** (done — `supabase/seed/research/creators.json`):
  Je suis Lou, Redeluxe/Georgia, PurseBop, Handbag Holic + the existing YouTube
  reviewers.
- **Ship the Instagram plumbing now** (done — migration `0012`, `src/lib/
  instagram.ts`, `InstagramCard` facade, CSP): renders official oEmbed behind a
  click-to-load facade, degrades to attribution link-out without a token.
- **Turn Instagram *on* when** (a) the Meta app + oEmbed Read feature is approved
  and (b) permission is secured for any *featured* partner.

---

## 1. How comparable sites display & leverage social content (UX norms)

What PurseBlog, PurseBop, news/editorial sites, and platform docs converge on:

- **Attribution is non-negotiable.** Every embed shows the creator's username and
  links back to the original post/profile. The official Instagram/oEmbed markup
  does this automatically — and it's also what keeps the use *editorial* rather
  than appropriative. Our `InstagramCard` and `VideoCard` both preserve a byline
  + link-out. `HIGH`
- **Facade / click-to-load is the standard for performance + privacy.** Render a
  lightweight static poster (thumbnail + author + a play/expand affordance); only
  load the platform script, iframe, and tracking cookies *on interaction*. This
  is the documented best practice
  ([web.dev third-party embeds](https://web.dev/articles/embed-best-practices),
  [Lighthouse third-party facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades))
  and is exactly what our YouTube card already does; the Instagram card mirrors
  it. `HIGH`
- **The facade doubles as a cookie-consent gate.** Instagram/Meta embeds set
  tracking cookies; the GDPR-aligned norm is "block the embed, show a
  placeholder, load only after the user opts in"
  ([TermsFeed](https://www.termsfeed.com/blog/social-media-cookies/),
  [Complianz](https://complianz.io/social-media-on-a-cookiebanner/)). Because our
  embed only loads on click, no Meta cookies land on initial page view. (YouTube
  is further mitigated via `youtube-nocookie`.) `HIGH`
- **Don't build walls of embeds.** Editorial references place embeds *inline,
  in context* (against a specific bag/section), lazy-load, and cap the count per
  page to protect performance
  ([EmbedSocial](https://embedsocial.com/blog/embed-social-media-posts/)). We
  follow this: embeds live only in the per-bag "Reviews & social" block, capped
  at 12 resources per page. `HIGH`
- **Accessibility.** Facade triggers are real keyboard-focusable `<button>`s with
  ARIA labels; video needs captions; embeds sit in responsive aspect-ratio
  containers; offer a way to skip past embed regions
  ([Universal Design](https://universaldesign.ie/communications-digital/web-and-mobile-accessibility/web-accessibility-techniques/developers-introduction-and-index/ensure-custom-widgets-are-accessible/ensure-embedded-social-media-code-is-accessible)).
  `MEDIUM`
- **Mobile-first.** A large share of traffic is mobile; embeds must scale at
  ~375px. Instagram posts are roughly square/portrait — the card uses a square
  facade so layout doesn't jump. `HIGH`

### How the content gets *leveraged* (product role)
- **Substitute for product photography.** The whole point: visuals without owning
  or licensing a single image. A "Birkin 30 in hand" reel or review stands in for
  a photo we can't legally host.
- **Trust / authentication signal.** Reseller content (Redeluxe/Georgia) and
  authority accounts (PurseBop) reinforce the catalog's credibility — "creators
  we trust," with a *Trusted reviewer* badge.
- **GEO/SEO + dwell time.** Embedded media deepens per-bag pages (a named channel
  in `docs/marketing-plan.md`) and increases engagement without bloating
  first-load (facades keep it fast).

---

## 2. Permissions / access — the real picture

This is where YouTube and Instagram diverge sharply.

### YouTube — settled, low-risk
Embedding via the standard iframe player is permitted by YouTube's Terms of
Service; thumbnails come from YouTube's CDN; we use the privacy-enhanced
`youtube-nocookie` domain. Continue as-is. `HIGH`

### Instagram — three layers to understand

**(a) Copyright layer — embedding ≠ display (in the 9th Circuit).**
*Hunley v. Instagram* (9th Cir., 2023) held that embedding a public post via
Instagram's own tool does **not** create a "display" copy and so is **not**
direct copyright infringement (the "server test") — a win echoed by EFF and the
earlier BuzzFeed/Time outcomes
([EFF](https://www.eff.org/deeplinks/2023/07/victory-embedded-links-photos-instagram-dont-infringe-photographers-copyrights),
[Thompson Coburn](https://www.thompsoncoburn.com/insights/instagrams-embedding-tools-and-copyright-ninth-circuits-ruling-explained-102jazs/)).
**But this is a circuit split** — *Goldman v. Breitbart* (SDNY, 2018) rejected
the server test — so the protection is **jurisdiction-dependent, not settled
nationally**
([Nat'l Law Review](https://natlawreview.com/article/to-embed-or-not-to-embed-new-challenge-to-embedding-images-social-media)).
`HIGH` (9th Cir. holding) / `MEDIUM` (national uniformity)

**(b) Platform/permission layer — Instagram says you may need the creator's OK.**
Even where embedding is copyright-safe, Instagram has stated that using its
embeds **may require a separate license/permission from the content owner** — the
platform terms don't sublicense the creator's content to the embedder
([Social Media Today](https://www.socialmediatoday.com/news/you-may-need-to-get-creator-permission-for-instagram-embeds-according-to-i/579268/),
[Copyright Lately](https://copyrightlately.com/legal-embed-instagram-photos-website/)).
→ **Permission-first rule:** for any *featured* creator partnership, get written
permission. Treat incidental public embeds as interim/attribution-only. `HIGH`

**(c) API-access layer — the April 2025 change.**
The old *unauthenticated* oEmbed endpoint was removed; the **Meta oEmbed Read
API now requires a registered Facebook/Meta app, an app or client access token,
and business verification + feature approval** before it returns embed HTML
([Meta oEmbed docs](https://developers.facebook.com/docs/instagram-platform/oembed/),
[WP Tavern](https://wptavern.com/upcoming-api-change-will-break-facebook-and-instagram-oembed-links-across-the-web-beginning-october-24)).
This is a real **operational dependency**, not just code (see Operational setup).
`HIGH`

### Affiliate-monetization caveat (carried from the image research)
Affiliate links push the site's use toward "commercial," which weakens the
editorial/nominative-fair-use shield. Keep embeds clearly editorial, keep
attribution intact, and **imply no endorsement/sponsorship** in either
direction (the site doesn't claim the creator endorses it; the creator's post
isn't presented as a paid placement). `MEDIUM`

### Decision matrix

| | YouTube | Instagram |
|---|---|---|
| Embed permitted by platform ToS | Yes | Via official oEmbed; **may need creator permission** |
| Copyright posture | Settled-safe | 9th-Cir-safe, **circuit split** elsewhere |
| API access | Open iframe | **Authenticated app + verification (Apr 2025)** |
| Our posture | Ship & expand | **Permission-first**, official oEmbed, facade-gated |
| Risk | Low | Low–Medium (managed by permission + attribution) |

### Out of scope: Pinterest (outbound-only, not an embed source)
Pinterest is deliberately **not** an on-site embed layer like YouTube/Instagram.
Its strength is *outbound* — a visual-search/shopping engine (~75% of users are
actively shopping, long content half-life) that drives high-intent traffic **to**
the catalog. So Pinterest is handled as a **distribution + creator-collaboration**
channel (Rich Pins, creator shared/group boards), not embedded pins — which also
means **no** Pinterest `frame-src`/CSP, `resource_type`, or `PinterestCard` work.
See `docs/marketing-plan.md` (distribution) and
`docs/creator-collaboration-strategy.md` (shared boards). If on-site pin embedding
is ever wanted, Pinterest's own widget/oEmbed needs no auth token (unlike
Instagram) — a low-lift future add.

---

## 3. Recommended architecture (what we built)

oEmbed is fetched **server-side** so the Meta token never reaches the browser,
cached for a week, and rendered behind the same click-to-load facade as YouTube.

- **Data model** — reuse `creator` + `resource` (`0004`). New migration `0012`
  (`0011` is reserved for the queued photo-contributions work — see `handoff.md`)
  adds `'instagram'` to the `resource_type` enum and nullable cache columns
  (`embed_html`, `thumbnail_url`, `author_name`). `creator_platform` already had
  `'instagram'`.
- **Helper** — `src/lib/instagram.ts`: `instagramShortcode()` parses post/reel/tv
  URLs; `getInstagramOEmbed()` calls the authenticated Meta oEmbed Read API
  (server-only token), cached, returning `null` (→ graceful link-out) when the
  token is missing or the call fails.
- **Query** — `getResourcesForStyle()` in `src/lib/queries.ts` carries the
  Instagram fields and lazily enriches Instagram rows lacking cached HTML.
- **Display** — `InstagramCard` in `Resources.tsx`: square poster facade → on
  click, injects official oEmbed HTML and loads `embed.js` **once**. Without
  embed HTML it renders an attribution link-out to the post.
- **CSP** — `next.config.ts` adds a `Content-Security-Policy` whose `frame-src`
  is locked to YouTube + Instagram/Facebook (the meaningful security win); it's
  intentionally permissive on script/style/img so Next hydration, Tailwind,
  PostHog, Supabase, and arbitrary avatar URLs keep working. Tighten to nonces
  later.

### Operational setup (human-gated, before Instagram goes live)
1. Create/register a **Meta app**, enable **oEmbed Read**, complete **business
   verification** + feature review.
2. Set `META_OEMBED_TOKEN` (or `META_APP_ID` + `META_APP_SECRET`) in the server
   env (documented in `.env.example`). Until then, Instagram resources degrade to
   attribution link-outs — nothing breaks.
3. Secure **written permission** for any featured creator partner.
4. Add `resource_type:'instagram'` rows to `creators.json` **only** with real,
   verified `https://www.instagram.com/p/<shortcode>/` URLs (never-invent rule).

---

## 4. Creator roster (rostered in `creators.json`)

Tiered by role. Handles verified verbatim June 2026. *Permission-first applies
before any creator is featured as a partner.*

| Tier | Creator | Handle / channel | Angle |
|---|---|---|---|
| 1 — Authority / education | **PurseBop** (Monika Arora) | IG [@pursebop](https://www.instagram.com/pursebop/) · pursebop.com | Hermès/Chanel/LV education, pricing, market authority |
| 1 — Authentication / reseller | **Redeluxe** (Georgia Swain) | IG [@redeluxe](https://www.instagram.com/redeluxe/) · redeluxe.com · YT/TikTok | Pre-owned, authentication-forward, strong in-hand visuals |
| 1 — Reviews / investment | **Handbag Holic** (Steph Turton) | IG [@handbag_holic](https://www.instagram.com/handbag_holic/) · YouTube | Reviews, comparisons, "is it worth it" / investment value |
| 2 — Collector / reviewer | **Je suis Lou** | YT [JesuisLou](https://www.youtube.com/c/JesuisLou) (~170K) · IG [@je.suis.lou](https://www.instagram.com/je.suis.lou/) (~121K) | Hermès/LV collection, styling, travel — *first pick* |
| 2 — Reviewer (YouTube) | The Handbag Husband · Katie Danger · Armcandy Bag Co | YouTube | In-depth bag reviews — **already seeded** |
| 3 — Lifestyle / styling (optional) | Aimee Song · Alyssa Lenore · Wendy Yu | Instagram | Styling/haul context; larger reach, less authentication focus |

**Selection criteria:** credibility/authentication focus > raw follower count;
consistent bag-specific content that maps to our hero styles (Birkin, Kelly,
Classic Flap, Tabby, Swagger); a clear attributable identity. Tier-3 lifestyle
accounts are a "more reach" option, not a priority.

---

## Open gaps / verify before relying
- **Legal**: confirm the Instagram copyright/permission posture with IP counsel
  before *featuring* a creator as a partner. Holdings above are orientation only.
- **Meta app dependency**: oEmbed Read needs app approval + business
  verification; code degrades gracefully until the token exists.
- **Never-invent**: do not seed specific Instagram post URLs/IDs that aren't
  verified at curation time — roster the creators, add posts as confirmed.
- **CSP**: validate in production that the policy doesn't block YouTube embeds,
  PostHog `/ingest` rewrites, or Supabase calls; tighten to nonces in a later pass.

## Sources
- [EFF — embedded Instagram links don't infringe (Hunley)](https://www.eff.org/deeplinks/2023/07/victory-embedded-links-photos-instagram-dont-infringe-photographers-copyrights)
- [Thompson Coburn — Ninth Circuit embedding ruling explained](https://www.thompsoncoburn.com/insights/instagrams-embedding-tools-and-copyright-ninth-circuits-ruling-explained-102jazs/)
- [National Law Review — to embed or not to embed](https://natlawreview.com/article/to-embed-or-not-to-embed-new-challenge-to-embedding-images-social-media)
- [Social Media Today — you may need creator permission for IG embeds](https://www.socialmediatoday.com/news/you-may-need-to-get-creator-permission-for-instagram-embeds-according-to-i/579268/)
- [Copyright Lately — is it legal to embed public Instagram photos](https://copyrightlately.com/legal-embed-instagram-photos-website/)
- [Meta — Instagram oEmbed documentation](https://developers.facebook.com/docs/instagram-platform/oembed/)
- [WP Tavern — Facebook/Instagram oEmbed API change](https://wptavern.com/upcoming-api-change-will-break-facebook-and-instagram-oembed-links-across-the-web-beginning-october-24)
- [web.dev — best practices for third-party embeds](https://web.dev/articles/embed-best-practices)
- [Lighthouse — lazy-load third-party resources with facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)
- [TermsFeed — social media cookies](https://www.termsfeed.com/blog/social-media-cookies/)
- [Universal Design — accessible embedded social media](https://universaldesign.ie/communications-digital/web-and-mobile-accessibility/web-accessibility-techniques/developers-introduction-and-index/ensure-custom-widgets-are-accessible/ensure-embedded-social-media-code-is-accessible)
- Creator handles: [@je.suis.lou](https://www.instagram.com/je.suis.lou/), [Je suis Lou YT](https://www.youtube.com/c/JesuisLou), [@redeluxe](https://www.instagram.com/redeluxe/), [@pursebop](https://www.instagram.com/pursebop/), [@handbag_holic](https://www.instagram.com/handbag_holic/)
