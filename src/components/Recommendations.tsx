import Link from "next/link";
import { getRecommendations } from "@/lib/recommendations";
import { RecommendationCard } from "./RecommendationCard";

/**
 * "Bags you might like" section for the home and profile pages. Fetches the
 * current user's content-based recommendations; renders a quiz stub when there's
 * no taste signal yet (graceful cold start). Renders nothing extra when signed
 * out — callers gate on auth.
 */
export default async function Recommendations({
  source,
  layout = "scroll",
  limit = 8,
}: {
  source: string;
  layout?: "scroll" | "grid";
  limit?: number;
}) {
  const { recommendations, hasTaste } = await getRecommendations(limit);

  if (!hasTaste) {
    return (
      <section className="px-0">
        <h2 className="font-serif text-2xl text-foreground">Bags you might like</h2>
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="mx-auto max-w-sm text-muted">
            Take the 60-second taste quiz and we&rsquo;ll recommend bags matched to
            your style — using only real catalog attributes.
          </p>
          <Link
            href="/quiz"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Find your taste
          </Link>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="px-0">
      <h2 className="font-serif text-2xl text-foreground">Bags you might like</h2>
      <div
        className={
          layout === "grid"
            ? "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : "mt-6 flex gap-4 overflow-x-auto pb-2"
        }
      >
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.variantId} rec={rec} source={source} />
        ))}
      </div>
    </section>
  );
}
