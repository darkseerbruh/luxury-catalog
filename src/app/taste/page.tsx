import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTastePageData } from "@/lib/personalization/taste-profile-page";
import { ResetTasteButton } from "./ResetTasteButton";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const dynamic = "force-dynamic";

const DIM_LABELS: Record<string, string> = {
  silhouette: "Silhouette",
  hardware: "Hardware",
  material: "Material",
  size: "Size",
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-border">
      <div className="h-1.5 rounded-full bg-gold" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function TastePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getTastePageData(user.id);

  if (!data) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Your taste profile</h1>
        <p className="mt-4 text-muted">
          We&rsquo;re still building your profile — save a few bags to your closet or
          watchlist and check back.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Browse the catalog
        </Link>
      </main>
    );
  }

  const { profile, summary, topBrands, topAttributes } = data;
  const counts = profile.signalCounts;

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Your taste</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground">
            {summary?.tasteLabel ?? "Your taste profile"}
          </h1>
        </div>
        <ResetTasteButton />
      </div>

      {summary && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <p className="text-foreground">{summary.headline}</p>
          <ul className="mt-4 space-y-2">
            {summary.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="mt-0.5 text-gold">—</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!summary && profile.signalCounts.total_interactions < 2 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center">
          <p className="text-muted">
            Save a few more bags and we&rsquo;ll paint a clearer picture of your taste.
          </p>
        </div>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {topBrands.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted">Brands you gravitate toward</h2>
            <ul className="mt-4 space-y-3">
              {topBrands.map(({ name, score }) => (
                <li key={name}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-foreground">{name}</span>
                    <span className="text-xs text-muted">{score.toFixed(1)}</span>
                  </div>
                  <ScoreBar score={score} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {topAttributes.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted">Attributes you favor</h2>
            <ul className="mt-4 space-y-3">
              {topAttributes.map(({ dim, value, score }) => (
                <li key={`${dim}-${value}`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-foreground capitalize">{value}</span>
                    <span className="text-xs text-muted">{DIM_LABELS[dim] ?? dim}</span>
                  </div>
                  <ScoreBar score={score} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-xs uppercase tracking-widest text-muted">Signal summary</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {[
            ["Bags I want", counts.want_count],
            ["Bags I have", counts.have_count],
            ["Bags I had", counts.had_count],
            ["Watching", counts.watchlist_count],
            ["Reviews", counts.review_count],
            ["Quiz complete", `${counts.quiz_completeness}%`],
          ].map(([label, val]) => (
            <div key={String(label)}>
              <dt className="text-muted">{label}</dt>
              <dd className="mt-0.5 font-medium text-foreground">{val}</dd>
            </div>
          ))}
        </dl>
      </section>

      <NewsletterSignup source="taste_page" className="mt-8" />

      <p className="mt-8 text-xs text-muted">
        Your taste profile is built from bags you&rsquo;ve saved, watched, and reviewed —
        plus your quiz answers. It updates nightly.{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy policy
        </Link>
      </p>
    </main>
  );
}
