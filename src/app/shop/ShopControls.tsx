"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FAMILY_PREFIX, type ShopSort, type ShopFacets, type Facet, type GroupedFacet } from "@/lib/listings";
import { track, EVENTS } from "@/lib/analytics/events";

const SORTS: { value: ShopSort; label: string }[] = [
  { value: "best-deal", label: "Best deal first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const FEET_LABELS: Record<string, string> = {
  yes: "Has protective feet",
  unknown: "Feet not yet documented",
};

export interface ShopCurrent {
  brand: string;
  sort: string;
  deals: boolean;
  min: string;
  max: string;
  color: string;
  material: string;
  hardware: string;
  condition: string;
  /** "" | "yes" | "unknown" — the protective-feet filter (0044). */
  feet: string;
}

/** "f:Beige" → "All beige"; a specific value passes through. */
function familyDisplay(v: string): string {
  return v.startsWith(FAMILY_PREFIX) ? `All ${v.slice(FAMILY_PREFIX.length).toLowerCase()}` : v;
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

/** One selectable filter value. Selection carries a filled box + check (never colour
 *  alone), so it reads for colourblind users too. */
function OptionRow({
  on,
  label,
  count,
  onClick,
}: {
  on: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] transition-colors"
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
          on ? "border-gold bg-gold text-bg" : "border-border text-transparent"
        }`}
      >
        <Check />
      </span>
      <span className={`min-w-0 flex-1 truncate ${on ? "text-foreground" : "text-muted"}`}>{label}</span>
      {count != null && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted/60">{count}</span>
      )}
    </button>
  );
}

/** A collapsing group: heading + its rows, with a "show all" expander past `cap`. */
function FacetGroup({
  label,
  sub,
  children,
  count,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
  count: number;
}) {
  if (count === 0) return null;
  return (
    <div className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
      <p className="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium uppercase tracking-wide text-muted/80">
        {label}
        {sub && <span className="text-[10px] font-normal normal-case tracking-normal text-muted/50">{sub}</span>}
      </p>
      {children}
    </div>
  );
}

/** Flat single-select facet (brand / hardware / condition / feet) as a capped list. */
function FlatFacet({
  label,
  sub,
  value,
  options,
  onToggle,
  display = (v) => v,
  cap = 6,
}: {
  label: string;
  sub?: string;
  value: string;
  options: Facet[];
  onToggle: (v: string) => void;
  display?: (v: string) => string;
  cap?: number;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) return null;
  const shown = open ? options : options.slice(0, cap);
  return (
    <FacetGroup label={label} sub={sub} count={options.length}>
      {shown.map((o) => (
        <OptionRow
          key={o.value}
          on={value === o.value}
          label={display(o.value)}
          count={o.count}
          onClick={() => onToggle(value === o.value ? "" : o.value)}
        />
      ))}
      {options.length > cap && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[12px] text-gold hover:underline"
        >
          {open ? "Show fewer" : `Show all ${options.length}`}
        </button>
      )}
    </FacetGroup>
  );
}

/** Grouped facet (colour / leather): each family is a row for "All {family}" plus its
 *  specifics, capped per family. */
function GroupedFacet({
  label,
  value,
  groups,
  onToggle,
}: {
  label: string;
  value: string;
  groups: GroupedFacet[];
  onToggle: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (groups.length === 0) return null;
  const shown = open ? groups : groups.slice(0, 4);
  return (
    <FacetGroup label={label} count={groups.length}>
      <div className="flex flex-col gap-2">
        {shown.map((g) => {
          const famValue = `${FAMILY_PREFIX}${g.family}`;
          return (
            <div key={g.family}>
              <OptionRow
                on={value === famValue}
                label={`All ${g.family.toLowerCase()}`}
                count={g.count}
                onClick={() => onToggle(value === famValue ? "" : famValue)}
              />
              <div className="ml-3 border-l border-border/50 pl-2">
                {g.options.slice(0, 5).map((o) => (
                  <OptionRow
                    key={o.value}
                    on={value === o.value}
                    label={o.value}
                    count={o.count}
                    onClick={() => onToggle(value === o.value ? "" : o.value)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {groups.length > 4 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[12px] text-gold hover:underline"
        >
          {open ? "Show fewer" : `Show all ${groups.length}`}
        </button>
      )}
    </FacetGroup>
  );
}

/** Price min/max, committed on Enter or blur (not per keystroke). */
function PriceRange({
  min,
  max,
  onCommit,
}: {
  min: string;
  max: string;
  onCommit: (which: "min" | "max", value: string) => void;
}) {
  const box =
    "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none";
  const commit = (which: "min" | "max", raw: string, was: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (cleaned !== was) onCommit(which, cleaned);
  };
  return (
    <FacetGroup label="Price" count={1}>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="shop-min">Min price</label>
        <input
          key={`min-${min}`}
          id="shop-min"
          type="text"
          inputMode="numeric"
          className={box}
          placeholder="Min $"
          defaultValue={min}
          onBlur={(e) => commit("min", e.target.value, min)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
        <span className="text-muted">–</span>
        <label className="sr-only" htmlFor="shop-max">Max price</label>
        <input
          key={`max-${max}`}
          id="shop-max"
          type="text"
          inputMode="numeric"
          className={box}
          placeholder="Max $"
          defaultValue={max}
          onBlur={(e) => commit("max", e.target.value, max)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </div>
    </FacetGroup>
  );
}

function DealsToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
        on ? "border-gold/50 bg-gold/[0.07]" : "border-border bg-surface hover:border-gold/40"
      }`}
    >
      <span>
        <span className={`block text-[13px] font-semibold ${on ? "text-gold-soft" : "text-foreground"}`}>
          Deals only
        </span>
        <span className="block text-[11px] text-muted">Priced low vs past sales</span>
      </span>
      <span className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${on ? "bg-gold" : "bg-border"}`}>
        <span
          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-bg transition-all ${on ? "right-[2px]" : "left-[2px]"}`}
        />
      </span>
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-sm text-gold transition-colors hover:bg-gold/10"
    >
      {label}
      <span aria-hidden>×</span>
    </button>
  );
}

