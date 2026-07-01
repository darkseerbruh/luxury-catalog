import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getStyleShopData } from "@/lib/article-shop";

export const dynamic = "force-dynamic";

const VISION_PROMPT = `You are an expert luxury handbag authenticator and cataloger with deep knowledge of Chanel, Hermès, Louis Vuitton, Coach, Gucci, Prada, Fendi, Celine, Dior, Bottega Veneta, Kate Spade, and Burberry.

Analyze this image and identify the bag. Respond with a JSON object ONLY (no markdown, no surrounding text):

{
  "brand": "exact brand name (e.g. Chanel, Hermès, Coach) or null if not identifiable",
  "style": "style/model name (e.g. Classic Flap, Birkin, Tabby) or null if not identifiable",
  "sizeLabel": "size if visible or inferable (e.g. '30', 'Medium', 'MM', 'Jumbo') or null",
  "colorway": "exterior color description (e.g. 'Black', 'Gold', 'Caramel') or null",
  "hardwareColor": "gold/silver/ruthenium/palladium/antique gold or null",
  "hardwareType": "turn-lock/clasp/zipper/push-lock/padlock or null",
  "materialType": "material description if identifiable (e.g. Caviar leather, Togo leather, Canvas) or null",
  "visibleAuthMarkers": ["list only authentication markers you can CLEARLY see in this image — date codes, stamps, serial numbers, hardware engravings, stitching patterns, etc. If none visible, use []"],
  "madeIn": "the country from a visible 'Made in ___' stamp/label, exactly as written (e.g. 'Italy', 'France', 'China'), or null if no origin text is clearly legible",
  "confidence": "high if brand+style clearly identifiable, medium if probable, low if uncertain",
  "notes": "any other relevant observations about condition, authenticity indicators, or features"
}

Critical rules:
- Only report what is clearly visible. Do not guess or invent authentication markers.
- If you cannot clearly identify the brand, set brand to null.
- If you cannot clearly identify the style/model, set style to null.
- visibleAuthMarkers must only contain things you can actually see in the image.
- madeIn must be null unless the origin text is actually legible in the photo. Do not infer it.`;

interface IdentificationResult {
  brand: string | null;
  style: string | null;
  sizeLabel: string | null;
  colorway: string | null;
  hardwareColor: string | null;
  hardwareType: string | null;
  materialType: string | null;
  visibleAuthMarkers: string[];
  madeIn: string | null;
  confidence: "high" | "medium" | "low";
  notes: string | null;
}

/**
 * Houses where a visible "Made in ___" is a hard authenticity signal, with the
 * countries a genuine bag is actually produced in. A legible origin OUTSIDE this
 * set is a house-confirmed dealbreaker (the strongest thing a photo can show).
 * Sourced from docs/research-drafts/authentication-markers-brief.md (2026-06-30).
 * Mass-market houses (Coach, Kate Spade, Michael Kors) are deliberately ABSENT:
 * they produce in China/Vietnam/Philippines, so origin is not a tell for them.
 */
const HOUSE_ORIGINS: Record<string, string[]> = {
  chanel: ["france", "italy"],
  hermes: ["france"],
  "louis vuitton": ["france", "spain", "italy", "usa", "united states", "germany"],
  gucci: ["italy"],
  dior: ["france", "italy"],
  "christian dior": ["france", "italy"],
  prada: ["italy"],
  fendi: ["italy"],
  celine: ["italy"],
  "saint laurent": ["italy"],
  ysl: ["italy"],
  "bottega veneta": ["italy"],
  balenciaga: ["italy"],
  goyard: ["france"],
  loewe: ["spain"],
};

/** A house-confirmed dealbreaker from the origin stamp, or null. Only fires when
 * the brand is in HOUSE_ORIGINS AND a country is legible AND it is not an allowed
 * origin. Everything else falls through (no false dealbreakers). */
function originHardFlag(brand: string | null, madeIn: string | null): { reason: string } | null {
  if (!brand || !madeIn) return null;
  const allowed = HOUSE_ORIGINS[brand.trim().toLowerCase()];
  if (!allowed) return null;
  const where = madeIn.trim().toLowerCase();
  if (allowed.some((c) => where.includes(c) || c.includes(where))) return null;
  const label = allowed[0].charAt(0).toUpperCase() + allowed[0].slice(1);
  return {
    reason: `A genuine ${brand} is made in ${label}${allowed.length > 1 ? " (or a few other countries), never" : ", never"} in ${madeIn.trim()}. If that label is what it says, this is a dealbreaker.`,
  };
}

interface CatalogMatch {
  styleId: number;
  styleName: string;
  brandName: string;
  variantId: number | null;
  sizeLabel: string | null;
  exteriorColorway: string | null;
  hardwareColor: string | null;
}

function embeddedName(relation: unknown): string {
  const row = Array.isArray(relation) ? relation[0] : relation;
  return (row as { name?: string } | null | undefined)?.name ?? "";
}

