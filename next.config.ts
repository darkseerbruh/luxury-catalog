import type { NextConfig } from "next";

// Reverse-proxy PostHog through our own origin so analytics requests are not
// blocked by ad blockers and no third-party host is exposed. Points at PostHog
// US Cloud; EU-cloud projects should swap the hosts below for the eu.i / eu-assets
// equivalents. See:
// node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md
const nextConfig: NextConfig = {
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
