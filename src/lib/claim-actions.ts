"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/**
 * Vote on a Reputation claim: agree, disagree, or flag it as no longer true.
 *
 * Re-voting is an upsert on (user_id, claim_id), matching how review and
 * bag_axis_vote behave. Voting the SAME kind twice clears the vote, so a tap is
 * its own undo without a separate control.
 *
 * The claim tallies are kept by a DB trigger (0062), so nothing here recomputes
 * counts and two concurrent votes cannot race the totals out of sync.
 */

export interface ClaimVoteResult {
  ok: boolean;
  error?: string;
}

const KINDS = ["agree", "disagree", "stale"] as const;

function isKind(v: string): v is (typeof KINDS)[number] {
  return (KINDS as readonly string[]).includes(v);
}

export async function voteOnClaim(input: {
  claimId: number;
  kind: string;
  /** Path to revalidate so the new tally shows immediately. */
  path?: string;
}): Promise<ClaimVoteResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to weigh in." };
  if (!Number.isInteger(input.claimId)) return { ok: false, error: "Unknown claim." };
  if (!isKind(input.kind)) return { ok: false, error: "Unknown vote." };

  try {
    const supabase = await createServerSupabase();

    // Tapping the same kind again clears it, so the control undoes itself.
    const { data: existing } = await supabase
      .from("reputation_claim_vote")
      .select("claim_vote_id, kind")
      .eq("user_id", user.id)
      .eq("claim_id", input.claimId)
      .maybeSingle();

    if (existing && (existing as { kind: string }).kind === input.kind) {
      const { error } = await supabase
        .from("reputation_claim_vote")
        .delete()
        .eq("claim_vote_id", (existing as { claim_vote_id: number }).claim_vote_id);
      if (error) return { ok: false, error: "Could not clear your vote." };
    } else {
      const { error } = await supabase
        .from("reputation_claim_vote")
        .upsert(
          { user_id: user.id, claim_id: input.claimId, kind: input.kind },
          { onConflict: "user_id,claim_id" },
        );
      if (error) return { ok: false, error: "Could not save your vote." };
    }

    if (input.path) revalidatePath(input.path);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save your vote." };
  }
}
