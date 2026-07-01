"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  /** Unread count shown as a badge (Alerts). */
  badge?: number;
};

type BrandGroup = { label: string; brands: { brandId: number; name: string }[] };

/** Authentication section (its own primary entry): Learn the markers, Check it
 * yourself, Verify with a pro. The section landing is /authentication. */
const AUTH_MENU: NavLink[] = [
  { href: "/authentication", label: "The guides" },
  { href: "/identify", label: "Spot the Fake (photo)" },
  { href: "/authenticate", label: "Get it authenticated" },
];

/** Articles ("The Journal" on-page) — the non-authentication editorial. */
const ARTICLES_MENU: NavLink[] = [
  { href: "/articles?department=value", label: "What it's worth" },
  { href: "/articles?department=comparisons", label: "Comparisons" },
  { href: "/articles?department=market", label: "Market report" },
  { href: "/articles", label: "All articles" },
];

/** Signed-in account surfaces, under the Profile dropdown. Alerts carries the
 * unread badge. Watchlist is gone — it is the Closet's "Want" now. */
const PROFILE_MENU: NavLink[] = [
  { href: "/feed", label: "Feed" },
  { href: "/closet", label: "Closet" },
  { href: "/notifications", label: "Alerts" },
];

/** How many brands to show per tier in the Search shortcuts before "All brands". */
const BRANDS_PER_TIER = 5;

const pillBase =
  "relative rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold";
const pillActive = "border-gold text-gold";
const menuPanel =
  "invisible absolute top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";
const menuItem =
  "rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold";

