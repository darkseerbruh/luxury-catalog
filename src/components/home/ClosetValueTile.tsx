"use client";

import { useAuthState } from "@/components/AuthProvider";
import { useHomeMe } from "@/lib/use-home-me";

/**
 * The visual inside the "Collect & invest" home tile. Signed-out (and until the
 * personalization fetch resolves): the want-led illustration. Signed-in with
 * priced bags: their real estimated resale total (only bags with resale history
 * are counted — never fabricated). Client-side so the tile can live on the now
 * static homepage.
 */
function formatPrice(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

function Bag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h16l-1.2 11.2a1 1 0 0 1-1 .8H6.2a1 1 0 0 1-1-.8L4 8z" />
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
    </svg>
  );
}

export default function ClosetValueTile() {
  const { signedIn } = useAuthState();
  const { data } = useHomeMe(signedIn);
  const closetValue = signedIn ? data?.closetValue ?? null : null;

  if (closetValue) {
    return (
      <div className="mt-4 flex flex-1 flex-col justify-center">
        <p className="font-serif text-3xl text-gold">
          {formatPrice(closetValue.total, closetValue.currency)}
        </p>
        <p className="mt-1 text-xs text-muted">
          estimated resale across {closetValue.valued} of {closetValue.count}{" "}
          {closetValue.count === 1 ? "bag" : "bags"} you own
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-1 items-center justify-center gap-3">
      <Bag className="h-12 w-12 text-gold/50" />
      <div className="relative">
        <Bag className="h-16 w-16 text-gold" />
        <svg viewBox="0 0 24 24" className="absolute -right-1 -top-1 h-6 w-6 text-gold-soft" fill="currentColor" aria-hidden>
          <path d="M12 21s-7-4.6-9.4-8.6C1 10 2.6 6.6 6 6.6c2 0 3.1 1.3 4 2.6 0.9-1.3 2-2.6 4-2.6 3.4 0 5 3.4 3.4 5.8C19 16.4 12 21 12 21z" />
        </svg>
      </div>
      <Bag className="h-12 w-12 text-gold/70" />
    </div>
  );
}
