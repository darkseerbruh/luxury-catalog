import { getSupabase } from "./supabase";

/**
 * Content gates — keep community-driven surfaces hidden until there is enough
 * real user signal to make them feel alive.
 *
 * The problem they solve: sections that are only good when populated (review
 * leaderboards, "most coveted" rankings, "what the community knows") look like a
 * ghost town pre-launch, and dressing them up with sample data would break the
 * never-invent rule. So instead of faking it, we GATE: each section reads a real
 * count and only renders once that count clears a threshold. Below it, the
 * section is omitted entirely; above it, it lights up automatically as the data
 * arrives. No manual flipping, no fabricated proof.
 *
 * Strategy + the full list of gated surfaces: docs/ux/content-gating-strategy.md.
 *
 * Resilient by contract: any missing env / table / column / query error yields a
 * count of 0, so the gate reads false and the section stays hidden. Matches the
 * resilient-read pattern used across the homepage data layer.
 */

/** Minimum real signal each community surface needs before it renders. */
export const GATE_THRESHOLDS = {
  /** Total reviews before the review-driven leaderboards ("what the community knows") show. */
  communityReviews: 25,
  /** Total "want" signals before the "most coveted" rankings + nav item show. */
  covetedWants: 25,
} as const;

/**
 * Are there enough reviews to show the review leaderboards / "what the community
 * knows"? Counts every review row; below the threshold the whole section is pulled.
 */
export async function communityKnowledgeReady(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  try {
    const { count, error } = await getSupabase()
      .from("review")
      .select("*", { count: "exact", head: true });
    if (error) return false;
    return (count ?? 0) >= GATE_THRESHOLDS.communityReviews;
  } catch {
    return false;
  }
}

/**
 * Are enough people marking bags as "want" to make the "most coveted" rankings
 * meaningful? Gates the /coveted nav item, the homepage coveted tile, and the
 * footer link. Counts closet rows with status 'want'.
 */
export async function covetedBagsReady(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  try {
    const { count, error } = await getSupabase()
      .from("closet_item")
      .select("*", { count: "exact", head: true })
      .eq("status", "want");
    if (error) return false;
    return (count ?? 0) >= GATE_THRESHOLDS.covetedWants;
  } catch {
    return false;
  }
}
