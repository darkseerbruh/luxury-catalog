"use server";

import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { tasteIdentity, type Mark, type Vibe, type Logo } from "./taste-identity";
import { getShopProducts } from "./listings";

/** The raw quiz answers sent from the client. */
export interface TasteQuizAnswers {
  occasions?: string[];
  vibe?: Record<string, Mark>;
  logo?: Logo | null;
  carry?: Record<string, Mark>;
  finishes?: Record<string, Mark>;
  hardware?: Record<string, Mark>;
  houses?: Record<string, Mark>;
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /column .* does not exist/i.test(error.message ?? "");
}

/**
 * Save a signed-in user's Style-read result. The feeling read is recomputed
 * server-side from the answers (never trust a client-sent string). No-ops cleanly
 * if the user is signed out or migration 0034 isn't applied yet.
 */
export async function saveTasteResult(quiz: TasteQuizAnswers): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const identity = tasteIdentity({
    vibe: quiz.vibe as Partial<Record<Vibe, Mark>> | undefined,
    logo: quiz.logo ?? null,
    hardware: quiz.hardware,
    finishes: quiz.finishes,
  });

  const supabase = await createServerSupabase();
  const row = { id: user.id, taste_quiz: quiz, taste_identity: identity };
  const { error } = await supabase.from("profile").upsert(row as { id: string }, { onConflict: "id" });

  // Pre-0034: the columns don't exist yet. Degrade silently, don't surface an error.
  if (error && !isMissingColumn(error)) return { ok: false };
  return { ok: !error };
}

export interface StyleReadMatch {
  variantId: number;
  brandName: string;
  styleName: string;
  fromPrice: number;
  currency: string | null;
}

function lovedKeys(marks: Record<string, Mark> | undefined): string[] {
  return marks ? Object.keys(marks).filter((k) => marks[k] === "love") : [];
}
function notKeys(marks: Record<string, Mark> | undefined): string[] {
  return marks ? Object.keys(marks).filter((k) => marks[k] === "not") : [];
}

/**
 * Real bags to start someone on after their Style read. Honest v1: pulls live
 * shop products, drops any "not for me" house, and floats the loved houses to the
 * front. Attribute-level (vibe/material/hardware) matching needs per-bag fields we
 * don't carry yet, so we don't claim it. Always returns [] on any failure.
 */
export async function getStyleReadMatches(quiz: TasteQuizAnswers): Promise<StyleReadMatch[]> {
  try {
    const loved = new Set(lovedKeys(quiz.houses));
    const excluded = new Set(notKeys(quiz.houses));
    const res = await getShopProducts({}, 60);
    const products = res.products
      .filter((p) => !excluded.has(p.brandName))
      .sort((a, b) => (loved.has(b.brandName) ? 1 : 0) - (loved.has(a.brandName) ? 1 : 0));
    // Dedupe by variant so a rail doesn't repeat the same bag.
    const seen = new Set<number>();
    const out: StyleReadMatch[] = [];
    for (const p of products) {
      if (seen.has(p.variantId)) continue;
      seen.add(p.variantId);
      out.push({ variantId: p.variantId, brandName: p.brandName, styleName: p.styleName, fromPrice: p.fromPrice, currency: p.currency });
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}
