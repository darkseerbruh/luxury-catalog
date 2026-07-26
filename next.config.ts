import type { NextConfig } from "next";

// Content-Security-Policy. The primary goal here is to constrain which origins
// may be framed/scripted now that we embed third-party social content (YouTube +
// Instagram, see docs/social-embed-strategy.md). It is intentionally permissive
// on script/style ('unsafe-inline'/'unsafe-eval' — Next's hydration + Tailwind
// need them) and on img-src (avatar_url accepts arbitrary user-supplied https
// images); tighten to nonces in a later pass. frame-src is the meaningful lock.
const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.instagram.com",
    "https://*.cdninstagram.com",
    // Affiliate network tags (revenue). Without these the browser blocks the
    // scripts and they silently never run: impact.com's Universal Tracking Tag
    // (also needed for impact's ownership verification) and Skimlinks.
    "https://*.impactcdn.com",
    "https://s.skimresources.com",
    // Cloudflare Turnstile (signup/login bot protection). Omit this and the
    // widget script is blocked with no visible error, which is exactly how a
    // third-party tag has silently died here before.
    "https://challenges.cloudflare.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "frame-src": [
    "'self'",
    "https://www.youtube-nocookie.com",
    "https://www.youtube.com",
    "https://www.instagram.com",
    "https://www.facebook.com",
    // Turnstile renders its challenge inside an iframe.
    "https://challenges.cloudflare.com",
  ],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://*.posthog.com",
    "https://graph.facebook.com",
    "https://www.instagram.com",
    "https://*.cdninstagram.com",
    // Affiliate beacons: impact.com impression/click events + Skimlinks. img-src
    // already allows any https pixel; these cover fetch/XHR/sendBeacon beacons.
    "https://*.impactcdn.com",
    "https://*.impactradius-event.com",
    "https://*.skimresources.com",
    // Turnstile posts the solved challenge back to Cloudflare.
    "https://challenges.cloudflare.com",
  ],
  "frame-ancestors": ["'self'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

const contentSecurityPolicy = Object.entries(cspDirectives)
  .map(([key, values]) => `${key} ${values.join(" ")}`)
  .join("; ");

// Reverse-proxy PostHog through our own origin so analytics requests are not
// blocked by ad blockers and no third-party host is exposed. Points at PostHog
// US Cloud; EU-cloud projects should swap the hosts below for the eu.i / eu-assets
// equivalents.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // `/closets` was renamed to `/coveted-closets` so it can't be mistaken
      // for `/closet` (your own closet, one letter apart). Keep old links,
      // bookmarks, and indexed URLs working.
      {
        source: "/closets",
        destination: "/coveted-closets",
        permanent: true,
      },
      // Articles moved from `/posts` to `/articles` so the URL matches the nav
      // label. Keep old links, shares, and indexed URLs working (308).
      { source: "/posts", destination: "/articles", permanent: true },
      { source: "/posts/:path*", destination: "/articles/:path*", permanent: true },
      { source: "/profile/posts", destination: "/profile/articles", permanent: true },
      // Search is now the market: `/shop` is one surface (search + filters + deals).
      // A config redirect issues a clean HTTP 307 before render (the page-level
      // redirect on the force-dynamic route degraded to a 1s meta-refresh). The `q`
      // query string is preserved automatically, so `/search?q=birkin` → `/shop?q=birkin`.
      // Temporary (307): `/search` may return as its own surface later. Spec:
      // docs/ux/unified-market-spec.md.
      { source: "/search", destination: "/shop", permanent: false },
      // Deals is the "deals only, best deal first" preset of the same market.
      // Config redirect (clean 307) beats the page-level one, which degraded to a
      // 1s meta-refresh on the streaming route.
      { source: "/deals", destination: "/shop?deals=1&sort=best-deal", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // PostHog's API does not expect a trailing slash to be appended.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
