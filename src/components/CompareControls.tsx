"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { track, EVENTS } from "@/lib/analytics/events";

/**
 * Compare set, persisted in localStorage so it survives navigation between bag
 * pages (analytics-strategy.md G2 — the side-by-side decision Sofia/the
 * Cross-Shopper make). Renders the per-bag add toggle plus a floating tray that
 * links to /compare once two or more bags are picked.
 *
 * Backed by useSyncExternalStore: localStorage is the external store, with a
 * cached snapshot keyed on the raw string so getSnapshot is stable.
 */

const KEY = "lc:compare";
const MAX = 4;

interface CompareEntry {
  id: number;
  label: string;
}

const EMPTY: CompareEntry[] = [];
let cached: CompareEntry[] = EMPTY;
let cachedRaw = "\u0000"; // sentinel that no real value equals

function parse(raw: string): CompareEntry[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const out = parsed.filter(
      (e): e is CompareEntry => typeof e?.id === "number" && typeof e?.label === "string",
    );
    return out.length === 0 ? EMPTY : out;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): CompareEntry[] {
  if (typeof window === "undefined") return EMPTY;
  let raw = "";
  try {
    raw = localStorage.getItem(KEY) ?? "";
  } catch {
    raw = "";
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = raw ? parse(raw) : EMPTY;
  return cached;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("lc:compare-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("lc:compare-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function setEntries(entries: CompareEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Private mode / quota — the tray just won't persist.
  }
  window.dispatchEvent(new Event("lc:compare-changed"));
}

/**
 * The add/remove toggle alone (no tray). `compact` renders a small chip that
 * fits on shop/search cards so the compare set can be assembled without
 * opening every candidate's full page.
 */
export function CompareToggle({
  variantId,
  label,
  compact = false,
  className = "",
}: {
  variantId: number;
  label: string;
  compact?: boolean;
  className?: string;
}) {
  const entries = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const inSet = entries.some((e) => e.id === variantId);
  const atMax = entries.length >= MAX && !inSet;

  function toggle() {
    if (inSet) setEntries(entries.filter((e) => e.id !== variantId));
    else if (!atMax) setEntries([...entries, { id: variantId, label }]);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={atMax}
        aria-pressed={inSet}
        aria-label={inSet ? `Remove ${label} from compare` : `Add ${label} to compare`}
        className={`rounded-full border border-border bg-bg/70 px-2.5 py-1 text-xs text-muted backdrop-blur transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-gold aria-pressed:bg-gold/15 aria-pressed:text-gold ${className}`}
      >
        {inSet ? "✓ Comparing" : "+ Compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={atMax}
      aria-pressed={inSet}
      className={`inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-gold disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-gold aria-pressed:bg-gold/10 ${className}`}
    >
      {inSet ? "Added to compare" : atMax ? "Compare is full (4)" : "Add to compare"}
    </button>
  );
}

/**
 * The floating tray linking to /compare. Render once per page. On the bag page
 * pass `raisedOnMobile` so it sits above the StickyActionBar (both used to pin
 * to bottom-0 z-40 and the bar painted over the tray's only /compare link).
 */
export function CompareTray({ raisedOnMobile = false }: { raisedOnMobile?: boolean }) {
  const entries = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const ids = entries.map((e) => e.id).join(",");

  return (
    <>
      {entries.length > 0 && (
        <div
          className={`fixed inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur ${raisedOnMobile ? "bottom-14 sm:bottom-0" : "bottom-0"}`}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
            <span className="text-sm text-muted">
              Comparing {entries.length} {entries.length === 1 ? "bag" : "bags"}
            </span>
            <div className="flex flex-wrap gap-2">
              {entries.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-foreground"
                >
                  {e.label}
                  <button
                    type="button"
                    onClick={() => setEntries(entries.filter((x) => x.id !== e.id))}
                    aria-label={`Remove ${e.label} from compare`}
                    className="text-muted hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEntries([])}
                className="text-xs text-muted hover:text-foreground"
              >
                Clear
              </button>
              {entries.length >= 2 ? (
                <Link
                  href={`/compare?ids=${ids}`}
                  onClick={() =>
                    track(EVENTS.bagsCompared, { count: entries.length, variant_ids: ids, source: "tray" })
                  }
                  className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
                >
                  Compare {entries.length} bags
                </Link>
              ) : (
                <span className="text-xs text-muted">Add one more to compare</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Bag-page composite: the full-size toggle plus the (raised-on-mobile) tray. */
export default function CompareControls({
  variantId,
  label,
}: {
  variantId: number;
  label: string;
}) {
  return (
    <>
      <CompareToggle variantId={variantId} label={label} />
      <CompareTray raisedOnMobile />
    </>
  );
}
