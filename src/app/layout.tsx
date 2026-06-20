import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import Link from "next/link";
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
    "The definitive reference database for designer handbags — production history, authentication markers, and resale intelligence across every brand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-foreground font-sans">
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
                href="/me/bags"
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                My Bags
              </Link>
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
              <Link href="/me/bags" className="hover:text-foreground">My Bags</Link>
            </nav>
            <p className="text-muted/60">
              The definitive reference for designer handbags.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
