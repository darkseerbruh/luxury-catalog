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
  ],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://*.posthog.com",
    "https://graph.facebook.com",
    "https://www.instagram.com",
    "https://*.cdninstagram.com",
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
