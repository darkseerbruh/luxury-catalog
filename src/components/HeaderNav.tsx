"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  /** Unread count shown as a badge (Alerts). */
  badge?: number;
  /** Render as the gold call-to-action pill (Log in). */
  cta?: boolean;
};

type BrandGroup = { label: string; brands: { brandId: number; name: string }[] };

/** A top-level item that is itself a link but also reveals a dropdown. */
const SHOP_MENU: NavLink[] = [
  { href: "/deals", label: "Deals" },
  { href: "/coveted", label: "Coveted" },
  { href: "/browse", label: "Browse" },
];

const DISCOVER_MENU: NavLink[] = [
  { href: "/identify", label: "Identify" },
  { href: "/quiz", label: "Quiz" },
  { href: "/articles", label: "Articles" },
];

/** Signed-in account surfaces, tucked under the Profile dropdown to keep the
 *  top-level row short. Alerts carries the unread badge. */
const PROFILE_MENU: NavLink[] = [
  { href: "/feed", label: "Feed" },
  { href: "/closet", label: "Closet" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/notifications", label: "Alerts" },
];

const pillBase =
  "relative rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold";
const pillActive = "border-gold text-gold";

function Caret() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="ml-1 inline-block -translate-y-px"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/**
 * Header navigation.
 *
 * Desktop (sm+): three primary entry points — a clickable **Shop** with a
 * hover/focus dropdown (Deals · Coveted · Browse), an inline **Search** box,
 * and a **Discover** dropdown (Identify · Quiz · Articles) — followed by the
 * account links. Mobile: everything collapses into a hamburger panel where the
 * dropdowns become labelled sections (hover doesn't exist on touch).
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close the mobile menu on Escape for keyboard users.
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

  // Focus the search field when it opens.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // "Coveted" (most-coveted bags) stays hidden until there's enough want-signal.
  const shopMenu = SHOP_MENU.filter((l) => l.href !== "/coveted" || covetedReady);

  // Alerts badge follows the Alerts item inside the Profile dropdown.
  const profileMenu: NavLink[] = PROFILE_MENU.map((l) =>
    l.href === "/notifications" ? { ...l, badge: unread } : l,
  );

  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop: inline pills + dropdowns */}
      <nav className="hidden items-center gap-2 sm:flex">
        {/* Shop — clickable, with hover/focus dropdown */}
        <div className="group relative">
          <Link
            href="/shop"
            className={`${pillBase} ${isActive("/shop") ? pillActive : ""} inline-flex items-center`}
          >
            Shop
            <Caret />
          </Link>
          <div className="invisible absolute left-0 top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            <div className="flex min-w-40 flex-col gap-1 rounded-2xl border border-border bg-bg/95 p-2 shadow-lg backdrop-blur-sm">
              {shopMenu.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Brands — clickable, with a tier-grouped mega-menu */}
        {brandGroups.length > 0 && (
          <div className="group relative">
            <Link
              href="/brands"
              className={`${pillBase} ${isActive("/brand") || isActive("/brands") ? pillActive : ""} inline-flex items-center`}
            >
              Brands
              <Caret />
            </Link>
            <div className="invisible absolute left-0 top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="w-[34rem] max-w-[90vw] rounded-2xl border border-border bg-bg/95 p-4 shadow-lg backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-x-5 gap-y-4">
                  {brandGroups.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs uppercase tracking-widest text-muted/70">
                        {group.label}
                      </p>
                      <div className="mt-2 flex flex-col gap-1">
                        {group.brands.map((b) => (
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
              </div>
            </div>
          </div>
        )}

        {/* Search — a click-into field (not an outline pill): it reads as a
            search box, with a magnifier + muted placeholder, and expands to a
            real input on click. */}
        <div className="relative flex items-center">
          {searchOpen ? (
            <form action="/search" method="GET" className="flex items-center gap-1">
              <input
                ref={searchInputRef}
                name="q"
                type="search"
                placeholder="Search bags…"
                onBlur={() => setSearchOpen(false)}
                className="w-52 rounded-full border border-gold bg-surface px-4 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search bags"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              <SearchIcon className="flex-shrink-0" />
              <span>Search bags</span>
            </button>
          )}
        </div>

        {/* Discover — dropdown only */}
        <div className="group relative">
          <button
            type="button"
            className={`${pillBase} inline-flex items-center ${
              DISCOVER_MENU.some((l) => isActive(l.href)) ? pillActive : ""
            }`}
          >
            Discover
            <Caret />
          </button>
          <div className="invisible absolute left-0 top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            <div className="flex min-w-40 flex-col gap-1 rounded-2xl border border-border bg-bg/95 p-2 shadow-lg backdrop-blur-sm">
              {DISCOVER_MENU.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Account / auth. Signed in: a single Profile entry (clickable →
            /profile) that tucks Feed · Closet · Watchlist · Alerts into a
            dropdown, keeping the top-level row short. The Alerts badge is
            mirrored on the Profile trigger so unread isn't buried. */}
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
            <div className="invisible absolute right-0 top-full z-20 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
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
          <div
            className="fixed inset-0 top-[57px] z-10 bg-bg/60 sm:hidden"
            aria-hidden="true"
            onClick={close}
          />
          <nav className="absolute inset-x-0 top-full z-20 flex flex-col gap-1 border-b border-border bg-bg/95 px-5 py-3 shadow-lg backdrop-blur-sm sm:hidden">
            {/* Search box */}
            <form action="/search" method="GET" className="mb-2" onSubmit={close}>
              <input
                name="q"
                type="search"
                placeholder="Search bags…"
                className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </form>

            {/* Shop section */}
            <Link
              href="/shop"
              onClick={close}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold"
            >
              Shop
            </Link>
            {shopMenu.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
              >
                {l.label}
              </Link>
            ))}

            {/* Brands — single link to the full directory (keeps the mobile menu lean) */}
            {brandGroups.length > 0 && (
              <Link
                href="/brands"
                onClick={close}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold"
              >
                Brands
              </Link>
            )}

            {/* Discover section */}
            <p className="mt-2 px-3 pt-1 text-xs uppercase tracking-wide text-muted/70">
              Discover
            </p>
            {DISCOVER_MENU.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
              >
                {l.label}
              </Link>
            ))}

            {/* Account section */}
            <div className="mt-2 border-t border-border pt-2" />
            {signedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={close}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold"
                >
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
              <Link
                href="/login"
                onClick={close}
                className="mt-1 rounded-full bg-gold px-4 py-2.5 text-center text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
              >
                Log in
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
