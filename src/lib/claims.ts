import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/**
 * Reputation claims: statements we synthesised from published sources, which the
 * community then ratifies or rejects (migration 0062).
 *
 * The mechanic, borrowed from the Fragrantica teardown and adapted: WE draft from
 * real sources, the CROWD ratifies. It fixes cold start (a page is informative
 * before anyone contributes) and it collects far more signal than a review form,
 * because agreeing with a sentence is a much lower bar than writing one.
 *
 * Degrades to an empty list on missing env or an unapplied migration, matching
 * reviews.ts / votes.ts, so a bag page never breaks over it.
 */

export type ClaimStance = "pro" | "con" | "neutral";
export type ClaimVoteKind = "agree" | "disagree" | "stale";

export interface ClaimSource {
  label: string;
  url: string;
  /** commercial = earns from the bag; community = unpaid voice. */
  kind: "community" | "commercial";
}

export interface ReputationClaim {
  claimId: number;
  body: string;
  stance: ClaimStance;
  axisHint: string | null;
  sources: ClaimSource[];
  communitySources: number;
  commercialSources: number;
  asOf: string;
  agree: number;
  disagree: number;
  stale: number;
  /** The viewer's own vote, or null. */
  myVote: ClaimVoteKind | null;
}

export interface ClaimsView {
  pros: ReputationClaim[];
  cons: ReputationClaim[];
  signedIn: boolean;
  /** Oldest as_of across shown claims, so the UI can date the whole block. */
  asOf: string | null;
  /** True when any shown claim leans on paid sources more than unpaid ones. */
  commercialLean: boolean;
}

const EMPTY: ClaimsView = { pros: [], cons: [], signedIn: false, asOf: null, commercialLean: false };

/**
 * Net support, used for ordering. Deliberately NOT a raw agree count: a claim with
 * 100 agrees and 90 disagrees is contested, not popular, and should not outrank a
 * clean 40/2. Wilson-style shrinkage would be overkill at our volumes, so this uses
 * net votes damped by total, which is monotonic and easy to explain.
 */
export function claimScore(agree: number, disagree: number): number {
  const total = agree + disagree;
  if (total === 0) return 0;
  return (agree - disagree) / Math.sqrt(total);
}

/**
 * Should a claim still be shown? Retires itself when the crowd decisively rejects
 * it or flags it as no longer true. The thresholds are floors, not ratios alone, so
 * two grumpy votes cannot bury a claim.
 */
export function isClaimLive(c: { agree: number; disagree: number; stale: number }): boolean {
  const total = c.agree + c.disagree;
  if (total >= 8 && c.disagree > c.agree * 2) return false; // decisively rejected
  if (c.stale >= 5 && c.stale > c.agree) return false;      // flagged as out of date
  return true;
}

interface Row {
  claim_id: number;
  body: string;
  stance: ClaimStance;
  axis_hint: string | null;
  sources: ClaimSource[] | null;
  community_sources: number | null;
  commercial_sources: number | null;
  as_of: string;
  agree_votes: number | null;
  disagree_votes: number | null;
  stale_votes: number | null;
}

/** Claims for a variant, with the viewer's own votes folded in. */
export async function getClaims(variantId: number, styleId?: number): Promise<ClaimsView> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return EMPTY;
  const user = await getCurrentUser();
  const signedIn = Boolean(user);

  try {
    const supabase = await createServerSupabase();
    // A claim hangs off the variant OR the style (a "the double flap is slow" claim
    // is true of every Classic Flap, not just the black caviar medium).
    const filter = styleId
      ? `variant_id.eq.${variantId},style_id.eq.${styleId}`
      : `variant_id.eq.${variantId}`;
    const { data, error } = await supabase
      .from("reputation_claim")
      .select("claim_id, body, stance, axis_hint, sources, community_sources, commercial_sources, as_of, agree_votes, disagree_votes, stale_votes")
      .or(filter)
      .is("retired_at", null)
      .limit(60);
    if (error || !data) return { ...EMPTY, signedIn };

    const rows = data as Row[];
    if (rows.length === 0) return { ...EMPTY, signedIn };

    // The viewer's own votes, one round trip.
    const mine = new Map<number, ClaimVoteKind>();
    if (user) {
      const { data: votes } = await supabase
        .from("reputation_claim_vote")
        .select("claim_id, kind")
        .eq("user_id", user.id)
        .in("claim_id", rows.map((r) => r.claim_id));
      for (const v of (votes ?? []) as { claim_id: number; kind: ClaimVoteKind }[]) {
        mine.set(v.claim_id, v.kind);
      }
    }

    const claims: ReputationClaim[] = rows.map((r) => ({
      claimId: r.claim_id,
      body: r.body,
      stance: r.stance,
      axisHint: r.axis_hint,
      sources: r.sources ?? [],
      communitySources: r.community_sources ?? 0,
      commercialSources: r.commercial_sources ?? 0,
      asOf: r.as_of,
      agree: r.agree_votes ?? 0,
      disagree: r.disagree_votes ?? 0,
      stale: r.stale_votes ?? 0,
      myVote: mine.get(r.claim_id) ?? null,
    }));

    const live = claims.filter(isClaimLive);
    const rank = (a: ReputationClaim, b: ReputationClaim) =>
      claimScore(b.agree, b.disagree) - claimScore(a.agree, a.disagree);

    const pros = live.filter((c) => c.stance === "pro").sort(rank);
    const cons = live.filter((c) => c.stance === "con").sort(rank);

    const asOf = live.length
      ? live.map((c) => c.asOf).sort()[0]
      : null;
    const commercialLean =
      live.reduce((n, c) => n + c.commercialSources, 0) >
      live.reduce((n, c) => n + c.communitySources, 0);

    return { pros, cons, signedIn, asOf, commercialLean };
  } catch {
    return { ...EMPTY, signedIn };
  }
}
