import type { Metadata } from "next";
import Script from "next/script";
import { Poppins, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { BRAND_TIERS, getBrandsOverview } from "@/lib/queries";
import { covetedBagsReady } from "@/lib/content-gates";
import { Providers } from "./providers";
import TasteFlusher from "./TasteFlusher";
import HeaderNav from "@/components/HeaderNav";
import { FirstAlertNudge } from "@/components/FirstAlertNudge";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Skimlinks publisher ID — overridable per environment, defaults to our account.
const SKIMLINKS_ID = process.env.NEXT_PUBLIC_SKIMLINKS_ID ?? "305125X1793317";

export const metadata: Metadata = {
  title: "The Luxury Catalog",
  description:
    "The reference for designer handbags: Production history, authentication markers, and what they actually resell for, brand by brand.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadCount() : 0;

  // Tier-grouped brands for the "Brands" nav mega-menu. Brand is a destination in
  // exactly this one nav slot; everywhere else it's an on-page filter (no nav bloat).
  const brandsOverview = await getBrandsOverview();
  const brandGroups = BRAND_TIERS.map((t) => ({
    label: t.label,
    brands: brandsOverview
      .filter((b) => b.tier === t.key)
      .map((b) => ({ brandId: b.brandId, name: b.name })),
  })).filter((g) => g.brands.length > 0);

  // "Coveted" (most-coveted bags) stays hidden in nav + footer until there's
  // enough want-signal to make the ranking meaningful (content gate).
  const covetedReady = await covetedBagsReady();
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-foreground font-sans">
        <Providers>
        <TasteFlusher signedIn={!!user} />
        <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm print:hidden">
          <div className="relative mx-auto flex max-w-5xl items-center justify-between border-b border-border px-5 py-4">
            <Link href="/" className="shrink-0 font-serif text-xl tracking-wide text-foreground">
              The Luxury Catalog
            </Link>
            <HeaderNav signedIn={!!user} unread={unread} brandGroups={brandGroups} covetedReady={covetedReady} />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <FirstAlertNudge />
        <footer className="border-t border-border px-5 py-8 text-sm text-muted print:hidden">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <p className="font-serif text-foreground">The Luxury Catalog</p>
              <p className="mt-2 max-w-xs text-muted">
                Production history, authentication markers, and resale prices for designer handbags.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-muted/70">Shop</p>
              <Link href="/shop" className="hover:text-foreground">Shop the market</Link>
              <Link href="/deals" className="hover:text-foreground">Deals</Link>
              {covetedReady && (
                <Link href="/coveted" className="hover:text-foreground">Most coveted bags</Link>
              )}
              <Link href="/browse" className="hover:text-foreground">Browse</Link>
              <Link href="/search" className="hover:text-foreground">Search</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-muted/70">Discover</p>
              <Link href="/identify" className="hover:text-foreground">Identify</Link>
              <Link href="/quiz" className="hover:text-foreground">Style read</Link>
              <Link href="/articles" className="hover:text-foreground">Articles</Link>
              <Link href="/coveted-closets" className="hover:text-foreground">Coveted closets</Link>
              <Link href="/found" className="hover:text-foreground">Log a find</Link>
            </div>
            {/* "You" = personal, auth-gated surfaces. Hidden when logged out so
                signed-out visitors are never sent to a link that just bounces
                them to /login (mirrors the header, which also hides these). */}
            {user ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wide text-muted/70">You</p>
                <Link href="/feed" className="hover:text-foreground">Feed</Link>
                <Link href="/closet" className="hover:text-foreground">Your closet</Link>
                <Link href="/watchlist" className="hover:text-foreground">Watchlist</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-wide text-muted/70">Account</p>
                <Link href="/login" className="hover:text-foreground">Log in</Link>
                <Link href="/signup" className="hover:text-foreground">Create account</Link>
              </div>
            )}
          </div>
          <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-xl text-muted/60">
              Prices shown are estimates compiled from third-party resellers, for general information
              only — not offers, appraisals, or financial advice. Some links are affiliate links; we may
              earn a commission, at no extra cost to you.
            </p>
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/disclosure" className="hover:text-foreground">Affiliate disclosure</Link>
              <Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
            </nav>
          </div>
        </footer>
        </Providers>
        {/* Skimlinks: auto-affiliates outbound merchant links (revenue on
            "where to buy" clicks). ID overridable via env; defaults to our
            account. Affiliate tracking is covered by /privacy + /disclosure. */}
        {SKIMLINKS_ID && (
          <Script
            id="skimlinks"
            strategy="afterInteractive"
            src={`https://s.skimresources.com/js/${SKIMLINKS_ID}.skimlinks.js`}
          />
        )}
      </body>
    </html>
  );
}
