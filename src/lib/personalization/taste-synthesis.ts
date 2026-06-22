/**
 * Phase-4 LLM taste synthesis.
 *
 * synthesizeTasteProfile  — Claude Haiku over pre-aggregated Phase-1 signals,
 *   structured output (JSON schema), prompt-cached system prefix.
 *   Returns a plain-English taste summary + per-rec why strings.
 *
 * generateWhyStrings      — batch "why you'll love this" for a list of recs.
 *
 * All output is RAG-grounded: Claude only writes about attributes present in
 * the profile/catalog record. Never invents authentication facts or bag specs.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { PersonalizationProfile } from "./types";
import type { ScoredVariant } from "./ranker";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TasteSummary {
  /** 1–2 sentence plain-English description of the user's taste. */
  headline: string;
  /** 3 short bullet points (each ≤12 words) for the taste profile page. */
  bullets: string[];
  /** Internal taste label (e.g. "quiet collector", "reseller eye"). */
  tasteLabel: string;
}

export interface WhyString {
  variantId: number;
  why: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function profileSummaryText(profile: PersonalizationProfile): string {
  const topBrands = Object.entries(profile.brandAffinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, score]) => `${name} (${score.toFixed(1)})`)
    .join(", ");

  const topAttrs = Object.entries(profile.attributeAffinities)
    .flatMap(([dim, vals]) =>
      Object.entries(vals ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([val, score]) => `${dim}:${val} (${score.toFixed(1)})`)
    )
    .join(", ");

  const counts = profile.signalCounts;
  return [
    `persona: ${profile.persona ?? "unknown"}`,
    `budget_band: ${profile.budgetBand ?? "unknown"}`,
    `intent: ${profile.intent ?? "unknown"}`,
    `top_brands: ${topBrands || "none yet"}`,
    `top_attributes: ${topAttrs || "none yet"}`,
    `interactions: ${counts.total_interactions} (want:${counts.want_count} have:${counts.have_count} had:${counts.had_count} watchlist:${counts.watchlist_count} reviews:${counts.review_count})`,
    `quiz_completeness: ${counts.quiz_completeness}%`,
  ].join("\n");
}

function variantSummaryText(v: ScoredVariant): string {
  const style = Array.isArray(v.row.style) ? v.row.style[0] : v.row.style;
  const brand = style
    ? Array.isArray((style as { brand: unknown }).brand)
      ? ((style as { brand: { name: string }[] }).brand[0]?.name ?? "")
      : ((style as { brand: { name: string } | null }).brand?.name ?? "")
    : "";
  const material = Array.isArray(v.row.exterior_material)
    ? (v.row.exterior_material[0] as { material_type: string | null } | null)?.material_type ?? null
    : (v.row.exterior_material as { material_type: string | null } | null)?.material_type ?? null;

  return [
    brand && `brand: ${brand}`,
    (style as { name?: string } | null)?.name && `style: ${(style as { name: string }).name}`,
    (style as { silhouette?: string | null } | null)?.silhouette && `silhouette: ${(style as { silhouette: string }).silhouette}`,
    v.row.size_label && `size: ${v.row.size_label}`,
    v.row.exterior_colorway && `color: ${v.row.exterior_colorway}`,
    v.row.hardware_color && `hardware: ${v.row.hardware_color}`,
    material && `material: ${material}`,
  ].filter(Boolean).join(", ");
}

// ── Cached system prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the taste engine for Luxury Catalog, a designer-handbag reference app. Your job is to translate a user's aggregated signals into warm, precise, unpretentious copy — the voice of a knowledgeable friend, never a salesperson.

Rules (non-negotiable):
- Only describe attributes that appear in the data. Never invent bag specs, authentication facts, or affinities not present.
- No superlatives (stunning, iconic, must-have). No snobbery. No price-investment framing.
- Write in second person ("you"). Keep it short — luxury readers skim.
- The "why" for each bag must reference ≥1 specific attribute from that bag's data (brand, silhouette, color, hardware, material, size). No generic copy.
- Respond ONLY with the JSON object described in the user turn — no markdown, no preamble.`;

// ── Taste summary (profile page) ──────────────────────────────────────────────

const TASTE_SUMMARY_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: { type: "string" },
    bullets: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
    tasteLabel: { type: "string" },
  },
  required: ["headline", "bullets", "tasteLabel"],
  additionalProperties: false,
};

/**
 * Generate a plain-English taste profile summary for display on the /taste page.
 * Returns null when the API key is unset or the profile is too sparse.
 */
export async function synthesizeTasteProfile(
  profile: PersonalizationProfile
): Promise<TasteSummary | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (profile.signalCounts.total_interactions < 2) return null;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate a taste summary for this user. Return JSON matching this schema: ${JSON.stringify(TASTE_SUMMARY_SCHEMA)}

User signals:
${profileSummaryText(profile)}

The headline should be 1–2 sentences capturing their style in warm, specific language. Bullets should each be ≤12 words. tasteLabel is a 2–4 word internal label (e.g. "quiet collector", "classic investment eye", "thrift maximalist").`,
        },
      ],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    return JSON.parse(text) as TasteSummary;
  } catch (err) {
    console.error("synthesizeTasteProfile error:", err);
    return null;
  }
}

// ── Per-rec why strings ───────────────────────────────────────────────────────

const WHY_SCHEMA = {
  type: "object" as const,
  properties: {
    whys: {
      type: "array",
      items: {
        type: "object",
        properties: {
          variant_id: { type: "number" },
          why: { type: "string" },
        },
        required: ["variant_id", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["whys"],
  additionalProperties: false,
};

/**
 * Generate natural-language "why you'll love this" strings for a batch of ranked variants.
 * Returns a map of variantId → why string. Empty map on failure/no key.
 */
export async function generateWhyStrings(
  profile: PersonalizationProfile,
  variants: ScoredVariant[]
): Promise<Map<number, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || variants.length === 0) return new Map();

  const client = new Anthropic({ apiKey });

  const bagList = variants
    .map((v) => `variant_id ${v.variantId}: ${variantSummaryText(v)}`)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write a short "why you'll love this" (≤18 words) for each bag below, grounded in the user's signals and the bag's attributes. Return JSON matching: ${JSON.stringify(WHY_SCHEMA)}

User signals:
${profileSummaryText(profile)}

Bags:
${bagList}`,
        },
      ],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const parsed = JSON.parse(text) as { whys: { variant_id: number; why: string }[] };
    return new Map(parsed.whys.map((w) => [w.variant_id, w.why]));
  } catch (err) {
    console.error("generateWhyStrings error:", err);
    return new Map();
  }
}
