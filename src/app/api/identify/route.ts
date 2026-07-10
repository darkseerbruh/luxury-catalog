import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getStyleShopData } from "@/lib/article-shop";
import { displaySizeLabel } from "@/lib/variant-label";
import type {
  CatalogMatch,
  IdentificationResult,
  IdentifyResponse,
  LogoHint,
} from "@/lib/identify/types";

export const dynamic = "force-dynamic";

/** Max frames accepted per identify call (video flow sends up to 4 + 1 spare). */
const MAX_IMAGES = 5;
/** Max refine crops per call. */
const MAX_CROPS = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const VALID_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const RESULT_SHAPE = `{
  "brand": "exact brand name (e.g. Chanel, Hermès, Coach, The Sak) or null if not identifiable",
  "style": "style/model name (e.g. Classic Flap, Birkin, Tabby) or null if not identifiable",
  "sizeLabel": "size if visible or inferable (e.g. '30', 'Medium', 'MM', 'Jumbo') or null",
  "colorway": "exterior color description (e.g. 'Black', 'Gold', 'Caramel') or null",
  "hardwareColor": "gold/silver/ruthenium/palladium/antique gold or null",
  "hardwareType": "turn-lock/clasp/zipper/push-lock/padlock or null",
  "materialType": "material description if identifiable (e.g. Caviar leather, Togo leather, Canvas, molded PVC) or null",
  "visibleAuthMarkers": ["list only authentication markers you can CLEARLY see in these images — date codes, stamps, serial numbers, hardware engravings, stitching patterns, etc. If none visible, use []"],
  "madeIn": "the country from a visible 'Made in ___' stamp/label, exactly as written (e.g. 'Italy', 'France', 'China'), or null if no origin text is clearly legible",
  "priceTagText": "the price printed on a visible store price tag, exactly as shown (e.g. '$18.99'), or null if no price tag is legible",
  "confidence": "high if brand+style clearly identifiable, medium if probable, low if uncertain",
  "notes": "any other relevant observations about condition, authenticity indicators, or features",
  "logoHints": [
    // One entry for EVERY brand-bearing region you can see in ANY image: an
    // embossed/stamped logo, a woven interior label, a hanging medallion or
    // charm, a printed logo, a store price tag, an engraved hardware piece.
    // Include regions you can see but NOT read — those are the valuable ones,
    // the client will send a closer crop. Empty array if none.
    {
      "imageIndex": 0, // which image (0-based, in the order provided)
      "kind": "stamp" | "label" | "tag" | "medallion" | "print" | "hardware",
      "legible": true, // could you actually read the text at this resolution?
      "text": "the text as read, or null when not legible",
      "region": { "x": 0.42, "y": 0.31, "w": 0.18, "h": 0.09 } // normalized 0..1: left, top, width, height
    }
  ]
}`;

const VISION_PROMPT = `You are an expert luxury and contemporary handbag authenticator and cataloger with deep knowledge of Chanel, Hermès, Louis Vuitton, Coach, Gucci, Prada, Fendi, Celine, Dior, Bottega Veneta, Kate Spade, Burberry, and mainstream US brands commonly found secondhand (Dooney & Bourke, Brahmin, The Sak, Anne Klein, Liz Claiborne, Vera Bradley, Michael Kors, Marc Jacobs).

You are looking at ${"{N}"} photo(s)/frame(s) of the SAME bag, taken by a shopper. Analyze them together and identify the bag. Respond with a JSON object ONLY (no markdown, no surrounding text):

${RESULT_SHAPE}

Critical rules:
- Only report what is clearly visible. Do not guess or invent authentication markers.
- If you cannot clearly identify the brand, set brand to null.
- If you cannot clearly identify the style/model, set style to null.
- visibleAuthMarkers must only contain things you can actually see in the images.
- madeIn must be null unless the origin text is actually legible. Do not infer it.
- priceTagText must be null unless a store price sticker is actually legible.
- logoHints: report EVERY brand-bearing region, including ones too small or blurry to read (legible: false). Precise regions matter — the client crops them at full resolution for a second look.`;

