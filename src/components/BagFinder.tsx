"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BagImage } from "@/components/BagImage";
import RequestBagForm from "@/app/search/RequestBagForm";
import type { FinderModel, FinderColour } from "@/lib/bag-finder";

/**
 * The ONE bag-finder used in the nav and for adding to your closet
 * (docs/ux/unified-search-and-review-spec.md). Focus it and a grid of models is
 * already there (populate on focus); type to narrow; a model opens its colourways
 * so an owner picks the colour by sight. Only the click DESTINATION differs:
 * - nav → opens the bag's page (/bag/[variantId])
 * - closet → fires onSelect(selection) for the Want/Have/Had fork
 */

export interface BagFinderSelection {
  styleId: number;
  styleName: string;
  brand: string;
  /** Representative variant of the chosen colour, or the model hero for "Not sure". */
  variantId: number | null;
  /** Chosen colourway, or null when the owner picked "Not sure". */
  colourName: string | null;
}

interface Props {
  mode: "nav" | "closet";
  /** Closet mode: called when a bag (and colour) is chosen. */
  onSelect?: (sel: BagFinderSelection) => void;
  /** Override the input placeholder (else a mode-appropriate default). */
  placeholder?: string;
  /** Show the "can't find it? ask us to add it" request flow (default true). */
  allowRequest?: boolean;
  /** Optional: Enter on the field submits the raw query (e.g. nav → full /search). */
  onSubmitQuery?: (query: string) => void;
  /** Nav mode: fired after a tile click routes away, so a host menu can close. */
  onNavigate?: () => void;
  autoFocus?: boolean;
  /** Cap the suggestion grid to this many tiles (mobile keeps the menu short + scrollable). */
  maxModels?: number;
  /** Show a "View all results" CTA under the grid that hands off to the full search page. */
  onViewAll?: (query: string) => void;
  /**
   * Render ONLY the input until the field is focused (mobile menu: the grid must
   * never sit between the owner and the rest of the menu). Once engaged, the
   * suggestions stay for the life of the component — collapsing on blur would
   * yank a tile out from under the tap that's about to select it.
   */
  collapsedUntilFocus?: boolean;
}

const HINT = "   (start typing →)";

export function BagFinder({
  mode,
  onSelect,
  placeholder,
  allowRequest = true,
  onSubmitQuery,
  onNavigate,
  autoFocus,
  maxModels,
  onViewAll,
  collapsedUntilFocus = false,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [engaged, setEngaged] = useState(!collapsedUntilFocus);
  const [models, setModels] = useState<FinderModel[]>([]);
  const [colours, setColours] = useState<FinderColour[]>([]);
  const [focus, setFocus] = useState<FinderModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const reqId = useRef(0);

  const fetchModels = useCallback(async (query: string) => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/bag-finder?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { models?: FinderModel[] };
      if (id !== reqId.current) return;
      setModels(data.models ?? []);
      setFocus(null);
      setColours([]);
    } catch {
      if (id === reqId.current) setModels([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  const openModel = useCallback(async (m: FinderModel) => {
    const id = ++reqId.current;
    setFocus(m);
    setLoading(true);
    try {
      const res = await fetch(`/api/bag-finder?styleId=${m.styleId}`);
      const data = (await res.json()) as { colours?: FinderColour[] };
      if (id !== reqId.current) return;
      setColours(data.colours ?? []);
    } catch {
      if (id === reqId.current) setColours([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Populate on focus + live narrow: q starts empty (focus null), so this fires
  // fetchModels("") on mount for the populated grid, then re-narrows as they type.
  // Collapsed hosts skip the fetch entirely until the field is engaged.
  // The fetch is scheduled in a timeout, so no synchronous setState in the effect.
  useEffect(() => {
    if (focus || !engaged) return;
    const t = setTimeout(() => void fetchModels(q), q ? 180 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, engaged]);

  function choose(m: FinderModel, c: FinderColour | null) {
    const sel: BagFinderSelection = {
      styleId: m.styleId,
      styleName: m.name,
      brand: m.brand,
      variantId: c ? c.variantId : m.heroVariantId,
      colourName: c ? c.colourName : null,
    };
    if (mode === "nav") {
      if (sel.variantId != null) {
        router.push(`/bag/${sel.variantId}`);
        onNavigate?.();
      }
    } else {
      onSelect?.(sel);
    }
  }

  const tile =
    "group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2 text-left transition-colors hover:border-gold";

  return (
    <div className="w-full">
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onFocus={() => setEngaged(true)}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmitQuery) {
              e.preventDefault();
              onSubmitQuery(q);
            }
          }}
          placeholder={
            placeholder ??
            (mode === "nav" ? `Chanel flap, black caviar${HINT}` : `Which bag are you adding?${HINT}`)
          }
          aria-label="Find a bag"
          className="w-full rounded-full border border-gold bg-surface py-2 pl-10 pr-4 text-base text-foreground placeholder:text-muted focus:outline-none sm:text-sm"
        />
      </div>

      {!engaged ? null : focus ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="mb-2 text-xs text-muted transition-colors hover:text-gold"
          >
            ‹ All results
          </button>
          <p className="px-1 text-sm font-medium text-foreground">
            {focus.brand} {focus.name}
          </p>
          <p className="mb-2 px-1 text-xs text-muted">Pick the colour closest to yours</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {colours.map((c) => (
              <button key={c.variantId} type="button" onClick={() => choose(focus, c)} className={tile}>
                <BagImage
                  imageUrl={c.image}
                  brand={focus.brand}
                  alt={`${focus.brand} ${focus.name} in ${c.colourName}`}
                  invite={false}
                  className="aspect-square w-full rounded-xl"
                />
                <span className="truncate px-0.5 text-xs font-medium text-foreground">{c.colourName}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => choose(focus, null)}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/50 p-2 text-center transition-colors hover:border-gold"
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-xl text-2xl text-muted">
                ?
              </span>
              <span className="text-xs text-muted">Not sure</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="mb-2 px-1 text-xs text-muted">
            {q.trim() ? "Matches" : "Popular right now"}
          </p>
          {loading && models.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted">Loading…</p>
          ) : models.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted">No match yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {(maxModels ? models.slice(0, maxModels) : models).map((m) => (
                <button key={m.styleId} type="button" onClick={() => openModel(m)} className={tile}>
                  <div className="relative">
                    <BagImage
                      imageUrl={m.heroImage}
                      brand={m.brand}
                      alt={`${m.brand} ${m.name}`}
                      invite={false}
                      className="aspect-square w-full rounded-xl"
                    />
                    {m.colourCount > 1 && (
                      <span className="absolute right-1.5 top-1.5 rounded-full border border-border bg-bg/80 px-1.5 py-0.5 text-[10px] text-muted">
                        {m.colourCount} colours
                      </span>
                    )}
                  </div>
                  <span className="px-0.5">
                    <span className="block truncate text-xs font-medium text-foreground">{m.name}</span>
                    <span className="block truncate text-[11px] text-muted">{m.brand}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {onViewAll && models.length > 0 && (
            <button
              type="button"
              onClick={() => onViewAll(q)}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-gold/60 bg-surface px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-bg"
            >
              View all results
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}

      {allowRequest && engaged && !focus && (
        <div className="mt-3">
          {requesting ? (
            <RequestBagForm query={q} />
          ) : (
            <button
              type="button"
              onClick={() => setRequesting(true)}
              className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Can&apos;t find it? Ask us to add it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
