/**
 * "The ones you reach for" — the periodic check-in, and the counts it produces.
 *
 * The owner's diagnosis of why a daily log fails, in her words: *"I never populate
 * the wearing today until I log in once or whenever."* A daily prompt only collects
 * from daily visitors. So this asks every few months instead, in one pass over the
 * bags someone owns.
 *
 * What it captures is the bag you grab without thinking. That is behaviour rather
 * than opinion, which makes it a better read on whether a bag is actually good than
 * any star rating: nobody talks themselves into reaching for something.
 */

/** Months between check-ins. Long on purpose; this is a slow-moving signal. */
export const CHECKIN_INTERVAL_MONTHS = 4;

/** Below this many owned bags the question is not worth asking. */
export const CHECKIN_MIN_BAGS = 3;

export interface CheckinEligibility {
  due: boolean;
  reason: "never-asked" | "interval-elapsed" | "too-few-bags" | "not-yet";
}

/**
 * Is this member due a check-in?
 *
 * Pure so it is testable without a clock or a database: pass `now` explicitly.
 */
export function checkinDue(input: {
  ownedCount: number;
  lastCheckinAt: string | Date | null;
  now: Date;
}): CheckinEligibility {
  if (input.ownedCount < CHECKIN_MIN_BAGS) {
    // Asking someone with one bag which they reach for is a silly question.
    return { due: false, reason: "too-few-bags" };
  }
  if (!input.lastCheckinAt) return { due: true, reason: "never-asked" };

  const last = new Date(input.lastCheckinAt);
  if (Number.isNaN(last.getTime())) return { due: true, reason: "never-asked" };

  const monthsSince =
    (input.now.getFullYear() - last.getFullYear()) * 12 +
    (input.now.getMonth() - last.getMonth());

  return monthsSince >= CHECKIN_INTERVAL_MONTHS
    ? { due: true, reason: "interval-elapsed" }
    : { due: false, reason: "not-yet" };
}

/**
 * How the count reads on a bag page.
 *
 * Hidden below a floor for the same reason the shelf counts are: "1 owner reaches
 * for this" is negative social proof. And the share only appears alongside the
 * absolute number, so a 1-of-2 never renders as a triumphant 50%.
 */
export const MOST_WORN_MIN_OWNERS = 4;

export interface MostWornRead {
  show: boolean;
  reachFor: number;
  owners: number;
  share: number | null;
  label: string | null;
}

export function mostWornRead(reachFor: number, owners: number): MostWornRead {
  if (owners < MOST_WORN_MIN_OWNERS || reachFor === 0) {
    return { show: false, reachFor, owners, share: null, label: null };
  }
  const share = Math.round((reachFor / owners) * 100);
  return {
    show: true,
    reachFor,
    owners,
    share,
    label: `${reachFor} of ${owners} owners reach for this one`,
  };
}
