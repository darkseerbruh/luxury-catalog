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

/** A top-level item that is itself a link but also reveals a dropdown. */
const SHOP_MENU: NavLink[] = [
  { href: "/deals", label: "Deals" },
  { href: "/coveted", label: "Coveted" },
  { href: "/browse", label: "Browse" },
];

const DISCOVER_MENU: NavLink[] = [
  { href: "/identify", label: "Identify" },
  { href: "/quiz", label: "Quiz" },
  { href: "/posts", label: "Articles" },
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
}: {
  signedIn: boolean;
  unread: number;
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

  const accountLinks: NavLink[] = signedIn
    ? [
        { href: "/feed", label: "Feed" },
        { href: "/closet", label: "Closet" },
        { href: "/watchlist", label: "Watchlist" },
        { href: "/notifications", label: "Alerts", badge: unread },
        { href: "/profile", label: "Profile" },
      ]
    : [{ href: "/login", label: "Log in", cta: true }];

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
              {SHOP_MENU.map((l) => (
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

        {/* Search — reveals an inline query box */}
        <div className="relative flex items-center">
          {searchOpen ? (
            <form action="/search" method="GET" className="flex items-center gap-1">
              <input
                ref={searchInputRef}
                name="q"
                type="search"
                placeholder="Search bags…"
                onBlur={() => setSearchOpen(false)}
                className="w-48 rounded-full border border-gold bg-surface px-4 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`${pillBase} inline-flex items-center`}
            >
              Search
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

        {/* Account / auth */}
        {accountLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              l.cta
                ? "rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
                : `${pillBase} ${isActive(l.href) ? pillActive : ""}`
            }
          >
            {l.label}
            {l.badge != null && l.badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                {l.badge > 9 ? "9+" : l.badge}
              </span>
            )}
          </Link>
        ))}
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
            {SHOP_MENU.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
              >
                {l.label}
              </Link>
            ))}

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
            {accountLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className={
                  l.cta
                    ? "mt-1 rounded-full bg-gold px-4 py-2.5 text-center text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
                    : "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                }
              >
                <span>{l.label}</span>
                {l.badge != null && l.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                    {l.badge > 9 ? "9+" : l.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </>
      )}
    </>
  );
}
