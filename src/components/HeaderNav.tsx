"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  /** Unread count shown as a badge (Alerts). */
  badge?: number;
  /** Render as the gold call-to-action pill (Log in). */
  cta?: boolean;
};

/**
 * Header navigation. Shows the links inline on desktop (sm+) and collapses
 * them into a hamburger-triggered dropdown on mobile, so the row never has to
 * scroll sideways or overflow the viewport.
 */
export default function HeaderNav({
  signedIn,
  unread,
}: {
  signedIn: boolean;
  unread: number;
}) {
  const [open, setOpen] = useState(false);

  // Close the menu on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links: NavLink[] = [
    { href: "/identify", label: "Identify" },
    { href: "/search", label: "Search" },
    { href: "/quiz", label: "Quiz" },
    { href: "/posts", label: "Articles" },
    ...(signedIn
      ? [
          { href: "/feed", label: "Feed" },
          { href: "/closet", label: "Closet" },
          { href: "/watchlist", label: "Watchlist" },
          { href: "/notifications", label: "Alerts", badge: unread },
          { href: "/profile", label: "Profile" },
        ]
      : [{ href: "/login", label: "Log in", cta: true }]),
  ];

  const close = () => setOpen(false);

  return (
    <>
      {/* Desktop: inline pills */}
      <nav className="hidden items-center gap-2 sm:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              l.cta
                ? "rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
                : "relative rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
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
            {links.map((l) => (
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
