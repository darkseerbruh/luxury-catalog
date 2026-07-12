"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { tierDisplay } from "@/lib/house-standing";

/** One brand, flattened for the directory: catalog facts + live House Standing. */
export interface BrandRow {
  brandId: number;
  name: string;
  tier: string;
  isLive: boolean;
  variantCount: number;
  topStyles: { styleId: number; name: string; variantId: number | null }[];
  /** Live House Standing 0-100; null when below the price gate (unranked). */
  score: number | null;
  /** 1-based rank among placed brands; null when unranked. */
  rank: number | null;
  country: string | null;
  foundedYear: number | null;
}

type View = "az" | "ranking" | "tier" | "origin" | "heritage";

const VIEWS: { key: View; label: string }[] = [
  { key: "az", label: "A–Z" },
  { key: "ranking", label: "Ranking" },
  { key: "tier", label: "Tier" },
  { key: "origin", label: "Origin" },
  { key: "heritage", label: "Heritage" },
];

/** One-line read on what each view is doing, so the sort is never a mystery. */
const VIEW_NOTE: Record<View, string> = {
  az: "Every brand we cover, alphabetical. Best for finding one fast.",
  ranking: "Ranked 1 to N by House Standing, our resale-market score. Our standing, not a verdict.",
  tier: "Grouped into five bands by House Standing. Tier 1 commands the most.",
  origin: "Grouped by country of origin.",
  heritage: "Oldest brands first, by the year they were founded.",
};

const byName = (a: BrandRow, b: BrandRow) => a.name.localeCompare(b.name);

/** The directory card: name + its most-documented styles + a way in. `meta` is the
 * per-view line under the name (rank, year, nothing). */
