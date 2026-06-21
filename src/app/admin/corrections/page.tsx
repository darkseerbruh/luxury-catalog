import Link from "next/link";
import { getCorrections } from "@/lib/corrections";
import CorrectionActions from "./CorrectionRow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Corrections — Admin · The Luxury Catalog",
  robots: { index: false, follow: false },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function targetLabel(c: {
  variantId: number | null;
  styleId: number | null;
  brandId: number | null;
  brandName: string | null;
  styleName: string | null;
}): React.ReactNode {
  const name = [c.brandName, c.styleName].filter(Boolean).join(" · ");
  if (c.variantId) {
    return (
      <Link href={`/bag/${c.variantId}`} className="text-foreground hover:text-gold">
        {name || `Variant #${c.variantId}`}
      </Link>
    );
  }
  if (c.brandId && c.brandName) {
    return (
      <Link href={`/brand/${c.brandId}`} className="text-foreground hover:text-gold">
        {c.brandName}
      </Link>
    );
  }
  return <span className="text-foreground">{name || "Catalog"}</span>;
}

export default async function AdminCorrectionsPage() {
  const [pending, accepted, rejected] = await Promise.all([
    getCorrections("pending"),
    getCorrections("accepted", 50),
    getCorrections("rejected", 50),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">Admin</Link> / Corrections
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Suggested corrections</h1>
        <p className="mt-2 max-w-2xl text-muted">
          User-submitted catalog corrections. Accepting marks a suggestion as accepted and
          records you as the reviewer — it does <strong>not</strong> change the catalog
          automatically. Apply accepted edits manually after verifying the source.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-serif text-xl text-foreground">
          Pending <span className="text-sm text-muted">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <EmptyState text="No pending corrections. They appear when users use 'Suggest an edit' on a bag page." />
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((c) => (
              <li
                key={c.correctionId}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-muted">{c.fieldPath}</p>
                  <p className="mt-1">{targetLabel(c)}</p>
                  <p className="mt-2 text-sm text-muted">
                    <span className="text-muted/70">Current:</span> {c.currentValue || <em>not set</em>}
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="text-muted/70">Suggested:</span> {c.suggestedValue}
                  </p>
                  {c.note && <p className="mt-1 text-sm italic text-muted">{c.note}</p>}
                  <p className="mt-2 text-xs text-muted/60">{formatDate(c.createdAt)}</p>
                </div>
                <CorrectionActions correctionId={c.correctionId} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {(accepted.length > 0 || rejected.length > 0) && (
        <section>
          <h2 className="mb-3 font-serif text-xl text-foreground">Reviewed</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Field</th>
                  <th className="px-3 py-3 font-medium">Suggested</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...accepted, ...rejected].map((c) => (
                  <tr key={c.correctionId} className="align-top">
                    <td className="px-5 py-3 text-muted">{c.fieldPath}</td>
                    <td className="px-3 py-3 text-foreground">{c.suggestedValue}</td>
                    <td className="px-3 py-3 capitalize">
                      <span className={c.status === "accepted" ? "text-gold" : "text-muted"}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-muted">{formatDate(c.reviewedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
      {text}
    </div>
  );
}
