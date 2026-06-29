"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FAMILY_PREFIX, type ShopSort, type ShopFacets, type Facet, type GroupedFacet } from "@/lib/listings";
import { track, EVENTS } from "@/lib/analytics/events";

const SORTS: { value: ShopSort; label: string }[] = [
  { value: "best-deal", label: "Best deal first" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
];

const selectClass =
  "rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:border-gold focus:border-gold focus:outline-none";
const inputClass =
  "w-24 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted/60 transition-colors hover:border-gold focus:border-gold focus:outline-none";

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
}

/** A flat facet select (brand / hardware / condition); renders nothing when empty. */
function FacetSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  options: Facet[];
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value} ({o.count})
          </option>
        ))}
      </select>
    </>
  );
}

/**
 * A two-level facet select: families as <optgroup>s, each led by an inclusive
 * "All {family}" option (value "f:Family") followed by the specific names under it. So a
 * shopper can pick "All Brown" or "Étoupe", "All Leather" or "Togo".
 */
function GroupedFacetSelect({
  id,
  label,
  allLabel,
  value,
  groups,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  groups: GroupedFacet[];
  onChange: (value: string) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select id={id} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {groups.map((g) => (
          <optgroup key={g.family} label={g.family}>
            <option value={`${FAMILY_PREFIX}${g.family}`}>
              All {g.family.toLowerCase()} ({g.count})
            </option>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {"  "}
                {o.value} ({o.count})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </>
  );
}

/**
 * An editable price box that commits to the URL on Enter or blur (not per keystroke).
 * Uncontrolled (`defaultValue` + `key`) so it resets cleanly when the URL value changes
 * from elsewhere (back button / reset) without syncing prop→state in an effect.
 */
function PriceInput({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const commit = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (cleaned !== value) onCommit(cleaned);
  };
  return (
    <>
      <label className="sr-only" htmlFor={`shop-${label.toLowerCase()}`}>
        {label} price
      </label>
      <input
        key={value}
        id={`shop-${label.toLowerCase()}`}
        type="text"
        inputMode="numeric"
        className={inputClass}
        placeholder={placeholder}
        defaultValue={value}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
    </>
  );
}

/** Filter + sort controls for the Shop grid. Each change updates the URL (server reads it). */
export default function ShopControls({ facets, current }: { facets: ShopFacets; current: ShopCurrent }) {
  const router = useRouter();
  const sp = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    }
    // Fire catalog_filtered for real filter changes (sort-only changes don't
    // count) so /shop discovery shows up in the funnel — previously only /search
    // emitted this event, which is why shop filtering read as zero.
    const filterKeys = Object.keys(patch).filter((k) => k !== "sort");
    if (filterKeys.length > 0) {
      track(EVENTS.catalogFiltered, {
        source: "shop",
        ...Object.fromEntries(filterKeys.map((k) => [`filter_${k}`, patch[k] ?? "cleared"])),
      });
    }
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FacetSelect
        id="shop-brand"
        label="Brand"
        allLabel="All brands"
        value={current.brand}
        options={facets.brands}
        onChange={(v) => update({ brand: v })}
      />
      <GroupedFacetSelect
        id="shop-color"
        label="Color"
        allLabel="Any color"
        value={current.color}
        groups={facets.colors}
        onChange={(v) => update({ color: v })}
      />
      <GroupedFacetSelect
        id="shop-material"
        label="Leather"
        allLabel="Any leather"
        value={current.material}
        groups={facets.materials}
        onChange={(v) => update({ material: v })}
      />
      <FacetSelect
        id="shop-hardware"
        label="Hardware"
        allLabel="Any hardware"
        value={current.hardware}
        options={facets.hardware}
        onChange={(v) => update({ hardware: v })}
      />
      <FacetSelect
        id="shop-condition"
        label="Condition"
        allLabel="Any condition"
        value={current.condition}
        options={facets.conditions}
        onChange={(v) => update({ condition: v })}
      />

      <div className="flex items-center gap-1.5">
        <PriceInput label="Min" placeholder="Min $" value={current.min} onCommit={(v) => update({ min: v })} />
        <span className="text-sm text-muted">–</span>
        <PriceInput label="Max" placeholder="Max $" value={current.max} onCommit={(v) => update({ max: v })} />
      </div>

      <label className="sr-only" htmlFor="shop-sort">
        Sort
      </label>
      <select id="shop-sort" className={selectClass} value={current.sort} onChange={(e) => update({ sort: e.target.value })}>
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => update({ deals: current.deals ? null : "1" })}
        aria-pressed={current.deals}
        className={
          current.deals
            ? "rounded-full border border-gold bg-gold-soft/10 px-3 py-1.5 text-sm font-medium text-gold"
            : "rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        }
      >
        Deals only
      </button>
    </div>
  );
}