const REFINE_PROMPT = `You are an expert handbag authenticator. You previously analyzed photos of a bag and produced this identification JSON:

{PRIOR}

The following image(s) are CLOSE-UP CROPS, at much higher effective resolution, of the logo/stamp/label/tag regions you could not read before. Read them now and return the FULL updated identification as a JSON object ONLY (no markdown), in exactly this shape:

${RESULT_SHAPE}

Critical rules:
- Update brand/style/notes/madeIn/priceTagText based on what the crops actually say. If a crop contradicts the earlier guess (different brand on the stamp), the crop wins.
- Keep fields you have no new evidence about unchanged from the prior JSON.
- Only report text you can actually read in these crops. No guessing.
- logoHints: report what each crop shows, with legible/text filled in. Use the crop's own coordinates for region.`;

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
function originHardFlag(
  brand: string | null,
  madeIn: string | null
): { reason: string } | null {
  if (!brand || !madeIn) return null;
  const allowed = HOUSE_ORIGINS[brand.trim().toLowerCase()];
  if (!allowed) return null;
  const where = madeIn.trim().toLowerCase();
  if (allowed.some((c) => where.includes(c) || c.includes(where))) return null;
  const label = allowed[0]!.charAt(0).toUpperCase() + allowed[0]!.slice(1);
  return {
    reason: `A genuine ${brand} is made in ${label}${allowed.length > 1 ? " (or a few other countries), never" : ", never"} in ${madeIn.trim()}. If that label is what it says, this is a dealbreaker.`,
  };
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
        ? styleRows.filter((s) =>
            embeddedName(s.brand)
              .toLowerCase()
              .includes(identification.brand!.toLowerCase())
          )
        : styleRows;

      const best = filtered[0] ?? styleRows[0]!;
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
        sizeLabel: displaySizeLabel(matched?.size_label),
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

type ImagePart = {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  };
};

async function collectImages(
  formData: FormData,
  max: number
): Promise<{ parts: ImagePart[] } | { error: string; status: number }> {
  // Back-compat: the original single-photo flow posts one file under "image";
  // the video/haul flow posts several under "images".
  const files = [
    ...formData.getAll("images"),
    formData.get("image"),
  ].filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { error: "No image provided.", status: 400 };
  if (files.length > max)
    return { error: `Too many images. Maximum is ${max}.`, status: 400 };

  const parts: ImagePart[] = [];
  for (const file of files) {
    if (!VALID_TYPES.includes(file.type))
      return { error: "Images must be JPEG, PNG, GIF, or WebP.", status: 400 };
    if (file.size > MAX_IMAGE_BYTES)
      return { error: "Image too large. Maximum size is 5 MB each.", status: 400 };
    const bytes = await file.arrayBuffer();
    parts.push({
      type: "image",
      source: {
        type: "base64",
        media_type: file.type as ImagePart["source"]["media_type"],
        data: Buffer.from(bytes).toString("base64"),
      },
    });
  }
  return { parts };
}

interface ModelResult extends IdentificationResult {
  logoHints?: LogoHint[];
}

function normalizeModelResult(raw: unknown): ModelResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  const hints: LogoHint[] = Array.isArray(r.logoHints)
    ? (r.logoHints as unknown[])
        .map((h) => h as Record<string, unknown>)
        .filter(
          (h) =>
            typeof h.imageIndex === "number" &&
            typeof h.region === "object" &&
            h.region !== null
        )
        .map((h) => {
          const reg = h.region as Record<string, unknown>;
          const num = (v: unknown) =>
            typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
          return {
            imageIndex: h.imageIndex as number,
            kind: (["stamp", "label", "tag", "medallion", "print", "hardware"].includes(
              h.kind as string
            )
              ? h.kind
              : "print") as LogoHint["kind"],
            legible: h.legible === true,
            text: str(h.text),
            region: { x: num(reg.x), y: num(reg.y), w: num(reg.w), h: num(reg.h) },
          };
        })
        .filter((h) => h.region.w > 0 && h.region.h > 0)
    : [];
  return {
    brand: str(r.brand),
    style: str(r.style),
    sizeLabel: str(r.sizeLabel),
    colorway: str(r.colorway),
    hardwareColor: str(r.hardwareColor),
    hardwareType: str(r.hardwareType),
    materialType: str(r.materialType),
    visibleAuthMarkers: Array.isArray(r.visibleAuthMarkers)
      ? (r.visibleAuthMarkers as unknown[]).filter(
          (m): m is string => typeof m === "string"
        )
      : [],
    madeIn: str(r.madeIn),
    priceTagText: str(r.priceTagText),
    confidence: (["high", "medium", "low"].includes(r.confidence as string)
      ? r.confidence
      : "low") as IdentificationResult["confidence"],
    notes: str(r.notes),
    logoHints: hints,
  };
}