function Caret() {
  return (
    <svg
      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="ml-1 inline-block -translate-y-px"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/**
 * Header navigation (IA rework 2026-06-30).
 *
 * Desktop primary row, left to right: **Authentication** (Learn/Check/Verify),
 * **Style Read**, **Articles** (the Journal), **Profile**, and the **Search**
 * field pinned rightmost. Search reveals a shortcuts dropdown (Deals + brands by
 * tier + All brands) on hover — it absorbs the old Shop and Brands menus. Discover
 * is dissolved (Identify moved under Authentication). Mobile: a hamburger panel
 * with the same sections.
 */
export default function HeaderNav({
  signedIn,
  unread,
  brandGroups = [],
  covetedReady = false,
}: {
  signedIn: boolean;
  unread: number;
  brandGroups?: BrandGroup[];
  /** Show the "Coveted" entry only once there's enough want-signal (content gate). */
  covetedReady?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<{ label: string; sub: string; href: string }[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced autocomplete: fetch example matches (brands, bags, articles) as the
  // user types. All state updates happen in the deferred callback (not the effect
  // body). Aborts in-flight requests; clears under 2 chars.
  useEffect(() => {
    const term = q.trim();
    const ctl = new AbortController();
    const t = setTimeout(() => {
      if (term.length < 2) {
        setSuggestions([]);
        return;
      }
      fetch(`/api/search-suggest?q=${encodeURIComponent(term)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => setSuggestions(d.suggestions ?? []))
        .catch(() => {});
    }, 160);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!open && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, searchOpen]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  };

  // Coveted (most-coveted bags) stays hidden until there's enough want-signal.
  const profileMenu: NavLink[] = [
    ...PROFILE_MENU.map((l) => (l.href === "/notifications" ? { ...l, badge: unread } : l)),
    ...(covetedReady ? [{ href: "/coveted", label: "Coveted" }] : []),
  ];

  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop: inline pills + dropdowns */}
      <nav className="hidden items-center gap-2 sm:flex">
        {/* Authentication — clickable section landing + Learn/Check/Verify menu */}
        <div className="group relative">
          <Link
            href="/authentication"
            className={`${pillBase} ${isActive("/authentication") ? pillActive : ""} inline-flex items-center`}
          >
            Authentication
            <Caret />
          </Link>
          <div className={`${menuPanel} left-0`}>
            <div className="flex min-w-52 flex-col gap-1 rounded-2xl border border-border bg-bg/95 p-2 shadow-lg backdrop-blur-sm">
              {AUTH_MENU.map((l) => (
                <Link key={l.href} href={l.href} className={menuItem}>{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Style Read — plain link */}
        <Link
          href="/quiz"
          className={`${pillBase} ${isActive("/quiz") ? pillActive : ""}`}
        >
          Style Read
        </Link>

        {/* Articles (the Journal) — clickable + department menu */}
        <div className="group relative">
          <Link
            href="/articles"
            className={`${pillBase} ${isActive("/articles") ? pillActive : ""} inline-flex items-center`}
          >
            Articles
            <Caret />
          </Link>
          <div className={`${menuPanel} left-0`}>
            <div className="flex min-w-48 flex-col gap-1 rounded-2xl border border-border bg-bg/95 p-2 shadow-lg backdrop-blur-sm">
              {ARTICLES_MENU.map((l) => (
                <Link key={l.href} href={l.href} className={menuItem}>{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Account — signed in: Profile + dropdown; else Log in. */}
        {signedIn ? (
          <div className="group relative">
            <Link
              href="/profile"
              className={`${pillBase} ${isActive("/profile") ? pillActive : ""} inline-flex items-center`}
            >
              Profile
              <Caret />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <div className={`${menuPanel} right-0`}>
              <div className="flex min-w-44 flex-col gap-1 rounded-2xl border border-border bg-bg/95 p-2 shadow-lg backdrop-blur-sm">
                {profileMenu.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                  >
                    <span>{l.label}</span>
                    {l.badge != null && l.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                        {l.badge > 9 ? "9+" : l.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Log in
          </Link>
        )}

        {/* Search — pinned rightmost. Hover reveals a shortcuts dropdown (Deals +
            brands by tier + All brands), absorbing the old Shop and Brands menus.
            Click expands the field into a real input. */}
        <div className="group relative flex items-center">
          {searchOpen ? (
            <div className="relative">
              <form action="/search" method="GET" className="flex items-center gap-1">
                <input
                  ref={searchInputRef}
                  name="q"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search bags…"
                  onBlur={() => setTimeout(() => setSearchOpen(false), 160)}
                  className="w-56 rounded-full border border-gold bg-surface px-4 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
              </form>
              {suggestions.length > 0 && (
                <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-bg/95 p-1.5 shadow-lg backdrop-blur-sm">
                  {suggestions.map((s) => (
                    <Link
                      key={`${s.sub}-${s.href}`}
                      href={s.href}
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                    >
                      <span className="truncate">{s.label}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted/60">{s.sub}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search bags"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              <SearchIcon className="flex-shrink-0" />
              <span>Search bags</span>
              <Caret />
            </button>
          )}
          {!searchOpen && (
            <div className={`${menuPanel} right-0`}>
              <div className="w-[32rem] max-w-[90vw] rounded-2xl border border-border bg-bg/95 p-4 shadow-lg backdrop-blur-sm">
                <Link href="/deals" className="flex items-center justify-between rounded-xl px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
                  <span>Deals</span>
                  <span className="text-[11px] uppercase tracking-widest text-gold">Best prices</span>
                </Link>
                {brandGroups.length > 0 && (
                  <>
                    <div className="my-2 border-t border-border" />
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                      {brandGroups.map((group) => (
                        <div key={group.label}>
                          <p className="text-xs uppercase tracking-widest text-muted/70">{group.label}</p>
                          <div className="mt-1.5 flex flex-col gap-0.5">
                            {group.brands.slice(0, BRANDS_PER_TIER).map((b) => (
                              <Link
                                key={b.brandId}
                                href={`/brand/${b.brandId}`}
                                className="rounded-lg px-1.5 py-1 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                              >
                                {b.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      href="/brands"
                      className="mt-3 block border-t border-border pt-3 text-sm text-gold transition-colors hover:text-gold-soft"
                    >
                      All brands →
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile: hamburger toggle */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-gold hover:text-gold sm:hidden"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
        {!open && signedIn && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Mobile: dropdown panel */}
      {open && (
        <>
          <div className="fixed inset-0 top-[57px] z-10 bg-bg/60 sm:hidden" aria-hidden="true" onClick={close} />
          <nav className="absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-border bg-bg/95 px-5 py-3 shadow-lg backdrop-blur-sm sm:hidden">
            {/* Search */}
            <form action="/search" method="GET" className="mb-2" onSubmit={close}>
              <input
                name="q"
                type="search"
                placeholder="Search bags…"
                className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </form>

            {/* Authentication */}
            <Link href="/authentication" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
              Authentication
            </Link>
            {AUTH_MENU.filter((l) => l.href !== "/authentication").map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
                {l.label}
              </Link>
            ))}

            {/* Style Read */}
            <Link href="/quiz" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
              Style Read
            </Link>

            {/* Articles */}
            <Link href="/articles" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
              Articles
            </Link>

            {/* Shop shortcuts */}
            <p className="mt-2 px-3 pt-1 text-xs uppercase tracking-wide text-muted/70">Shop</p>
            <Link href="/deals" onClick={close} className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
              Deals
            </Link>
            {brandGroups.length > 0 && (
              <Link href="/brands" onClick={close} className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
                All brands
              </Link>
            )}

            {/* Account */}
            <div className="mt-2 border-t border-border pt-2" />
            {signedIn ? (
              <>
                <Link href="/profile" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
                  Profile
                </Link>
                {profileMenu.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                  >
                    <span>{l.label}</span>
                    {l.badge != null && l.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                        {l.badge > 9 ? "9+" : l.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </>
            ) : (
              <Link href="/login" onClick={close} className="mt-1 rounded-full bg-gold px-4 py-2.5 text-center text-sm font-medium text-bg transition-colors hover:bg-gold-soft">
                Log in
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
