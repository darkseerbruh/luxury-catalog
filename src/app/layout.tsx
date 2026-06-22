import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import { Providers } from "./providers";
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

export const metadata: Metadata = {
  title: "The Luxury Catalog",
  description:
    "The reference for designer handbags: production history, authentication markers, and what they actually resell for, brand by brand.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadCount() : 0;
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-foreground font-sans">
        <Providers>
        <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-serif text-xl tracking-wide text-foreground">
              The Luxury Catalog
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/identify"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Identify
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Search
              </Link>
              <Link
                href="/posts"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                Articles
              </Link>
              {user ? (
                <>
                  <Link
                    href="/feed"
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    Feed
                  </Link>
                  <Link
                    href="/closet"
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    Closet
                  </Link>
                  <Link
                    href="/notifications"
                    className="relative rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    Alerts
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-border px-5 py-8 text-sm text-muted">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-serif text-foreground">The Luxury Catalog</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <Link href="/search" className="hover:text-foreground">Search</Link>
              <Link href="/identify" className="hover:text-foreground">Identify</Link>
              <Link href="/closet" className="hover:text-foreground">Closet</Link>
              <Link href="/closets" className="hover:text-foreground">Coveted closets</Link>
              <Link href="/posts" className="hover:text-foreground">Articles</Link>
              <Link href="/watchlist" className="hover:text-foreground">Watchlist</Link>
              <Link href="/found" className="hover:text-foreground">Log a find</Link>
            </nav>
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
      </body>
    </html>
  );
}
