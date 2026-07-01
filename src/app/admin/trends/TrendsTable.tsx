"use client";

import { useMemo, useState, useTransition } from "react";
import type { TrendRow } from "@/lib/trends";
import { updateTrend } from "./actions";

type SortKey = "pop_num" | "sat_priority" | "creators_saturation" | "term";
const STATUSES = ["", "idea", "drafted", "posted"] as const;

export default function TrendsTable({ rows: initial }: { rows: TrendRow[] }) {
  const [rows, setRows] = useState<TrendRow[]>(initial);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("pop_num");
  const [asc, setAsc] = useState(false);
  const [, startTransition] = useTransition();

  const brands = useMemo(
    () => Array.from(new Set(initial.map((r) => r.brand).filter(Boolean))).sort() as string[],
    [initial],
  );

  // The 45 highest sat_priority terms are the "check these first" set.
  const prioritySet = useMemo(() => {
    const top = [...initial]
      .sort((a, b) => (b.sat_priority ?? 0) - (a.sat_priority ?? 0))
      .slice(0, 45);
    return new Set(top.map((r) => r.term));
  }, [initial]);

  const view = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((r) => r.term.toLowerCase().includes(needle));
    }
    if (brand !== "all") out = out.filter((r) => r.brand === brand);
    if (priorityOnly) out = out.filter((r) => prioritySet.has(r.term));
    const dir = asc ? 1 : -1;
    return [...out].sort((a, b) => {
      if (sortKey === "term") return a.term.localeCompare(b.term) * dir;
      const av = (a[sortKey] as number | null) ?? -1;
      const bv = (b[sortKey] as number | null) ?? -1;
      return (av - bv) * dir;
    });
  }, [rows, q, brand, priorityOnly, sortKey, asc, prioritySet]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "term");
    }
  }

  function save(term: string, patch: Partial<TrendRow>) {
    setRows((prev) => prev.map((r) => (r.term === term ? { ...r, ...patch } : r)));
    startTransition(async () => {
      await updateTrend(term, {
        ...("creators_saturation" in patch ? { creators_saturation: patch.creators_saturation ?? null } : {}),
        ...("content_status" in patch ? { content_status: patch.content_status ?? null } : {}),
      });
    });
  }

  const arrow = (key: SortKey) => (sortKey === key ? (asc ? " ▲" : " ▼") : "");

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms…"
          className="w-56 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={priorityOnly}
            onChange={(e) => setPriorityOnly(e.target.checked)}
            className="accent-gold"
          />
          Top 45 to check first
        </label>
        <span className="ml-auto text-sm text-muted">{view.length} shown</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th onClick={() => toggleSort("term")} label={`Term${arrow("term")}`} />
              <Th onClick={() => toggleSort("pop_num")} label={`Popularity${arrow("pop_num")}`} right />
              <th className="px-3 py-3 text-right font-medium">Growth</th>
              <th className="px-3 py-3 font-medium">Brand</th>
              <th className="px-3 py-3 font-medium">Suggested content</th>
              <Th onClick={() => toggleSort("sat_priority")} label={`Priority${arrow("sat_priority")}`} right />
              <Th
                onClick={() => toggleSort("creators_saturation")}
                label={`Creators${arrow("creators_saturation")}`}
                right
              />
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {view.map((r) => (
              <tr
                key={r.term}
                className={`transition-colors hover:bg-surface-raised/40 ${
                  prioritySet.has(r.term) ? "bg-gold/5" : ""
                }`}
              >
                <td className="px-3 py-2 text-foreground">
                  {r.our_page ? (
                    <a
                      href={r.our_page.startsWith("/") ? r.our_page : undefined}
                      className="hover:text-gold"
                      title={`We have a page: ${r.our_page}`}
                    >
                      {r.term} <span className="text-gold">•</span>
                    </a>
                  ) : (
                    r.term
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-foreground">{r.popularity ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-muted">{r.growth_pct ?? ""}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted">{r.brand ?? ""}</td>
                <td className="px-3 py-2 text-muted">{r.suggested_content ?? ""}</td>
                <td className="px-3 py-2 text-right text-muted">{r.sat_priority ?? ""}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    defaultValue={r.creators_saturation ?? ""}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const val = raw === "" ? null : Number(raw);
                      if ((val ?? null) !== (r.creators_saturation ?? null)) {
                        save(r.term, { creators_saturation: val });
                      }
                    }}
                    className="w-20 rounded border border-border bg-surface px-2 py-1 text-right text-foreground focus:border-gold focus:outline-none"
                    placeholder="—"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.content_status ?? ""}
                    onChange={(e) => save(r.term, { content_status: e.target.value || null })}
                    className="rounded border border-border bg-surface px-2 py-1 text-foreground focus:border-gold focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s || "—"}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ onClick, label, right }: { onClick: () => void; label: string; right?: boolean }) {
  return (
    <th className={`px-3 py-3 font-medium ${right ? "text-right" : ""}`}>
      <button type="button" onClick={onClick} className="uppercase tracking-wide transition-colors hover:text-gold">
        {label}
      </button>
    </th>
  );
}
