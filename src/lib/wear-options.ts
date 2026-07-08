/**
 * Pure wear-tap vocabulary (carry + weight_feel), safe to import from client
 * components — no server-only deps. The closed sets mirror the 0046 CHECK
 * constraints; keep the three in sync (SQL, these constants, the type guards).
 */

export const CARRY_OPTIONS = [
  { value: "hand", label: "By the handles" },
  { value: "shoulder", label: "On the shoulder" },
  { value: "crossbody", label: "Crossbody" },
] as const;

export const WEIGHT_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "just_right", label: "Just right" },
  { value: "heavy", label: "Heavy" },
] as const;

export type Carry = (typeof CARRY_OPTIONS)[number]["value"];
export type WeightFeel = (typeof WEIGHT_OPTIONS)[number]["value"];

export function isCarry(v: string): v is Carry {
  return CARRY_OPTIONS.some((o) => o.value === v);
}
export function isWeightFeel(v: string): v is WeightFeel {
  return WEIGHT_OPTIONS.some((o) => o.value === v);
}

export function carryLabel(v: string): string {
  return CARRY_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
export function weightLabel(v: string): string {
  return WEIGHT_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