async function runVision(
  apiKey: string,
  parts: ImagePart[],
  promptText: string
): Promise<ModelResult> {
  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1536,
    messages: [
      {
        role: "user",
        content: [...parts, { type: "text", text: promptText }],
      },
    ],
  });
  const raw = (message.content[0] as { type: string; text: string }).text;
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return normalizeModelResult(JSON.parse(jsonText));
}

export async function POST(req: Request) {
  // Abuse guard: this endpoint calls the paid Anthropic vision API on every
  // request, so throttle per IP BEFORE doing any work. 12 calls / 5 min keeps a
  // real haul session flowing (several bags + a refine round each) while
  // blocking scripted bill-draining.
  const limit = rateLimit("identify", clientIp(req.headers), 12, 5 * 60 * 1000);
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

  // Refine round: close-up crops of previously unreadable logo regions, plus
  // the identification they refine. One extra vision call, no new DB writes on
  // a miss (the first round already logged it).
  const priorJson = formData.get("prior");
  const isRefine = typeof priorJson === "string" && priorJson.length > 0;

  const collected = await collectImages(formData, isRefine ? MAX_CROPS : MAX_IMAGES);
  if ("error" in collected)
    return Response.json({ error: collected.error }, { status: collected.status });

  let identification: ModelResult;
  try {
    if (isRefine) {
      let prior: unknown;
      try {
        prior = JSON.parse(priorJson);
      } catch {
        return Response.json({ error: "Invalid prior payload." }, { status: 400 });
      }
      // Re-normalize the prior so a tampered payload can't smuggle anything odd
      // into the prompt beyond identification-shaped strings.
      const cleanPrior = normalizeModelResult(prior);
      identification = await runVision(
        apiKey,
        collected.parts,
        REFINE_PROMPT.replace("{PRIOR}", JSON.stringify(cleanPrior))
      );
    } else {
      identification = await runVision(
        apiKey,
        collected.parts,
        VISION_PROMPT.replace("{N}", String(collected.parts.length))
      );
    }
  } catch (err) {
    console.error("Anthropic vision error:", err);
    return Response.json(
      { error: "Could not analyze the image. Please try again." },
      { status: 500 }
    );
  }

  const { logoHints = [], ...identOnly } = identification;

  // Search the catalog
  const catalogMatch = await findCatalogMatch(identOnly);

  // Log misses to searched_not_found — the demand signal that steers which
  // brands/styles the catalog grows into next. First round only (a refine of
  // the same bag shouldn't double-log).
  if (
    !isRefine &&
    (!catalogMatch || (!catalogMatch.variantId && !catalogMatch.styleId))
  ) {
    const query = [identOnly.brand, identOnly.style].filter(Boolean).join(" ");
    if (query) {
      await getSupabase()
        .from("searched_not_found")
        .insert({ search_query: `[camera] ${query}`, result_count: 0 });
    }
  }

  // Resale estimate for the matched style, so the tool can show "if genuine,
  // typically resells around $X" (an estimate, never a flat value on the
  // unverified bag). Only when we have a confident-enough catalog match; gated
  // further on the client by identification confidence.
  // Hard, house-confirmed dealbreaker (origin stamp). When present we do NOT
  // attach a value: a bag that fails a definitive check gets no price.
  const hardFlag = originHardFlag(identOnly.brand, identOnly.madeIn);

  let resale: IdentifyResponse["resale"] = null;
  if (!hardFlag && catalogMatch?.styleId) {
    const shop = await getStyleShopData(catalogMatch.styleId);
    if (shop && shop.count > 0) {
      // A flipper's buy decision runs on the floor, not the median; send both.
      resale = {
        median: shop.medianPrice,
        low: shop.fromPrice ?? null,
        count: shop.count,
        currency: shop.currency,
        asOf: shop.asOf,
      };
    }
  }

  const response: IdentifyResponse = {
    identification: identOnly,
    logoHints,
    catalogMatch,
    resale,
    hardFlag,
  };
  return Response.json(response);
}
