"use client";

import { useState, useTransition } from "react";
import { voteOnClaim } from "@/lib/claim-actions";
import type { ClaimVoteKind } from "@/lib/claims";

/**
 * Agree / disagree on one claim, plus a quieter "not true any more".
 *
 * Optimistic: the count moves on tap and rolls back if the write fails, because a
 * one-tap control that feels laggy does not get tapped twice. Tapping the same
 * choice again clears it, so nothing is a trap.
 */
export default function ClaimVote({
  claimId,
  agree,
  disagree,
  myVote,
  signedIn,
  path,
}: {
  claimId: number;
  agree: number;
  disagree: number;
  myVote: ClaimVoteKind | null;
  signedIn: boolean;
  path: string;
}) {
  const [vote, setVote] = useState<ClaimVoteKind | null>(myVote);
  const [counts, setCounts] = useState({ agree, disagree });
  const [pending, start] = useTransition();

  function cast(kind: ClaimVoteKind) {
    if (!signedIn) return;
    const prevVote = vote;
    const prevCounts = counts;

    // Optimistic: remove the old vote's weight, add the new one (or clear).
    const next = { ...counts };
    if (prevVote === "agree") next.agree -= 1;
    if (prevVote === "disagree") next.disagree -= 1;
    const clearing = prevVote === kind;
    if (!clearing) {
      if (kind === "agree") next.agree += 1;
      if (kind === "disagree") next.disagree += 1;
    }
    setVote(clearing ? null : kind);
    setCounts(next);

    start(async () => {
      const res = await voteOnClaim({ claimId, kind, path });
      if (!res.ok) {
        setVote(prevVote);
        setCounts(prevCounts);
      }
    });
  }

  const btn = (active: boolean) =>
    `flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
      active
        ? "border-gold bg-gold/10 text-gold"
        : "border-border text-muted hover:border-gold/50 hover:text-foreground"
    } ${signedIn ? "" : "cursor-default opacity-60"} ${pending ? "opacity-70" : ""}`;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => cast("agree")}
        className={btn(vote === "agree")}
        aria-pressed={vote === "agree"}
        aria-label={signedIn ? "That matches my experience" : "Log in to weigh in"}
        title={signedIn ? "That matches my experience" : "Log in to weigh in"}
      >
        <span aria-hidden>👍</span>
        <span className="tabular-nums">{counts.agree}</span>
      </button>

      <button
        type="button"
        onClick={() => cast("disagree")}
        className={btn(vote === "disagree")}
        aria-pressed={vote === "disagree"}
        aria-label={signedIn ? "Not my experience" : "Log in to weigh in"}
        title={signedIn ? "Not my experience" : "Log in to weigh in"}
      >
        <span aria-hidden>👎</span>
        <span className="tabular-nums">{counts.disagree}</span>
      </button>

      {signedIn && (
        <button
          type="button"
          onClick={() => cast("stale")}
          className={`text-[0.7rem] transition-colors ${
            vote === "stale" ? "text-gold" : "text-muted/60 hover:text-muted"
          }`}
          aria-pressed={vote === "stale"}
          title="This was true once, but not any more"
        >
          out of date
        </button>
      )}
    </div>
  );
}
