/**
 * Pure, DB-free contributor-tier + XP logic (the "names matter" ladder).
 *
 * Tier is DERIVED, never stored: it is a function of a user's earned
 * contribution points, their approved-photo count, whether they keep a closet,
 * and the admin-granted is_authenticator flag (0006). Keeping it pure makes the
 * ladder unit-testable and keeps the rules in one place. See
 * docs/handoff.md "contributor tier ladder".
 */

export type Tier =
  | "aficionado"
  | "collector"
  | "connoisseur"
  | "authenticator"
  | "curator";

export interface TierInputs {
  /** Has saved any bag to their closet (want/have/had). */
  hasCloset: boolean;
  /** Count of their photos that reached approved/featured. */
  approvedPhotos: number;
  /** Earned contribution points. */
  points: number;
  /** Admin-granted trust flag (0006). The marketplace-staffing tier. */
  isAuthenticator: boolean;
  /** Admins are implicitly trusted (auto-publish), but keep their derived tier. */
  isAdmin?: boolean;
}

/** Points at/above which an Authenticator is recognised as a Curator. */
export const CURATOR_POINTS = 500;
/** Approved photos at/above which a contributor becomes a Connoisseur. */
export const CONNOISSEUR_PHOTOS = 1;

/**
 * The ladder, highest-qualifying first:
 *  - Curator        — elite Authenticator (sustained, high-XP)
 *  - Authenticator  — admin-verified; their uploads auto-publish
 *  - Connoisseur    — has approved photo contributions
 *  - Collector      — keeps a closet
 *  - Aficionado     — signed up
 */
export function deriveTier(i: TierInputs): Tier {
  if (i.isAuthenticator && i.points >= CURATOR_POINTS) return "curator";
  if (i.isAuthenticator) return "authenticator";
  if (i.approvedPhotos >= CONNOISSEUR_PHOTOS) return "connoisseur";
  if (i.hasCloset) return "collector";
  return "aficionado";
}

/**
 * Trusted tiers skip the moderation queue (the hybrid-moderation reward). Only
 * admin-verified Authenticators (and admins) auto-publish; earned points alone
 * never unlock it, so the gate can't be farmed.
 */
export function canAutoPublish(i: Pick<TierInputs, "isAuthenticator" | "isAdmin">): boolean {
  return Boolean(i.isAdmin) || i.isAuthenticator;
}

export interface TierMeta {
  label: string;
  /** Short, luxury-coded description of how you reach / what you get at the tier. */
  blurb: string;
  /** 1..5 rank for sorting / progress display. */
  rank: number;
}

export const TIER_META: Record<Tier, TierMeta> = {
  aficionado: {
    label: "Aficionado",
    blurb: "You're in. Save bags and start a closet to climb.",
    rank: 1,
  },
  collector: {
    label: "Collector",
    blurb: "You keep a closet. Add approved photos to become a Connoisseur.",
    rank: 2,
  },
  connoisseur: {
    label: "Connoisseur",
    blurb: "Your reference photos are live in the catalog.",
    rank: 3,
  },
  authenticator: {
    label: "Authenticator",
    blurb: "Verified expert — your contributions publish without review.",
    rank: 4,
  },
  curator: {
    label: "Curator",
    blurb: "Elite. You shape the catalog and get first access to what's next.",
    rank: 5,
  },
};

/** XP for an approved photo, weighted by how rare a photo of that bag is. */
export function photoPoints(existingApprovedForVariant: number): number {
  if (existingApprovedForVariant <= 0) return 20; // rare find / the first photo
  if (existingApprovedForVariant <= 2) return 12;
  if (existingApprovedForVariant <= 5) return 8;
  return 5; // a well-covered bag — still useful, worth less
}

/** Bonus XP when a photo is promoted to the featured hero. */
export const FEATURED_BONUS = 25;

/**
 * Points to claw back when a previously-approved photo is removed/rejected. We
 * record `points_awarded` per photo and reverse exactly that, so the ledger
 * stays honest regardless of the rarity weighting at award time.
 */
export function reversalPoints(pointsAwarded: number): number {
  return pointsAwarded > 0 ? -pointsAwarded : 0;
}
