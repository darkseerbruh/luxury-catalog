import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import {
  CARRY_OPTIONS,
  WEIGHT_OPTIONS,
  isCarry,
  isWeightFeel,
  type Carry,
  type WeightFeel,
} from "./wear-options";

/**
 * Lived "how you carry it" wear reads, built on the 0046 `bag_wear` schema. Two
 * felt taps the review/axis schema doesn't capture: how the owner actually
 * carries the bag, and how heavy it feels. Deduped against the measured catalog
 * value (strap options, gram weight) — see docs/ux/review-data-leaderboards.md.
 *
 * Degrades to an unavailable/empty state when Supabase env or the migration is
 * absent (the cloud build has no DB credentials, and 0046 is human-gated). When
 * `available` is false the contribution slots for carry/weight stay hidden, so
 * nothing broken ever shows. Vocabulary lives in ./wear-options (client-safe).
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export interface Tally {
  value: string;
  label: string;
  count: number;
}

/** How many "what fits inside" notes to surface on the page (most recent first). */
const FITS_DISPLAY_CAP = 6;

export interface WearSummary {
  /** False when the migration/table is absent — callers hide the taps entirely. */
  available: boolean;
  signedIn: boolean;
  carry: Tally[];
  weight: Tally[];
  totalCarry: number;
  totalWeight: number;
  myCarry: Carry | null;
  myWeightFeel: WeightFeel | null;
  /** A capped list of "what fit inside" notes from owners (most recent first). */
  fitsNotes: string[];
  totalFits: number;
  myFitsNote: string | null;
}

function emptySummary(signedIn: boolean, available: boolean): WearSummary {
  return {
    available,
    signedIn,
    carry: CARRY_OPTIONS.map((o) => ({ value: o.value, label: o.label, count: 0 })),
    weight: WEIGHT_OPTIONS.map((o) => ({ value: o.value, label: o.label, count: 0 })),
    totalCarry: 0,
    totalWeight: 0,
    myCarry: null,
    myWeightFeel: null,
    fitsNotes: [],
    totalFits: 0,
    myFitsNote: null,
  };
}

/**
 * Per-option carry + weight tallies for a variant, plus the viewer's own picks.
 * Reads every wear row for the variant (public RLS) and tallies in JS, exactly
 * like getAxisVotes() aggregates client-side. A query error (most often: table
 * not yet migrated) returns `available: false` so the UI stays clean.
 */
export async function getWear(variantId: number): Promise<WearSummary> {
  const user = await getCurrentUser();
  const signedIn = Boolean(user);
  if (!hasSupabase()) return emptySummary(signedIn, false);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("bag_wear")
    .select("user_id, carry, weight_feel, fits_note, updated_at")
    .eq("variant_id", variantId)
    .order("updated_at", { ascending: false })
    .limit(5000);

  // Table missing / not migrated / any read error → hide the taps, don't crash.
  if (error || !data) return emptySummary(signedIn, false);

  const rows = data as {
    user_id: string;
    carry: string | null;
    weight_feel: string | null;
    fits_note: string | null;
  }[];

  const carryCounts = new Map<string, number>();
  const weightCounts = new Map<string, number>();
  let myCarry: Carry | null = null;
  let myWeightFeel: WeightFeel | null = null;
  let myFitsNote: string | null = null;
  const fitsAll: string[] = [];

  for (const r of rows) {
    if (r.carry && isCarry(r.carry)) carryCounts.set(r.carry, (carryCounts.get(r.carry) ?? 0) + 1);
    if (r.weight_feel && isWeightFeel(r.weight_feel))
      weightCounts.set(r.weight_feel, (weightCounts.get(r.weight_feel) ?? 0) + 1);
    const note = r.fits_note?.trim();
    if (note) fitsAll.push(note);
    if (user && r.user_id === user.id) {
      if (r.carry && isCarry(r.carry)) myCarry = r.carry;
      if (r.weight_feel && isWeightFeel(r.weight_feel)) myWeightFeel = r.weight_feel;
      if (note) myFitsNote = note;
    }
  }

  const carry: Tally[] = CARRY_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
    count: carryCounts.get(o.value) ?? 0,
  }));
  const weight: Tally[] = WEIGHT_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
    count: weightCounts.get(o.value) ?? 0,
  }));

  return {
    available: true,
    signedIn,
    carry,
    weight,
    totalCarry: carry.reduce((n, t) => n + t.count, 0),
    totalWeight: weight.reduce((n, t) => n + t.count, 0),
    myCarry,
    myWeightFeel,
    fitsNotes: fitsAll.slice(0, FITS_DISPLAY_CAP),
    totalFits: fitsAll.length,
    myFitsNote,
  };
}
