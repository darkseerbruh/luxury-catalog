"use server";

import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { tasteIdentity, type Mark, type Vibe, type Logo } from "./taste-identity";
import { getShopProducts, type ShopProduct } from "./listings";
import { OCCASIONS, type Occasion } from "./occasions";

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

export interface StyleReadBoard {
  occasion: Occasion;
  label: string;
  bags: StyleReadMatch[];
}

const OCC_BOARD = new Map<Occasion, string>(OCCASIONS.map((o) => [o.value, o.board]));

/**
 * A transparent occasion guess from the size and the style name. We don't carry a
 * per-bag occasion field, so this is a heuristic (labeled as such in the UI copy),
 * not a measured fact: clutch/mini reads evening, weekender/large reads travel,
 * tote/laptop reads work, the rest is everyday.
 */
function occasionOf(sizeLabel: string | null, styleName: string): Occasion {
  const s = (sizeLabel ?? "").toLowerCase();
  const n = styleName.toLowerCase();
  if (/clutch|minaudi|kiss|evening|wallet on chain|\bwoc\b/.test(n) || /\bmini\b|micro/.test(s)) return "evening";
  if (/keepall|weekend|duffle|luggage|garment|carryall|\bgm\b/.test(n) || /\b(45|50|55)\b|large/.test(s)) return "travel";
  if (/tote|cabas|shopper|business|laptop/.test(n)) return "work";
  return "everyday";
}

const toMatch = (p: ShopProduct): StyleReadMatch => ({
  variantId: p.variantId,
  brandName: p.brandName,
  styleName: p.styleName,
  fromPrice: p.fromPrice,
  currency: p.currency,
});

/**
 * Per-occasion boards of real bags after the Style read. Matches on the signals
 * the shop actually carries: loved hardware and loved houses boost a bag, "not for
 * me" hardware/houses remove it (by set subtraction). Vibe/material matching needs
 * per-bag fields we don't store, so we don't claim it. Always returns [] on failure.
 */
export async function getStyleReadBoards(quiz: TasteQuizAnswers): Promise<StyleReadBoard[]> {
  try {
    const lovedHw = lovedKeys(quiz.hardware).slice(0, 2);
    const notHw = notKeys(quiz.hardware).slice(0, 1);
    const lovedHouses = new Set(lovedKeys(quiz.houses));
    const notHouses = new Set(notKeys(quiz.houses));

    const scored = new Map<number, { p: ShopProduct; score: number }>();
    const add = (prods: ShopProduct[], bump: number) => {
      for (const p of prods) {
        const e = scored.get(p.variantId);
        if (e) e.score += bump;
        else scored.set(p.variantId, { p, score: bump });
      }
    };

    const base = await getShopProducts({}, 80);
    add(base.products, 0);
    for (const h of lovedHw) {
      const r = await getShopProducts({ hardware: h }, 40);
      add(r.products, 1);
    }

    const excludeIds = new Set<number>();
    for (const h of notHw) {
      const r = await getShopProducts({ hardware: h }, 60);
      for (const p of r.products) excludeIds.add(p.variantId);
    }

    const items = [...scored.values()].filter(
      ({ p }) => !excludeIds.has(p.variantId) && !notHouses.has(p.brandName),
    );
    for (const it of items) if (lovedHouses.has(it.p.brandName)) it.score += 1;
    items.sort((a, b) => b.score - a.score);

    const chosen: Occasion[] =
      quiz.occasions && quiz.occasions.length
        ? (quiz.occasions.filter((o): o is Occasion => OCC_BOARD.has(o as Occasion)))
        : ["everyday"];

    const used = new Set<number>();
    const boards: StyleReadBoard[] = [];
    for (const occ of chosen) {
      let lane = items.filter((it) => !used.has(it.p.variantId) && occasionOf(it.p.sizeLabel, it.p.styleName) === occ).slice(0, 6);
      if (lane.length < 2) {
        const extra = items.filter((it) => !used.has(it.p.variantId) && !lane.includes(it)).slice(0, 6 - lane.length);
        lane = lane.concat(extra);
      }
      lane.forEach((it) => used.add(it.p.variantId));
      if (lane.length > 0) boards.push({ occasion: occ, label: OCC_BOARD.get(occ) ?? occ, bags: lane.map((it) => toMatch(it.p)) });
    }
    return boards;
  } catch {
    return [];
  }
}