/**
 * The market's filter surface. Filters live in a left rail on desktop and a bottom
 * tray on mobile; the server-rendered results pass through as `children` into the right
 * column. Every change writes the URL (the server re-queries), and existing params — the
 * search `q` above all — are preserved, so search + filters + deals compose on one page.
 */
export default function ShopControls({
  facets,
  current,
  resultCount,
  totalListings,
  query,
  children,
}: {
  facets: ShopFacets;
  current: ShopCurrent;
  resultCount: number;
  totalListings: number;
  query: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [trayOpen, setTrayOpen] = useState(false);

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const filterKeys = Object.keys(patch).filter((k) => k !== "sort");
    if (filterKeys.length > 0) {
      track(EVENTS.catalogFiltered, {
        source: "market",
        ...Object.fromEntries(filterKeys.map((k) => [`filter_${k}`, patch[k] ?? "cleared"])),
      });
    }
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }

  const activeCount =
    (current.brand ? 1 : 0) +
    (current.color ? 1 : 0) +
    (current.material ? 1 : 0) +
    (current.hardware ? 1 : 0) +
    (current.condition ? 1 : 0) +
    (current.feet ? 1 : 0) +
    (current.deals ? 1 : 0) +
    (current.min || current.max ? 1 : 0);

  function clearAll() {
    const params = new URLSearchParams(sp.toString());
    for (const k of ["brand", "color", "material", "hardware", "condition", "feet", "deals", "min", "max"]) {
      params.delete(k);
    }
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }

  const controls = (
    <div className="flex flex-col gap-3">
      <DealsToggle on={current.deals} onToggle={() => update({ deals: current.deals ? null : "1" })} />

      <FacetGroup label="Sort" count={1}>
        {SORTS.map((s) => (
          <OptionRow
            key={s.value}
            on={current.sort === s.value}
            label={s.label}
            onClick={() => update({ sort: s.value })}
          />
        ))}
      </FacetGroup>

      <FlatFacet label="Brand" value={current.brand} options={facets.brands} onToggle={(v) => update({ brand: v })} cap={8} />
      <GroupedFacet label="Colour" value={current.color} groups={facets.colors} onToggle={(v) => update({ color: v })} />
      <GroupedFacet label="Leather" value={current.material} groups={facets.materials} onToggle={(v) => update({ material: v })} />
      <FlatFacet label="Hardware" value={current.hardware} options={facets.hardware} onToggle={(v) => update({ hardware: v })} />
      <FlatFacet label="Condition" value={current.condition} options={facets.conditions} onToggle={(v) => update({ condition: v })} />
      <FlatFacet
        label="Protective feet"
        value={current.feet}
        options={facets.protectiveFeet}
        onToggle={(v) => update({ feet: v })}
        display={(v) => FEET_LABELS[v] ?? v}
      />
      <PriceRange min={current.min} max={current.max} onCommit={(which, v) => update({ [which]: v })} />
    </div>
  );

  const countLine = (
    <>
      {resultCount.toLocaleString()} {resultCount === 1 ? "bag" : "bags"} · {totalListings.toLocaleString()}{" "}
      {totalListings === 1 ? "listing" : "listings"}
      {query ? ` for “${query}”` : ""}
    </>
  );

  const chips = activeCount > 0 && (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {current.brand && <Chip label={current.brand} onRemove={() => update({ brand: null })} />}
      {current.color && <Chip label={familyDisplay(current.color)} onRemove={() => update({ color: null })} />}
      {current.material && <Chip label={familyDisplay(current.material)} onRemove={() => update({ material: null })} />}
      {current.hardware && <Chip label={current.hardware} onRemove={() => update({ hardware: null })} />}
      {current.condition && <Chip label={current.condition} onRemove={() => update({ condition: null })} />}
      {current.feet && <Chip label={FEET_LABELS[current.feet] ?? current.feet} onRemove={() => update({ feet: null })} />}
      {current.deals && <Chip label="Deals only" onRemove={() => update({ deals: null })} />}
      {(current.min || current.max) && (
        <Chip
          label={`${current.min ? `$${current.min}` : "$0"}–${current.max ? `$${current.max}` : "any"}`}
          onRemove={() => update({ min: null, max: null })}
        />
      )}
      <button
        type="button"
        onClick={clearAll}
        className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );

  return (
    <div>
      {/* Mobile: sticky bar with count + a deals quick-toggle + the tray trigger. */}
      <div className="sticky top-0 z-20 -mx-5 mb-3 flex items-center justify-between gap-2 border-b border-border bg-bg/90 px-5 py-2.5 backdrop-blur lg:hidden">
        <span className="text-sm text-muted">{countLine}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ deals: current.deals ? null : "1" })}
            aria-pressed={current.deals}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              current.deals ? "border-gold bg-gold/10 font-medium text-gold" : "border-border text-muted"
            }`}
          >
            Deals
          </button>
          <button
            type="button"
            onClick={() => setTrayOpen(true)}
            className="rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
          >
            Filter &amp; sort{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      </div>

      {chips}

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        {/* Desktop rail */}
        <aside className="sticky top-4 hidden max-h-[calc(100vh-2rem)] self-start overflow-y-auto rounded-2xl border border-border bg-surface p-4 lg:block">
          {controls}
        </aside>

        {/* Results column (server-rendered children). */}
        <div className="min-w-0">
          <p className="mb-4 hidden border-b border-border pb-3 text-sm text-muted lg:block">{countLine}</p>
          {children}
        </div>
      </div>

      {/* Mobile tray */}
      {trayOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setTrayOpen(false)}
            className="absolute inset-0 bg-bg/60 backdrop-blur-sm"
          />
          <div className="relative max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface-raised p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg text-foreground">Filter &amp; sort</h2>
              <button
                type="button"
                onClick={() => setTrayOpen(false)}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted hover:border-gold hover:text-gold"
              >
                Done
              </button>
            </div>
            {controls}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 w-full rounded-full border border-border py-2 text-sm text-muted hover:border-gold hover:text-foreground"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
