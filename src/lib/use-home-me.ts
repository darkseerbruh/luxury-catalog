"use client";

import { useEffect, useState } from "react";
import type { ClosetEntry } from "@/lib/collections";
import type { FeedEvent } from "@/lib/feed";
import type { SavedTasteIdentity } from "@/lib/taste-data";
import type { ClosetValue } from "@/lib/portfolio";

export interface HomeMe {
  signedIn: boolean;
  closet: ClosetEntry[];
  feed: FeedEvent[];
  taste: SavedTasteIdentity | null;
  images: Record<number, string>;
  closetValue: ClosetValue | null;
}

const EMPTY: HomeMe = { signedIn: false, closet: [], feed: [], taste: null, images: {}, closetValue: null };

// Module-level singleton so the three homepage islands (style read, activity,
// closet) share ONE /api/home/me request instead of firing three.
let cache: Promise<HomeMe> | null = null;

function load(): Promise<HomeMe> {
  if (!cache) {
    cache = fetch("/api/home/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((d: Partial<HomeMe>) => ({ ...EMPTY, ...d }))
      .catch(() => EMPTY);
  }
  return cache;
}

/** Shared, cached read of the signed-in homepage payload. Returns null until resolved. */
export function useHomeMe(enabled: boolean): { data: HomeMe | null; loading: boolean } {
  const [data, setData] = useState<HomeMe | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading: enabled && data === null };
}