function BrandCard({ brand, meta }: { brand: BrandRow; meta?: ReactNode }) {
  return (
    <div>
      <Link
        href={`/brand/${brand.brandId}`}
        className="font-serif text-lg text-foreground transition-colors hover:text-gold"
      >
        {brand.name}
      </Link>
      {meta}
      {brand.isLive ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {brand.topStyles.map((s) => (
            <li key={s.styleId}>
              <Link
                href={s.variantId ? `/bag/${s.variantId}` : `/brand/${brand.brandId}`}
                className="text-sm text-muted transition-colors hover:text-gold"
              >
                {s.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={`/brand/${brand.brandId}`}
              className="text-sm text-gold transition-colors hover:text-gold-soft"
            >
              View all {brand.name} →
            </Link>
          </li>
        </ul>
      ) : (
        <p className="mt-1 text-xs uppercase tracking-wide text-muted/60">Coming soon</p>
      )}
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs uppercase tracking-widest text-muted/70">{children}</p>;
}

export default function BrandsExplorer({ rows }: { rows: BrandRow[] }) {
  const [view, setView] = useState<View>("az");

  return (
    <div className="mt-8">
      {/* View switcher */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sort brands">
        {VIEWS.map((v) => {
          const active = v.key === view;
          return (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(v.key)}
              className={
                active
                  ? "rounded-full border border-gold bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold"
                  : "rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold/50 hover:text-foreground"
              }
            >
              {v.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">{VIEW_NOTE[view]}</p>

      <div className="mt-2">
        {view === "az" && <AZView rows={rows} />}
        {view === "ranking" && <RankingView rows={rows} />}
        {view === "tier" && <TierView rows={rows} />}
        {view === "origin" && <OriginView rows={rows} />}
        {view === "heritage" && <HeritageView rows={rows} />}
      </div>
    </div>
  );
}

function AZView({ rows }: { rows: BrandRow[] }) {
  const sorted = [...rows].sort(byName);
  return (
    <Grid>
      {sorted.map((b) => (
        <BrandCard key={b.brandId} brand={b} />
      ))}
    </Grid>
  );
}

function RankingView({ rows }: { rows: BrandRow[] }) {
  const ranked = rows
    .filter((b) => b.rank != null)
    .sort((a, b) => (a.rank as number) - (b.rank as number));
  const unranked = rows.filter((b) => b.rank == null).sort(byName);
  return (
    <>
      <ol className="mt-6 flex flex-col divide-y divide-border">
        {ranked.map((b) => {
          const t = tierDisplay(b.tier);
          return (
            <li key={b.brandId} className="flex items-baseline gap-4 py-3">
              <span className="w-8 shrink-0 text-right font-serif text-lg text-gold tabular-nums">
                {b.rank}
              </span>
              <Link
                href={`/brand/${b.brandId}`}
                className="font-serif text-lg text-foreground transition-colors hover:text-gold"
              >
                {b.name}
              </Link>
              <span className="ml-auto flex items-baseline gap-3 text-sm text-muted">
                {t.label && <span className="text-xs uppercase tracking-wide text-muted/70">{t.label}</span>}
                <span className="tabular-nums text-foreground">{b.score?.toFixed(1)}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {unranked.length > 0 && (
        <div className="mt-8">
          <GroupLabel>Not yet ranked</GroupLabel>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Fewer than the recorded prices we need to place these on the scale. We leave them
            unranked rather than guess a number.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {unranked.map((b) => (
              <Link
                key={b.brandId}
                href={`/brand/${b.brandId}`}
                className="text-base text-muted transition-colors hover:text-gold"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function TierView({ rows }: { rows: BrandRow[] }) {
  const tiers = ["1", "2", "3", "4", "5"];
  return (
    <div className="mt-6 flex flex-col gap-12">
      {tiers.map((tk) => {
        const group = rows.filter((b) => b.tier === tk).sort(byName);
        if (group.length === 0) return null;
        const t = tierDisplay(tk);
        return (
          <section key={tk}>
            <GroupLabel>{t.label}</GroupLabel>
            {t.descriptor && <p className="mt-1 text-sm text-muted">{t.descriptor}</p>}
            <Grid>
              {group.map((b) => (
                <BrandCard key={b.brandId} brand={b} />
              ))}
            </Grid>
          </section>
        );
      })}
    </div>
  );
}

function OriginView({ rows }: { rows: BrandRow[] }) {
  const known = rows.filter((b) => b.country);
  const unknown = rows.filter((b) => !b.country).sort(byName);
  const countries = Array.from(new Set(known.map((b) => b.country as string))).sort((a, b) =>
    a.localeCompare(b),
  );
  return (
    <div className="mt-6 flex flex-col gap-12">
      {countries.map((c) => {
        const group = known.filter((b) => b.country === c).sort(byName);
        return (
          <section key={c}>
            <GroupLabel>{c}</GroupLabel>
            <Grid>
              {group.map((b) => (
                <BrandCard key={b.brandId} brand={b} />
              ))}
            </Grid>
          </section>
        );
      })}
      {unknown.length > 0 && (
        <section>
          <GroupLabel>Origin unrecorded</GroupLabel>
          <Grid>
            {unknown.map((b) => (
              <BrandCard key={b.brandId} brand={b} />
            ))}
          </Grid>
        </section>
      )}
    </div>
  );
}

function HeritageView({ rows }: { rows: BrandRow[] }) {
  const dated = rows
    .filter((b) => b.foundedYear != null)
    .sort((a, b) => (a.foundedYear as number) - (b.foundedYear as number) || byName(a, b));
  const undated = rows.filter((b) => b.foundedYear == null).sort(byName);
  return (
    <>
      <Grid>
        {dated.map((b) => (
          <BrandCard
            key={b.brandId}
            brand={b}
            meta={<p className="mt-0.5 text-sm text-gold tabular-nums">Est. {b.foundedYear}</p>}
          />
        ))}
      </Grid>
      {undated.length > 0 && (
        <div className="mt-10">
          <GroupLabel>Founding year unrecorded</GroupLabel>
          <Grid>
            {undated.map((b) => (
              <BrandCard key={b.brandId} brand={b} />
            ))}
          </Grid>
        </div>
      )}
    </>
  );
}
