"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthState } from "@/components/AuthProvider";
import { BagFinder } from "@/components/BagFinder";

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
  { href: "/authentication/check", label: "Check a listing" },
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

/**
 * Header navigation (IA rework 2026-06-30).
 *
 * Desktop primary row, left to right: **Authentication** (Learn/Check/Verify),
 * **Style Quiz**, **Articles** (the Journal), **Profile**, and the **Search**
 * field pinned rightmost. Search reveals a shortcuts dropdown (Deals + brands by
 * tier + All brands) on hover — it absorbs the old Shop and Brands menus. Discover
 * is dissolved (Identify moved under Authentication). Mobile: a hamburger panel
 * with the same sections.
 */
export default function HeaderNav({
  brandGroups = [],
  covetedReady = false,
}: {
  brandGroups?: BrandGroup[];
  /** Show the "Coveted" entry only once there's enough want-signal (content gate). */
  covetedReady?: boolean;
}) {
  // Signed-in state, unread badge, and the notifications preview are resolved
  // client-side (AuthProvider) so the root layout can stay cookieless + static.
  const { signedIn, unread, notifications } = useAuthState();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // "Typing" = opened with intent to search (click / focus), so the field autofocuses
  // and a mouse-leave won't yank the panel. A pure hover just browses the brands.
  const [searchTyping, setSearchTyping] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Typing mode closes on a click OUTSIDE the search area. A document listener
  // (not a fixed overlay) because the header's backdrop-blur makes it the
  // containing block for fixed children — an "inset-0" overlay would only ever
  // cover the header bar. This also lets the outside click land normally.
  useEffect(() => {
    if (!searchTyping) return;
    const onPointerDown = (e: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchTyping(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchTyping]);

  useEffect(() => {
    if (!open && !searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchOpen(false);
        setSearchTyping(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, searchOpen]);

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    return base === "/" ? pathname === "/" : pathname.startsWith(base);
  };

  // Coveted (most-coveted bags) stays hidden until there's enough want-signal.
  const profileMenu: NavLink[] = [
    ...PROFILE_MENU,
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

        {/* Style Quiz — plain link */}
        <Link
          href="/quiz"
          className={`${pillBase} ${isActive("/quiz") ? pillActive : ""}`}
        >
          Style Quiz
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
              <div className="flex w-72 flex-col gap-1 rounded-2xl border border-border bg-bg/95 p-2 shadow-lg backdrop-blur-sm">
                {/* Notifications preview — the glance lives here, not on its own
                    page. Full history + mark-all-read stay behind "See all". */}
                <div className="mb-1 flex items-center justify-between px-3 pt-1">
                  <span className="text-[10px] uppercase tracking-widest text-muted/70">Notifications</span>
                  <Link href="/notifications" className="text-[11px] text-gold hover:text-gold-soft">See all</Link>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-3 pb-2 text-xs text-muted/70">Nothing new.</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      className="flex items-start gap-2 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-gold"}`} aria-hidden />
                      <span className="line-clamp-2 leading-snug">{n.title}</span>
                    </Link>
                  ))
                )}
                <div className="my-1 border-t border-border" />
                {profileMenu.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                  >
                    <span>{l.label}</span>
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

        {/* Search — pinned rightmost. ONE field (owner 2026-07-19): the nav slot IS
            the text input — click it and type right there. Hovering opens the panel
            BELOW the field (never covering the rest of the nav) with browse-by-brand;
            typed matches stack above the brands. Mouse leaving closes a hover-open;
            once she's clicked into the field it takes a click outside (or Esc). */}
        <div
          ref={searchRef}
          className="group relative flex items-center"
          onMouseEnter={() => setSearchOpen(true)}
          onMouseLeave={() => {
            if (!searchTyping) setSearchOpen(false);
          }}
          onFocusCapture={() => {
            setSearchTyping(true);
            setSearchOpen(true);
          }}
        >
          <div className="relative z-30 w-48">
            <BagFinder
              mode="nav"
              placeholder="Search bags"
              inputClassName="w-full rounded-full border border-border bg-surface py-1.5 pl-9 pr-4 text-sm text-muted transition-colors placeholder:text-muted hover:border-gold hover:text-gold focus:border-gold focus:text-gold focus:outline-none"
              panelOpen={searchOpen}
              panelClassName="absolute right-0 top-full z-30 mt-2 w-[32rem] max-w-[92vw] rounded-2xl border border-border bg-bg/95 p-3 shadow-lg backdrop-blur-sm"
              onNavigate={() => {
                setSearchOpen(false);
                setSearchTyping(false);
              }}
              onSubmitQuery={(term) => {
                const t = term.trim();
                if (t) {
                  router.push(`/shop?q=${encodeURIComponent(t)}`);
                  setSearchOpen(false);
                  setSearchTyping(false);
                }
              }}
              browseFooter={
                    // Pre-search: browse by tier only. "Shop the market / Deals only"
                    // dropped from here (owner UX review 0714 #4) — someone who opened
                    // search came to type, not to be handed two other destinations.
                    brandGroups.length > 0 ? (
                      <div className="pt-1">
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
                      </div>
                    ) : null
              }
            />
          </div>
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
          <nav className="absolute inset-x-0 top-full z-20 flex max-h-[calc(100dvh-57px)] flex-col gap-1 overflow-y-auto overscroll-contain border-b border-border bg-bg px-5 py-3 shadow-lg sm:hidden">
            {/* Search — same BagFinder as desktop, but collapsed to just the field
                until it's tapped (opening the menu shows the MENU, not a grid), then
                capped to 4 suggestions with a "View all results" hand-off. The panel
                is opaque (no /95) so page copy can't ghost through on mobile. */}
            <div className="mb-2">
              <BagFinder
                mode="nav"
                collapsedUntilFocus
                maxModels={4}
                onNavigate={close}
                onViewAll={(term) => {
                  const t = term.trim();
                  router.push(t ? `/shop?q=${encodeURIComponent(t)}` : "/shop");
                  close();
                }}
                onSubmitQuery={(term) => {
                  const t = term.trim();
                  if (t) {
                    router.push(`/shop?q=${encodeURIComponent(t)}`);
                    close();
                  }
                }}
              />
            </div>

            {/* Authentication */}
            <Link href="/authentication" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
              Authentication
            </Link>
            {AUTH_MENU.filter((l) => l.href !== "/authentication").map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
                {l.label}
              </Link>
            ))}

            {/* Style Quiz */}
            <Link href="/quiz" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
              Style Quiz
            </Link>

            {/* Articles */}
            <Link href="/articles" onClick={close} className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface hover:text-gold">
              Articles
            </Link>

            {/* Shop shortcuts */}
            <p className="mt-2 px-3 pt-1 text-xs uppercase tracking-wide text-muted/70">Shop</p>
            <Link href="/shop" onClick={close} className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
              Shop the market
            </Link>
            <Link href="/deals" onClick={close} className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
              Deals only
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
                    className="rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold"
                  >
                    {l.label}
                  </Link>
                ))}
                <Link href="/notifications" onClick={close} className="flex items-center justify-between rounded-xl px-3 py-2.5 pl-6 text-sm text-muted transition-colors hover:bg-surface hover:text-gold">
                  <span>Notifications</span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-medium text-bg">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
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
