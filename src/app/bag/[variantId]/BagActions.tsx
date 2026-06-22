"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  saveToCloset,
  removeFromCloset,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/collection-actions";
import { track, EVENTS } from "@/lib/analytics/events";

const STATUS_LABELS: { value: "want" | "have" | "had"; label: string }[] = [
  { value: "want", label: "Want it" },
  { value: "have", label: "Have it" },
  { value: "had", label: "Had it" },
];

/**
 * The bag-page decision cluster — placed directly under the value summary so the
 * money moments sit at the top, not 600 lines down. Three jobs in one block:
 *  - closet intent (want / have / had) + price watch — the indirect signals that
 *    feed every revenue stream (want→buyer, had→consignor referral);
 *  - the two primary outbound CTAs (Where to buy, Where to sell);
 *  - contextual bridges that route intent to its revenue moment — most importantly
 *    had → "where to sell" (the consignor referral, the model's biggest swing).
 */
export default function BagActions({
  variantId,
  signedIn,
  hasBuyLinks,
  hasSellLinks,
  initialClosetStatus,
  initialWatching,
}: {
  variantId: number;
  signedIn: boolean;
  hasBuyLinks: boolean;
  hasSellLinks: boolean;
  initialClosetStatus: string | null;
  initialWatching: boolean;
}) {
  const [closetStatus, setClosetStatus] = useState<string | null>(initialClosetStatus);
  const [watching, setWatching] = useState(initialWatching);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleCloset(status: "want" | "have" | "had") {
    setError(null);
    startTransition(async () => {
      // Clicking the active status removes it from the closet.
      if (closetStatus === status) {
        const res = await removeFromCloset(variantId);
        if (res.ok) setClosetStatus(null);
        else setError(res.error ?? "Something went wrong.");
        return;
      }
      const res = await saveToCloset(variantId, status);
      if (res.ok) {
        setClosetStatus(status);
        track(EVENTS.itemSaved, { variant_id: variantId, status });
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  function toggleWatch() {
    setError(null);
    startTransition(async () => {
      const res = watching ? await removeFromWatchlist(variantId) : await addToWatchlist(variantId);
      if (res.ok) {
        if (!watching) track(EVENTS.itemSaved, { variant_id: variantId, kind: "watchlist" });
        setWatching(!watching);
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  // Primary outbound CTAs — buy is the affiliate floor, sell is the
  // consignor-referral ceiling. Sell leads when the user already had the bag.
  const buyCta = hasBuyLinks ? (
    <button
      key="buy"
      type="button"
      onClick={() => jumpTo("where-to-buy")}
      className="flex-1 rounded-full bg-gold px-5 py-3 text-center text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
    >
      Where to buy →
    </button>
  ) : null;
  const sellCta = hasSellLinks ? (
    <button
      key="sell"
      type="button"
      onClick={() => jumpTo("where-to-sell")}
      className={`flex-1 rounded-full px-5 py-3 text-center text-sm font-medium transition-colors ${
        closetStatus === "had"
          ? "bg-gold text-bg hover:bg-gold-soft"
          : "border border-gold/60 text-gold hover:bg-gold/10"
      }`}
    >
      Where to sell →
    </button>
  ) : null;
  // had → lead with Sell; otherwise Buy is the default primary.
  const ctas = closetStatus === "had" ? [sellCta, buyCta] : [buyCta, sellCta];

  return (
    <section id="your-move" className="scroll-mt-4 border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">Make it yours — or move it on</h2>

      {signedIn ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted/70">In your closet</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_LABELS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleCloset(s.value)}
                  disabled={pending}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    closetStatus === s.value
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted hover:border-gold hover:text-gold"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={toggleWatch}
                disabled={pending}
                className={`rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  watching
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted hover:border-gold hover:text-gold"
                }`}
              >
                {watching ? "★ Watching price" : "☆ Watch price"}
              </button>
            </div>
          </div>

          {(buyCta || sellCta) && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
              {ctas}
            </div>
          )}

          {/* Route the closet signal to its revenue moment. */}
          {closetStatus === "had" && hasSellLinks && (
            <p className="text-sm text-muted">
              Parting with it?{" "}
              <button type="button" onClick={() => jumpTo("where-to-sell")} className="text-gold hover:underline">
                See where to sell it
              </button>{" "}
              — buyout for cash, or consign for more.
            </p>
          )}
          {closetStatus === "want" && (
            <p className="text-sm text-muted">
              {watching ? (
                <>We&rsquo;ll watch the price and tell you when it dips on your{" "}
                <Link href="/watchlist" className="text-gold hover:underline">watchlist</Link>.</>
              ) : (
                <>Want it at the right price?{" "}
                <button type="button" onClick={toggleWatch} disabled={pending} className="text-gold hover:underline disabled:opacity-40">
                  Watch the price
                </button>{" "}and we&rsquo;ll track it for you.</>
              )}
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Save it to your closet, or watch the price and we&rsquo;ll track it for you.
            </p>
            <Link
              href="/login"
              className="shrink-0 rounded-full bg-gold px-5 py-2.5 text-center text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
            >
              Log in to save
            </Link>
          </div>
          {(buyCta || sellCta) && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
              {ctas}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
