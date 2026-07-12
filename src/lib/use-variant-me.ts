"use client";

import { useEffect, useState } from "react";

export interface VariantMe {
  signedIn: boolean;
  closetStatus: "want" | "have" | "had" | null;
  watching: boolean;
}

const EMPTY: VariantMe = { signedIn: false, closetStatus: null, watching: false };

// Per-variant request cache so the bag page's islands (value module, action
// cluster, sticky bar) share ONE /api/bag/[id]/me request instead of firing three.
const cache = new Map<number, Promise<VariantMe>>();

function load(variantId: number): Promise<VariantMe> {
  let p = cache.get(variantId);
  if (!p) {
    p = fetch(`/api/bag/${variantId}/me`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((d: Partial<VariantMe>) => ({ ...EMPTY, ...d }))
      .catch(() => EMPTY);
    cache.set(variantId, p);
  }
  return p;
}

/**
 * Client read of the signed-in state for one bag. Returns null until resolved so
 * callers render the signed-out shell first (matches the ISR-cached HTML, no
 * hydration mismatch), then correct once the fetch lands. Pass enabled=false to
 * skip the fetch entirely (e.g. before auth resolves).
 */
export function useVariantMe(
  variantId: number,
  enabled = true,
): { data: VariantMe | null; loading: boolean } {
  const [data, setData] = useState<VariantMe | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load(variantId).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [variantId, enabled]);

  return { data, loading: enabled && data === null };
}
