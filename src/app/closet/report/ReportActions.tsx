"use client";

type Row = {
  brand: string;
  style: string;
  variant: string;
  value: number | null;
  currency: string | null;
};

/** Print-to-PDF + CSV export for the collection report. Client-only (uses
 * window.print and a Blob download); the report itself is server-rendered. */
export default function ReportActions({
  rows,
  total,
  currency,
  asOf,
  owner,
}: {
  rows: Row[];
  total: number;
  currency: string | null;
  asOf: string;
  owner: string;
}) {
  function downloadCsv() {
    const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const row = (cells: unknown[]) => cells.map(esc).join(",");
    const csv = [
      row([`Collection report — ${owner}`]),
      row([`As of ${asOf}`]),
      "",
      row(["#", "Brand", "Style", "Variant", "Estimated value", "Currency"]),
      ...rows.map((r, i) => row([i + 1, r.brand, r.style, r.variant, r.value ?? "", r.currency ?? ""])),
      row(["", "", "", "Total", total, currency ?? ""]),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collection-report-${asOf.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
      >
        Print / PDF
      </button>
      <button
        type="button"
        onClick={downloadCsv}
        className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
      >
        Download CSV
      </button>
    </div>
  );
}
