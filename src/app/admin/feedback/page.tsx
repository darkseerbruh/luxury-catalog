import Link from "next/link";
import { getUserFeedback } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User feedback — Admin · The Luxury Catalog",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const FEEDBACK_STYLE: Record<string, string> = {
  inaccurate: "border-gold/40 text-gold",
  "missing information": "border-gold/30 text-gold/90",
  "confirm accurate": "border-border text-muted",
  "request addition": "border-gold/30 text-gold/90",
};

export default async function FeedbackAdminPage() {
  const entries = await getUserFeedback();
  const open = entries.filter((e) => !e.resolved);
  const flags = entries.filter((e) => e.feedbackType !== "confirm accurate");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">
            Admin
          </Link>{" "}
          / Feedback
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">User feedback</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Accuracy reports submitted from bag detail pages. Inaccurate or missing-info
          flags point at the records most worth checking first.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total feedback" value={entries.length.toString()} />
        <Stat label="Flags (not 'accurate')" value={flags.length.toString()} />
        <Stat label="Unresolved" value={open.length.toString()} />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No feedback submitted yet. Reports from the &ldquo;Is this information
          accurate?&rdquo; widget on bag pages will show up here.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((e) => (
            <li key={e.feedbackId} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs uppercase tracking-wide ${
                    FEEDBACK_STYLE[e.feedbackType] ?? "border-border text-muted"
                  }`}
                >
                  {e.feedbackType}
                </span>
                {e.variant ? (
                  <Link
                    href={`/bag/${e.variant.variantId}`}
                    className="text-sm text-foreground transition-colors hover:text-gold"
                  >
                    {[e.variant.brandName, e.variant.styleName, e.variant.label]
                      .filter(Boolean)
                      .join(" · ")}
                  </Link>
                ) : (
                  <span className="text-sm text-muted">
                    {e.recordType} #{e.recordId}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">{formatDate(e.date)}</span>
                {e.resolved ? (
                  <span className="text-xs text-gold/80">resolved</span>
                ) : (
                  <span className="text-xs text-muted/70">open</span>
                )}
              </div>
              {e.note && (
                <p className="mt-3 rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm leading-relaxed text-foreground">
                  {e.note}
                </p>
              )}
              {e.resolutionNotes && (
                <p className="mt-2 text-sm text-muted">
                  <span className="mr-1 font-medium">Resolution:</span>
                  {e.resolutionNotes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-serif text-3xl text-foreground">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