async function findCatalogMatch(
  identification: IdentificationResult
): Promise<CatalogMatch | null> {
  const supabase = getSupabase();

  // Try style-level search first (most specific)
  if (identification.style) {
    const { data: styleRows } = await supabase
      .from("style")
      .select(
        "style_id, name, brand:brand_id(name), variant(variant_id, size_label, exterior_colorway, hardware_color)"
      )
      .ilike("name", `%${identification.style}%`)
      .limit(10);

    if (styleRows && styleRows.length > 0) {
      // Filter further by brand if known
      const filtered = identification.brand
        ? styleRows.filter(
            (s) =>
              embeddedName(s.brand)
                .toLowerCase()
                .includes(identification.brand!.toLowerCase())
          )
        : styleRows;

      const best = filtered[0] ?? styleRows[0];
      const variants = (best.variant ?? []) as {
        variant_id: number;
        size_label: string | null;
        exterior_colorway: string | null;
        hardware_color: string | null;
      }[];

      // Score variants by how well they match color/hardware
      const scored = variants.map((v) => {
        let score = 0;
        if (
          identification.colorway &&
          v.exterior_colorway
            ?.toLowerCase()
            .includes(identification.colorway.toLowerCase())
        )
          score += 2;
        if (
          identification.hardwareColor &&
          v.hardware_color
            ?.toLowerCase()
            .includes(identification.hardwareColor.toLowerCase())
        )
          score += 2;
        if (
          identification.sizeLabel &&
          v.size_label
            ?.toLowerCase()
            .includes(identification.sizeLabel.toLowerCase())
        )
          score += 1;
        return { ...v, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const matched = scored[0] ?? null;

      return {
        styleId: best.style_id,
        styleName: best.name,
        brandName: embeddedName(best.brand),
        variantId: matched?.variant_id ?? null,
        sizeLabel: matched?.size_label ?? null,
        exteriorColorway: matched?.exterior_colorway ?? null,
        hardwareColor: matched?.hardware_color ?? null,
      };
    }
  }

  // Fall back to brand-level search
  if (identification.brand) {
    const { data: brandRow } = await supabase
      .from("brand")
      .select("brand_id, name, style(style_id, name)")
      .ilike("name", `%${identification.brand}%`)
      .single();

    if (brandRow) {
      return {
        styleId: 0,
        styleName: "",
        brandName: brandRow.name,
        variantId: null,
        sizeLabel: null,
        exteriorColorway: null,
        hardwareColor: null,
      };
    }
  }

  return null;
}

export async function POST(req: Request) {
  // Abuse guard: this endpoint calls the paid Anthropic vision API on every
  // request, so throttle per IP BEFORE doing any work. 6 calls / 5 min keeps
  // a real user's retries flowing while blocking scripted bill-draining.
  const limit = rateLimit("identify", clientIp(req.headers), 6, 5 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Anthropic API key not configured on this server." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return Response.json({ error: "No image provided." }, { status: 400 });
  }

  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return Response.json(
      { error: "Image must be JPEG, PNG, GIF, or WebP." },
      { status: 400 }
    );
  }

  // 5 MB limit
  if (file.size > 5 * 1024 * 1024) {
    return Response.json(
      { error: "Image too large. Maximum size is 5 MB." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const anthropic = new Anthropic({ apiKey });

  let identification: IdentificationResult;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: file.type as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: base64,
              },
            },
            { type: "text", text: VISION_PROMPT },
          ],
        },
      ],
    });

    const raw = (message.content[0] as { type: string; text: string }).text;
    // Strip potential markdown code fences
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    identification = JSON.parse(jsonText);
  } catch (err) {
    console.error("Anthropic vision error:", err);
    return Response.json(
      { error: "Could not analyze the image. Please try again." },
      { status: 500 }
    );
  }

  // Search the catalog
  const catalogMatch = await findCatalogMatch(identification);

  // Log misses to searched_not_found
  if (!catalogMatch || (!catalogMatch.variantId && !catalogMatch.styleId)) {
    const query = [identification.brand, identification.style]
      .filter(Boolean)
      .join(" ");
    if (query) {
      await getSupabase()
        .from("searched_not_found")
        .insert({ search_query: `[camera] ${query}`, result_count: 0 });
    }
  }

  // Resale estimate for the matched style, so the tool can show "if genuine,
  // typically resells around $X" (an estimate, never a flat value on the unverified
  // bag). Only when we have a confident-enough catalog match; gated further on the
  // client by identification confidence.
  // Hard, house-confirmed dealbreaker (origin stamp). When present we do NOT attach
  // a value: a bag that fails a definitive check gets no price.
  const hardFlag = originHardFlag(identification.brand, identification.madeIn);

  let resale: { median: number; count: number; currency: string; asOf: string | null } | null = null;
  if (!hardFlag && catalogMatch?.styleId) {
    const shop = await getStyleShopData(catalogMatch.styleId);
    if (shop && shop.count > 0) {
      resale = { median: shop.medianPrice, count: shop.count, currency: shop.currency, asOf: shop.asOf };
    }
  }

  return Response.json({ identification, catalogMatch, resale, hardFlag });
}
