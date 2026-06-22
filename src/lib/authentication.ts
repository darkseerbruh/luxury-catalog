import { createServerSupabase } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reads for the authentication-marketplace on-ramp (lead-capture v1). All
 * resilient: empty on missing env / unapplied 0017. RLS does the access control
 * (requester sees own; authenticator sees open + claimed; admin sees all), so
 * these use the normal server client — no service-role key needed.
 *
 * The claiming-authenticator's handle is resolved with a SEPARATE profile lookup
 * (claimed_by references auth.users, so there's no FK for PostgREST to embed
 * `profile` through).
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export type AuthRequestStatus = "open" | "claimed" | "closed";

export interface AuthRequest {
  requestId: number;
  variantId: number | null;
  details: string | null;
  status: AuthRequestStatus;
  createdAt: string;
  claimedAt: string | null;
  /** Revealed to the claiming authenticator + the requester only. */
  contactEmail: string | null;
  brandName: string | null;
  styleName: string | null;
  /** Handle of the authenticator who claimed it (for the requester's view). */
  claimedByHandle: string | null;
}

type Row = {
  request_id: number;
  variant_id: number | null;
  details: string | null;
  status: AuthRequestStatus;
  created_at: string;
  claimed_at: string | null;
  claimed_by?: string | null;
  contact_email?: string | null;
  variant?: unknown;
};

function bagOf(row: Row): { brandName: string | null; styleName: string | null } {
  const v = Array.isArray(row.variant) ? row.variant[0] : row.variant;
  const s = (v as { style?: unknown } | null)?.style;
  const so = (Array.isArray(s) ? s[0] : s) as { name?: string | null; brand?: unknown } | null;
  const brand = so?.brand;
  const bo = (Array.isArray(brand) ? brand[0] : brand) as { name?: string | null } | null;
  return { brandName: bo?.name ?? null, styleName: so?.name ?? null };
}

const BAG_EMBED = "variant:variant_id(style:style_id(name, brand:brand_id(name)))";

/** Map of user_id → handle, fetched in one query. */
async function handlesFor(supabase: SupabaseClient, userIds: (string | null | undefined)[]): Promise<Map<string, string | null>> {
  const ids = [...new Set(userIds.filter((x): x is string => Boolean(x)))];
  const out = new Map<string, string | null>();
  if (ids.length === 0) return out;
  const { data } = await supabase.from("profile").select("id, handle").in("id", ids);
  for (const r of (data as { id: string; handle: string | null }[] | null) ?? []) {
    out.set(r.id, r.handle ?? null);
  }
  return out;
}

function mapRow(r: Row, handles: Map<string, string | null>, withContact: boolean): AuthRequest {
  const { brandName, styleName } = bagOf(r);
  return {
    requestId: r.request_id,
    variantId: r.variant_id,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
    claimedAt: r.claimed_at,
    contactEmail: withContact ? r.contact_email ?? null : null,
    brandName,
    styleName,
    claimedByHandle: r.claimed_by ? handles.get(r.claimed_by) ?? null : null,
  };
}

/** The signed-in user's own requests (newest first). */
export async function getMyAuthRequests(userId: string): Promise<AuthRequest[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("authentication_request")
    .select(`request_id, variant_id, details, status, created_at, claimed_at, claimed_by, contact_email, ${BAG_EMBED}`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as Row[];
  const handles = await handlesFor(supabase, rows.map((r) => r.claimed_by));
  return rows.map((r) => mapRow(r, handles, true));
}

/** Open requests for the authenticator queue. Contact email withheld until claimed. */
export async function getOpenAuthRequests(): Promise<AuthRequest[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("authentication_request")
    .select(`request_id, variant_id, details, status, created_at, claimed_at, claimed_by, ${BAG_EMBED}`)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as Row[];
  return rows.map((r) => mapRow(r, new Map(), false));
}

/** Requests this authenticator has claimed (contact email included). */
export async function getMyClaims(userId: string): Promise<AuthRequest[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("authentication_request")
    .select(`request_id, variant_id, details, status, created_at, claimed_at, claimed_by, contact_email, ${BAG_EMBED}`)
    .eq("claimed_by", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const rows = data as unknown as Row[];
  const handles = await handlesFor(supabase, rows.map((r) => r.claimed_by));
  return rows.map((r) => mapRow(r, handles, true));
}
