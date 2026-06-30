/**
 * Fashionphile source adapter — two modes:
 *
 * MODE A — browser raw-dump (high-confidence, per-listing):
 *   Fashionphile runs on Shopify. In Chrome, fetch individual product JSONs via
 *   the same-origin endpoint:
 *     fetch('/products/<handle>.json').then(r=>r.json())
 *   Collect the records (with optional condition grade from the card) and save as:
 *     data/ingest/_raw/fashionphile.json
 *   Shape of each element:
 *     { product: ShopifyProduct, url: string, conditionGrade?: string }
 *   Then run:
 *     npx tsx supabase/ingest/sources/fashionphile.ts --raw
 *   Each record maps through parseFashionphileProduct(product, conditionGrade)
 *   → PriceObservation with confidence:"high", price_type:"listed", source_url per listing.
 *
 * Condition grades Fashionphile uses (capture from the listing card):
 *   "New" | "Giftable" | "Excellent" | "Very Good" | "Good" | "Fair"
 *   Mapped to SaleCondition by mapFashionphileCondition().
 *
 * MODE B — live page scrape (medium-confidence, search-page summary):
 *   npm run ingest:fashionphile   (no flag)
 *   Reads the search/listing page, finds the lowest in-band price for the style
 *   as a single representative observation. Page is JS-rendered so this often
 *   returns nothing; the raw-dump path is strongly preferred.
 *
 * Legal / attribution posture: prices are facts; every row carries source_url.
 * Never ingest product photos or verbatim descriptions.
 */
import fs from "fs";
import path from "path";
import { stripTags } from "../../../src/lib/ingest/html";
import { parseAllPrices } from "../../../src/lib/ingest/price-extract";
import { parseFashionphileProduct } from "../../../src/lib/ingest/fashionphile";
import type { ShopifyProduct } from "../../../src/lib/ingest/fashionphile";
import { politeFetchText } from "../lib/fetch";
import { writeObservations } from "../lib/landing";
import { detectSizeLabel } from "./trr-jsonld";
import type { PriceObservation } from "../../../src/lib/ingest/types";

const PLATFORM = "Fashionphile";
const RAW_DUMP = path.resolve(__dirname, "../../../data/ingest/_raw/fashionphile.json");

// ---------------------------------------------------------------------------
// TARGETS — one entry per catalog variant we want to capture.
// Each target maps incoming Shopify product records to a known brand/style/size.
// ---------------------------------------------------------------------------

interface FashionphileTarget {
  brand: string;
  style: string;
  size_label: string;
  /** Tokens that must ALL appear (case-insensitive) in the product handle or title. */
  requireTokens: string[];
  /**
   * Optional tokens that must NOT appear (case-insensitive) in handle or title.
   * Used to keep a style's size buckets clean of adjacent products that share the
   * style name — e.g. the Chanel "Boy" flap bag vs. Boy-line accessories (Wallet on
   * Chain, bucket bag, cosmetic case, card holder) that also carry "boy" in the name.
   */
  excludeTokens?: string[];
  minPrice: number;
  maxPrice: number;
  /** Search/listing page URL — used for fallback scrape + as source_url for search-level rows. */
  searchUrl: string;
}

const TARGETS: FashionphileTarget[] = [
  {
    brand: "Chanel",
    style: "Classic Flap",
    size_label: "Medium",
    // Fashionphile names it "Medium Double Flap" (handle: chanel-...-medium-double-flap-...),
    // not "Classic Flap" — match on that.
    requireTokens: ["chanel", "double-flap", "medium"],
    minPrice: 1500,
    maxPrice: 25000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  },
  // Hero bags — Fashionphile handles: hermes-<leather>-birkin-<size>-, ...-kelly-<size>-,
  // louis-vuitton-...-neverfull-<mm|pm>, gucci-...-matelasse-<small|medium>-gg-marmont-...
  { brand: "Hermès", style: "Birkin", size_label: "25", requireTokens: ["hermes", "birkin-25"], minPrice: 8000, maxPrice: 120000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Hermès", style: "Birkin", size_label: "30", requireTokens: ["hermes", "birkin-30"], minPrice: 8000, maxPrice: 120000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  { brand: "Hermès", style: "Birkin", size_label: "35", requireTokens: ["hermes", "birkin-35"], minPrice: 8000, maxPrice: 120000, searchUrl: "https://www.fashionphile.com/collections/hermes/products.json" },
  // Kelly handles are "kelly-sellier-28" / "kelly-retourne-28" (NOT "kelly-28"), so
  // the size is anchored as "-NN-"; excludeTokens drop the Kelly sub-models/SLGs
  // (Mini Kelly 20, Kelly Pochette/Cut/Longue/Moove/Pocket/Danse, wallets, twilly).
  ...(["25", "28", "32", "35"] as const).map((size) => ({
    brand: "Hermès", style: "Kelly", size_label: size,
    requireTokens: ["kelly", `-${size}-`],
    excludeTokens: ["wallet", "pochette", "cut", "longue", "moove", "pocket", "danse", "twilly", "compact", "mini", "depeche", "to-go", "picnic", "charm", "card"],
    minPrice: 6000, maxPrice: 120000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),
  { brand: "Louis Vuitton", style: "Neverfull", size_label: "MM", requireTokens: ["neverfull-mm"], minPrice: 500, maxPrice: 8000, searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json" },
  { brand: "Louis Vuitton", style: "Neverfull", size_label: "PM", requireTokens: ["neverfull-pm"], minPrice: 500, maxPrice: 8000, searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json" },
  { brand: "Gucci", style: "GG Marmont", size_label: "Small", requireTokens: ["gg-marmont", "small"], minPrice: 400, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/gucci/products.json" },
  { brand: "Gucci", style: "GG Marmont", size_label: "Medium", requireTokens: ["gg-marmont", "medium"], minPrice: 400, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/gucci/products.json" },
  // Goyard Saint Louis (backbone Tier-1). Fashionphile handle: goyard-goyardine-saint-louis-<pm|gm>-<colour>-.
  // excludeTokens drop the adjacent Saint-Pierre card holder + other SLGs that share "saint".
  { brand: "Goyard", style: "Saint Louis", size_label: "PM", requireTokens: ["saint-louis", "pm"], excludeTokens: ["saint-pierre", "card", "wallet", "coin", "pouch"], minPrice: 800, maxPrice: 6000, searchUrl: "https://www.fashionphile.com/collections/goyard/products.json" },
  { brand: "Goyard", style: "Saint Louis", size_label: "GM", requireTokens: ["saint-louis", "gm"], excludeTokens: ["saint-pierre", "card", "wallet", "coin", "pouch"], minPrice: 800, maxPrice: 6000, searchUrl: "https://www.fashionphile.com/collections/goyard/products.json" },
  // The Row Soft Margaux (backbone Tier-1). Handles: the-row-...-soft-margaux-<10|12|15|17>-...
  // The size token is anchored ("soft-margaux-NN") so belts ("soft-margaux-belt-..."), EW, and
  // shoulder variants don't collect into a sized bucket; excludeTokens guard the belt anyway.
  ...(["10", "12", "15", "17"] as const).map((size) => ({
    brand: "The Row", style: "Soft Margaux", size_label: size,
    requireTokens: [`soft-margaux-${size}`], excludeTokens: ["belt"],
    minPrice: 800, maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/the-row/products.json",
  })),
  // Chanel Boy (backbone Tier-1). Fashionphile titles it "<material> ... <size> Boy Flap <colour>"
  // (New/Old Medium both fold to Medium). excludeTokens drop the Boy-LINE accessories that share
  // the name (WOC/wallet, bucket bag, cosmetic/vanity case, card holder, mini pochette, brick).
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Boy",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["boy", size],
    excludeTokens: ["woc", "wallet", "bucket", "cosmetic", "vanity", "card", "coin", "pochette", "brick", "backpack", "key"],
    minPrice: 1000,
    maxPrice: 20000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),
  // Gucci Jackie 1961 (backbone Tier-1). Fashionphile handle: gucci-...-jackie-1961-<size>-.
  // excludeTokens drop Jackie-line small leather goods (wallet/card/coin/pouch).
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Gucci",
    style: "Jackie 1961",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["jackie", size],
    excludeTokens: ["wallet", "card", "coin", "pouch", "continental"],
    minPrice: 400,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),
  // Celine Luggage (backbone Tier-1, canonical "Luggage Tote"). excludeTokens drop the
  // Luggage PHANTOM sub-model (open-side, distinct) + small leather goods.
  ...(["nano", "micro", "mini", "medium"] as const).map((size) => ({
    brand: "Celine",
    style: "Luggage Tote",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["luggage", size],
    excludeTokens: ["phantom", "wallet", "card", "pouch"],
    minPrice: 400,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),
  // Saint Laurent Loulou (backbone Tier-1). excludeTokens drop the Loulou PUFFER sub-line
  // (distinct quilted puffer) + small leather goods.
  ...(["toy", "small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Loulou",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["loulou", size],
    excludeTokens: ["puffer", "wallet", "card", "pouch", "toy-puffer"],
    minPrice: 400,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // WIDE BATCH 2026-06-23 — go-wide Tier-1 backbone icons (Fashionphile, no browser).
  // Each block validated against the live collection JSON: requireTokens anchor the
  // size in the handle (e.g. "constance-18"), excludeTokens drop SLGs / sub-models /
  // non-bags that share the style name. Price bands keep real outliers in band while
  // letting token-excluded accessories drop. Brand/style names match the canonical
  // backbone catalog rows so the loader resolves to the clean style.
  // ════════════════════════════════════════════════════════════════════════════

  // Hermès Constance (#411) — sizes 18 / 24. The size is anchored in the handle
  // ("constance-18"); price ≥ $6k drops the Constance Slim/To-Go/Long wallets, and
  // excludeTokens drop the elongated Élan sub-model.
  ...(["18", "24"] as const).map((size) => ({
    brand: "Hermès",
    style: "Constance",
    size_label: size,
    requireTokens: [`constance-${size}`],
    excludeTokens: ["wallet", "slim", "to-go", "compact", "elan", "belt", "long"],
    minPrice: 6000,
    maxPrice: 45000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // Chanel 19 (#425) — sizes Small / Medium / Large / Maxi. Handle: "chanel-19-flap".
  // excludeTokens drop the 19 WOC / card holder / phone holder accessories.
  ...(["small", "medium", "large", "maxi"] as const).map((size) => ({
    brand: "Chanel",
    style: "Chanel 19",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["19-flap", size],
    excludeTokens: ["woc", "wallet", "card", "coin", "phone", "holder", "pouch"],
    minPrice: 2500,
    maxPrice: 15000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Chanel Gabrielle (#426) — sizes Small / Medium / Large (hobo + structured). The
  // size sits before the model in the handle ("...quilted-medium-gabrielle-hobo").
  // excludeTokens drop the Gabrielle-line accessories (cosmetic/vanity case, backpack,
  // wallet, card holder, clutch).
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Gabrielle",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["gabrielle", size],
    excludeTokens: ["cosmetic", "case", "backpack", "wallet", "card", "clutch", "vanity", "coin", "pouch", "belt"],
    minPrice: 1500,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Chanel Wallet on Chain (#427) — the classic CC WOC (one size). excludeTokens
  // route the line-specific WOCs (Boy / 19 / Gabrielle / Reissue 2.55) to their own
  // styles, leaving the timeless CC Turnlock WOC here.
  {
    brand: "Chanel",
    style: "Wallet on Chain",
    size_label: "WOC",
    requireTokens: ["wallet-on-chain"],
    excludeTokens: ["boy", "19", "gabrielle", "reissue", "2.55", "handle", "phone", "coco", "business"],
    minPrice: 1200,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  },

  // Chanel 2.55 Reissue (#423) — the clean canonical (NOT the verbose one-offs). FP
  // handles it as "...255-reissue-<NNN>-flap" (224/225/226/227) + "reissue-mini-flap".
  // requireTokens anchor "reissue-<NNN>"; excludeTokens drop the Reissue-LINE non-flaps
  // (WOC / belt-bag / chain-waist / pouch / camera / phone / cosmetic / wallet). Validated
  // against the live collection (2026-06-23): 224:3 / 225:30 / 226:33 / 227:13 / Mini:21.
  ...(["224", "225", "226", "227"] as const).map((size) => ({
    brand: "Chanel",
    style: "2.55 Reissue",
    size_label: size,
    requireTokens: [`reissue-${size}`],
    excludeTokens: ["woc", "wallet-on-chain", "belt-bag", "waist", "pouch", "camera", "phone", "cosmetic", "card", "coin", "clutch", "holder"],
    minPrice: 1500,
    maxPrice: 20000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),
  {
    brand: "Chanel",
    style: "2.55 Reissue",
    size_label: "Mini",
    requireTokens: ["reissue-mini"],
    excludeTokens: ["woc", "wallet-on-chain", "belt-bag", "waist", "pouch", "camera", "phone", "cosmetic", "card", "coin", "clutch", "holder"],
    minPrice: 1500,
    maxPrice: 20000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  },

  // ── Saint Laurent Cassandre Envelope (#466) — the matelassé Envelope BAG. FP's YSL
  // "envelope" is ~99% SLGs (wallet/clutch/pouch/chain-wallet/card/cosmetic), so the
  // excludeTokens are aggressive; primary source is TRR (see trr-jsonld.ts). This catches
  // the rare actual bag + future-proofs as FP bag stock appears. ──
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent", style: "Cassandre Envelope", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["envelope", size],
    excludeTokens: ["wallet", "clutch", "pouch", "card", "coin", "cosmetic", "tablet", "pochon", "bi-fold", "continental", "key", "zip", "chain-wallet", "case"],
    minPrice: 500, maxPrice: 6000, searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // ── Loewe (#399, brand added 2026-06-23) — Spanish house; all share the loewe
  // collection. Sizes are word-form at the handle head ("mini-puzzle", "small-hammock").
  // Validated against the live collection: Puzzle is the hero (88, excl. Edge). The plain
  // Puzzle excludes "edge" so Puzzle Edge (its own style #510) doesn't leak in; SLG tokens
  // (wallet/card/coin/pouch) drop the line accessories. ──
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Loewe", style: "Puzzle", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["puzzle", size], excludeTokens: ["edge", "wallet", "card", "coin", "pouch"],
    minPrice: 500, maxPrice: 6000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Loewe", style: "Puzzle Edge", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["puzzle-edge", size], excludeTokens: ["wallet", "card", "coin", "pouch"],
    minPrice: 600, maxPrice: 6000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Loewe", style: "Hammock", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["hammock", size], excludeTokens: ["wallet", "card", "coin", "compact"],
    minPrice: 600, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Loewe", style: "Flamenco", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["flamenco", size], excludeTokens: ["wallet", "card", "coin"],
    minPrice: 400, maxPrice: 4000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Loewe", style: "Gate", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["gate", size], excludeTokens: ["wallet", "card", "coin", "pocket-wallet"],
    minPrice: 500, maxPrice: 4000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["mini", "medium"] as const).map((size) => ({
    brand: "Loewe", style: "Goya", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["goya", size], excludeTokens: ["wallet", "card", "coin"],
    minPrice: 500, maxPrice: 4000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["19", "23", "28"] as const).map((size) => ({
    brand: "Loewe", style: "Amazona", size_label: size,
    requireTokens: ["amazona", size], excludeTokens: ["wallet", "card", "coin"],
    minPrice: 400, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["small", "medium"] as const).map((size) => ({
    brand: "Loewe", style: "Squeeze", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["squeeze", size], excludeTokens: ["wallet", "card", "coin"],
    minPrice: 700, maxPrice: 5000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["small", "medium"] as const).map((size) => ({
    brand: "Loewe", style: "Basket", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["basket", size], excludeTokens: ["wallet", "card", "coin"],
    minPrice: 300, maxPrice: 3000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),
  ...(["small", "large"] as const).map((size) => ({
    brand: "Loewe", style: "Paseo", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["paseo", size], excludeTokens: ["wallet", "card", "coin"],
    minPrice: 500, maxPrice: 4000, searchUrl: "https://www.fashionphile.com/collections/loewe/products.json",
  })),

  // Gucci Dionysus (#201) — sizes Super Mini / Mini / Small / Medium. "Super Mini"
  // contains "mini", so the Mini target excludes "super"; the Super Mini target
  // anchors on the handle token "super-mini-dionysus". excludeTokens drop the chain
  // wallet / card case SLGs.
  {
    brand: "Gucci", style: "Dionysus", size_label: "Super Mini",
    requireTokens: ["super-mini-dionysus"],
    excludeTokens: ["wallet", "card", "pouch", "key"],
    minPrice: 700, maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Gucci",
    style: "Dionysus",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["dionysus", size],
    excludeTokens: size === "mini"
      ? ["super", "wallet", "card", "pouch", "belt", "key"]
      : ["wallet", "card", "pouch", "belt", "key"],
    minPrice: 700,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),

  // Gucci Horsebit 1955 (#447) — sizes Mini / Small / Shoulder (the standard unsized
  // "Horsebit 1955 Shoulder Bag"). require "horsebit-1955" (drops the Horsebit Chain
  // model + Horsebit loafers/sandals/boots); excludeTokens drop SLGs + the chain/tote/
  // bucket/top-handle sub-models. The Shoulder target is "horsebit-1955 minus a size".
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Gucci",
    style: "Horsebit 1955",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["horsebit-1955", size],
    excludeTokens: ["wallet", "wristlet", "card", "pouch", "belt", "chain", "tote", "bucket", "loafer", "sandal", "boot", "pump", "mule", "slide"],
    minPrice: 900,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),
  {
    brand: "Gucci", style: "Horsebit 1955", size_label: "Shoulder",
    requireTokens: ["horsebit-1955"],
    excludeTokens: ["mini", "small", "wallet", "wristlet", "card", "pouch", "belt", "chain", "tote", "bucket", "top-handle", "loafer", "sandal", "boot", "pump", "mule", "slide"],
    minPrice: 900, maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },

  // Celine Triomphe (#206) — sizes Nano / Mini / Small / Medium / Teen. excludeTokens
  // drop the SLGs + the distinct Triomphe-canvas sub-models (Honorine, Half Moon,
  // Bonnie, Folco, Cabas, Cylinder, Multipochette, Ava, Claude) that share branding.
  ...(["nano", "mini", "small", "medium", "teen"] as const).map((size) => ({
    brand: "Celine",
    style: "Triomphe",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["triomphe", size],
    excludeTokens: ["card", "wallet", "holder", "ava", "cabas", "claude", "clutch", "pouch", "belt", "besace", "sunglass", "honorine", "half-moon", "halfmoon", "bonnie", "folco", "cylinder", "multipochette", "messenger", "backpack", "shopper", "tote", "heart", "couer", "soft", "shopping"],
    minPrice: 900,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),

  // Celine Classic Box (#486) — sizes Small / Medium / Teen. require "classic-box"
  // (the bag) — drops the "box calfskin" leather belts/SLGs which contain "box".
  ...(["small", "medium", "teen"] as const).map((size) => ({
    brand: "Celine",
    style: "Classic Box",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["classic-box", size],
    excludeTokens: ["belt", "wallet", "card"],
    minPrice: 1500,
    maxPrice: 15000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),

  // Saint Laurent Sac de Jour (#461) — sizes Nano / Baby / Small / Medium / Large.
  ...(["nano", "baby", "small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Sac de Jour",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["sac-de-jour", size],
    excludeTokens: ["wallet", "card", "pouch", "belt"],
    minPrice: 800,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Saint Laurent Kate (#462) — sizes Small / Medium / Large. excludeTokens drop the
  // Kate clutch / tassel chain wallet (WOC) + non-bags (boots/pumps that carry "kate").
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Kate",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["kate", size],
    excludeTokens: ["boot", "clutch", "wallet", "card", "belt", "pump", "sandal", "mule", "sunglass", "tassel-chain"],
    minPrice: 700,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // FASHIONPHILE BACKFILL 2026-06-23 — the 4 styles that had TRR data but no FP.
  // ════════════════════════════════════════════════════════════════════════════

  // Dior Book Tote (#454) — Mini / Small / Medium / Large. Dior's collection slug is
  // "christian-dior"; the size sits before "book-tote" in the handle.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Dior",
    style: "Book Tote",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["book-tote", size],
    excludeTokens: ["card", "pouch", "phone", "wallet"],
    minPrice: 800,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  })),

  // LV Speedy (#433) — numeric sizes 20/25/30/35/40 + Nano. The numeric size is
  // anchored as "-NN-" so it matches BOTH "speedy-25" and "speedy-bandouliere-25"
  // (the strap version folds into its size) without colliding with a product-id digit.
  ...(["20", "25", "30", "35", "40"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Speedy",
    size_label: size,
    requireTokens: ["speedy", `-${size}-`],
    excludeTokens: ["charm", "wallet", "card", "pouch", "key"],
    minPrice: 300,
    maxPrice: 16000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),
  {
    brand: "Louis Vuitton", style: "Speedy", size_label: "Nano",
    requireTokens: ["speedy", "nano"],
    excludeTokens: ["charm", "wallet", "card", "pouch", "key"],
    minPrice: 300, maxPrice: 16000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  },

  // LV Alma (#434) — BB / PM / MM / GM anchored on the handle ("alma-bb"), plus
  // Mini / Nano word sizes.
  ...(["bb", "pm", "mm", "gm"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Alma",
    size_label: size.toUpperCase(),
    requireTokens: [`alma-${size}`],
    excludeTokens: ["charm", "wallet", "card", "pouch", "vanity"],
    minPrice: 250,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),
  ...(["mini", "nano"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Alma",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["alma", size],
    excludeTokens: ["charm", "wallet", "card", "pouch", "vanity"],
    minPrice: 250,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // NEXT ICONS 2026-06-23 — Fashionphile-first Tier-1 backbone icons (no browser).
  // Sizes + tokens validated against the live collection JSON (handle distributions
  // inspected before writing). requireTokens anchor the size in the handle;
  // excludeTokens drop SLGs / clutch-WOC sub-models / footwear that share the name.
  // Ambiguous-size listings (no size token) intentionally fall through to
  // discovered_listing rather than being mislabeled.
  // ════════════════════════════════════════════════════════════════════════════

  // Chanel Coco Handle (#428) — Extra Mini / Mini / Small / Medium / Large. Handle:
  // "<size>-coco-handle-flap". The plain Mini bucket excludes "extra" (extra-mini
  // CONTAINS mini); the Coco Handle clutch-with-chain + shopping tote are dropped.
  {
    brand: "Chanel", style: "Coco Handle", size_label: "Extra Mini",
    requireTokens: ["extra-mini-coco-handle"],
    excludeTokens: ["clutch", "shopping", "wallet", "card"],
    minPrice: 2000, maxPrice: 15000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  },
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Coco Handle",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["coco-handle", size],
    excludeTokens: size === "mini"
      ? ["extra", "clutch", "shopping", "wallet", "card"]
      : ["clutch", "shopping", "wallet", "card"],
    minPrice: 2000,
    maxPrice: 15000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Dior Lady Dior (#208) — Nano / Micro / Mini / Small / Medium / Large. Handle:
  // "<size>-lady-dior". excludeTokens drop the Lady Dior wallet / clutch / chain
  // pouch / charm SLGs. Dior's collection slug is "christian-dior".
  ...(["nano", "micro", "mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Dior",
    style: "Lady Dior",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["lady-dior", size],
    excludeTokens: ["wallet", "clutch", "chain", "charm", "pouch", "card"],
    minPrice: 700,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  })),

  // Dior Saddle (#209) — Mini / Medium (the standard, unsized "Saddle Bag"). require
  // "saddle-bag" so the Saddle belt bag / chain wallet / pouch SLGs drop; the Medium
  // bucket is "saddle-bag minus a Mini token".
  {
    brand: "Dior", style: "Saddle", size_label: "Mini",
    requireTokens: ["mini-saddle-bag"],
    excludeTokens: ["belt", "chain", "pouch", "wallet"],
    minPrice: 900, maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  },
  {
    brand: "Dior", style: "Saddle", size_label: "Medium",
    requireTokens: ["saddle-bag"],
    excludeTokens: ["mini", "belt", "chain", "pouch", "wallet", "clutch"],
    minPrice: 900, maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  },

  // Bottega Veneta Jodie (#210) — Mini / Small / Teen. Handle: "<size>-jodie".
  ...(["mini", "small", "teen"] as const).map((size) => ({
    brand: "Bottega Veneta",
    style: "Jodie",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["jodie", size],
    excludeTokens: ["wallet", "pouch", "card"],
    minPrice: 700,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  })),

  // Bottega Veneta Cassette (#211) — Extra Mini / Mini / Small (explicit-size only;
  // the no-size "padded cassette crossbody" stock is size-ambiguous and routes to
  // discovered_listing rather than being mislabeled). "maxi-intrecciato" in handles
  // is the WEAVE, not a size — never matched here. excludeTokens drop the Cassette
  // camera bag / tri-fold wallet / belt bag.
  {
    brand: "Bottega Veneta", style: "Cassette", size_label: "Extra Mini",
    requireTokens: ["extra-mini-cassette"],
    excludeTokens: ["camera", "wallet", "tri-fold", "belt", "card"],
    minPrice: 300, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Bottega Veneta",
    style: "Cassette",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["cassette", size],
    excludeTokens: size === "mini"
      ? ["extra", "camera", "wallet", "tri-fold", "belt", "card"]
      : ["camera", "wallet", "tri-fold", "belt", "card"],
    minPrice: 300,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  })),

  // Fendi Peekaboo (#205) — Nano / Micro / Petite / Mini / Small / Medium / Large.
  // Handle: "<size>-peekaboo-..." (the "I See U" and "Iconic" sub-lines both fold to
  // the Peekaboo style). excludeTokens drop Peekaboo SLGs.
  ...(["nano", "micro", "petite", "mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Fendi",
    style: "Peekaboo",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["peekaboo", size],
    excludeTokens: ["wallet", "charm", "pouch", "card"],
    minPrice: 700,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // Fendi Baguette (#204) — Nano / Mini / Medium / Large / Maxi (explicit-size only).
  // The Baguette has a noisy line (Mama Baguette, charms, baguette sandals/slides,
  // belt baguette) — excludeTokens drop all of them; the no-size standard Baguette
  // routes to discovered_listing rather than guessing its size.
  ...(["nano", "mini", "medium", "large", "maxi"] as const).map((size) => ({
    brand: "Fendi",
    style: "Baguette",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["baguette", size],
    excludeTokens: ["charm", "sandal", "slide", "mule", "pump", "mama", "belt", "wallet", "pouch"],
    minPrice: 600,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // NEXT ICONS 2026-06-23 (batch 2) — more Fashionphile-first permanent icons (no
  // browser). Sizes + tokens validated against the live collection JSON before
  // writing (handle distributions inspected; traps caught & documented per block).
  // requireTokens anchor the size in the handle; excludeTokens drop SLGs / belts /
  // footwear / clutch & pouch sub-models / weave-not-size tokens that share the name.
  // Ambiguous-size stock (no size token) intentionally falls through to
  // discovered_listing rather than being mislabeled.
  // ════════════════════════════════════════════════════════════════════════════

  // Hermès Garden Party (#413) — sizes 30 (TPM) / 36 (MM) / 49 (GM). The size is
  // anchored as "-NN-" in the handle (e.g. "garden-party-30-tpm" / "garden-party-tpm-30").
  // require "garden-party" already drops the distinct "Neo Garden" 2023 redesign
  // (handle "neo-garden-23", no "party"); excludeTokens also drop the larger TGM +
  // wallets so those route to discovered rather than folding into a classic size.
  ...(["30", "36", "49"] as const).map((size) => ({
    brand: "Hermès",
    style: "Garden Party",
    size_label: size,
    requireTokens: ["garden-party", `-${size}-`],
    excludeTokens: ["neo", "tgm", "wallet", "pouch"],
    minPrice: 1000,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // Hermès Evelyne (#412) — sizes TPM (16) / PM (29) / GM (33). The generation
  // numerals (I/II/III) are NOT sizes. "tpm" CONTAINS "pm", so the PM bucket anchors
  // on "-pm" (dash-prefixed, handle-only) and GM on "-gm"; excludeTokens drop the
  // Evelyne wallet / cuff bracelet / sandals / airpods & bill pouches.
  {
    brand: "Hermès", style: "Evelyne", size_label: "TPM",
    requireTokens: ["evelyne", "tpm"],
    excludeTokens: ["wallet", "cuff", "bracelet", "sandal", "airpods", "pouch", "bill"],
    minPrice: 1500, maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },
  {
    brand: "Hermès", style: "Evelyne", size_label: "PM",
    requireTokens: ["evelyne", "-pm"],
    excludeTokens: ["wallet", "cuff", "bracelet", "sandal", "airpods", "pouch", "bill"],
    minPrice: 1500, maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },
  {
    brand: "Hermès", style: "Evelyne", size_label: "GM",
    requireTokens: ["evelyne", "-gm"],
    excludeTokens: ["wallet", "cuff", "bracelet", "sandal", "airpods", "pouch", "bill"],
    minPrice: 1500, maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },

  // Celine Belt Bag (#485) — the knot/Belt bag, sizes Nano / Micro / Mini / Pico.
  // TRAP: "belt" alone also matches Triomphe waist BELTS (an accessory, e.g.
  // "...triomphe-belt-85-34") and the Cabas Phantom belt; requiring the literal
  // "belt-bag" handle token excludes every waist belt cleanly. The Crécy/checker
  // "belt-bag" sub-models carry no size token and fall through to discovered.
  ...(["nano", "micro", "mini", "pico"] as const).map((size) => ({
    brand: "Celine",
    style: "Belt Bag",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["belt-bag", size],
    excludeTokens: ["triomphe", "cabas", "phantom", "crecy", "checker", "wallet", "card"],
    minPrice: 700,
    maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  })),

  // Celine Ava (#487) — the Ava Triomphe shoulder bag, sizes Mini / Standard (the
  // "medium strap" is a strap width, folded into Standard). require "ava"+"shoulder"
  // drops the "ava"-bearing sunglasses (no "shoulder"); TRAP: the colour "havana"
  // contains "ava" — excludeTokens drop it too.
  {
    brand: "Celine", style: "Ava", size_label: "Mini",
    requireTokens: ["ava", "shoulder", "mini"],
    excludeTokens: ["havana", "sunglass", "wallet", "card"],
    minPrice: 700, maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  },
  {
    brand: "Celine", style: "Ava", size_label: "Standard",
    requireTokens: ["ava", "shoulder"],
    excludeTokens: ["mini", "havana", "sunglass", "wallet", "card"],
    minPrice: 700, maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/celine/products.json",
  },

  // Saint Laurent Niki (#463) — the Niki chain satchel, sizes Baby / Mini / Medium /
  // Large. excludeTokens drop the Niki body bag / shopping tote / chain wallet / bill
  // pouch / airpods holder / sandals that share the name.
  ...(["baby", "mini", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Niki",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["niki", size],
    excludeTokens: ["body-bag", "shopping", "shopper", "tote", "wallet", "pouch", "airpods", "sandal", "multipocket"],
    minPrice: 900,
    maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Saint Laurent Le 5 à 7 (#467) — the Le 5 à 7 hobo, sizes Baby / Mini / Small /
  // Large. Handle token is "5-a-7". The size-less "le-5-a-7-hobo" (standard) is
  // size-ambiguous and routes to discovered rather than guessing.
  ...(["baby", "mini", "small", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Le 5 à 7",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["5-a-7", size],
    excludeTokens: ["wallet", "pouch"],
    minPrice: 900,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Bottega Veneta Andiamo (#472) — sizes Mini / Small / Medium / Large. excludeTokens
  // drop the Andiamo "long ... top-handle clutch" + the Andiamo pouch-on-strap/chain
  // (distinct sub-models). "with chain" small/medium remain the shoulder bag (kept).
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Bottega Veneta",
    style: "Andiamo",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["andiamo", size],
    excludeTokens: ["clutch", "top-handle", "pouch", "wallet"],
    minPrice: 1500,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  })),

  // Bottega Veneta Arco (#473) — sizes Mini / Small / Medium / Large. TRAP:
  // "maxi-intrecciato" is the WEAVE, never a size (the size is the word before
  // "arco"). excludeTokens drop the Arco basket + Arco camera bag sub-models.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Bottega Veneta",
    style: "Arco",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["arco", size],
    excludeTokens: ["basket", "camera", "wallet", "pouch"],
    minPrice: 800,
    maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  })),

  // Fendi First (#479) — sizes Small / Medium. The "nano" First is only a bag CHARM
  // (excluded, not scaffolded). excludeTokens drop the First sunglasses + sandals.
  ...(["small", "medium"] as const).map((size) => ({
    brand: "Fendi",
    style: "First",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["fendi-first", size],
    excludeTokens: ["sunglass", "sandal", "charm", "wallet"],
    minPrice: 1000,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // Fendi Sunshine Shopper (#478) — sizes Mini / Small / Medium / Large.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Fendi",
    style: "Sunshine Shopper",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["sunshine-shopper", size],
    excludeTokens: ["wallet", "charm"],
    minPrice: 800,
    maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // Prada Galleria (#203) — the Galleria double-zip tote, sizes Micro / Mini / Small /
  // Medium / Large / Extra Large. "large" matches "extra-large", so the Large bucket
  // excludes "extra"; Extra Large anchors on "extra-large". The size-less "galleria
  // shopping tote" routes to discovered.
  ...(["micro", "mini", "small", "medium"] as const).map((size) => ({
    brand: "Prada",
    style: "Galleria",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["galleria", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 600,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  })),
  {
    brand: "Prada", style: "Galleria", size_label: "Large",
    requireTokens: ["galleria", "large"],
    excludeTokens: ["extra", "wallet", "card"],
    minPrice: 600, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },
  {
    brand: "Prada", style: "Galleria", size_label: "Extra Large",
    requireTokens: ["galleria", "extra-large"],
    excludeTokens: ["wallet", "card"],
    minPrice: 600, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },

  // Prada Re-Edition 2005 (#202) — the iconic nylon hobo, sizes Mini / Standard.
  // The Re-Edition LINE has distinct year sub-models (2000 / 1978 / 1995) that are
  // SEPARATE bags, not sizes — they are NOT matched here (require "re-edition-2005")
  // and route to discovered. Mini anchors on "mini"; Standard excludes "mini".
  {
    brand: "Prada", style: "Re-Edition 2005", size_label: "Mini",
    requireTokens: ["re-edition-2005", "mini"],
    excludeTokens: ["wallet", "pouch", "sandal"],
    minPrice: 500, maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },
  {
    brand: "Prada", style: "Re-Edition 2005", size_label: "Standard",
    requireTokens: ["re-edition-2005"],
    excludeTokens: ["mini", "wallet", "pouch", "sandal"],
    minPrice: 500, maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },

  // Dior Lady D-Joy (#458) — sizes Micro / Mini / Small / Medium. TRAP: "d-joy"
  // also matches the "D-Joy ballet flats" (shoes); require the literal "lady-d-joy"
  // and exclude ballet/flats. Dior's collection slug is "christian-dior".
  ...(["micro", "mini", "small", "medium"] as const).map((size) => ({
    brand: "Dior",
    style: "Lady D-Joy",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["lady-d-joy", size],
    excludeTokens: ["ballet", "flats", "wallet", "charm"],
    minPrice: 2000,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // LV ICONS 2026-06-23 (batch 3) — the most-searched Louis Vuitton permanent icons
  // (Fashionphile-first, no browser). Sizes + tokens validated against the live LV
  // collection JSON (6,250 products; handle distributions inspected per icon).
  // ════════════════════════════════════════════════════════════════════════════

  // LV NéoNoé (#435) — bucket bag, sizes BB / MM. The size-less "neonoe" (no bb/mm)
  // routes to discovered rather than guessing.
  ...(["bb", "mm"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "NéoNoé",
    size_label: size.toUpperCase(),
    requireTokens: ["neonoe", size],
    excludeTokens: ["wallet", "charm", "strap"],
    minPrice: 1000,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV Capucines (#436) — sizes Mini / BB / MM / GM / East-West. excludeTokens drop
  // the Capucines compact wallet / card holder. Exotic skins push the top of band.
  ...(["mini", "bb", "mm", "gm", "east-west"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Capucines",
    size_label: size === "east-west" ? "East-West" : size.length === 2 ? size.toUpperCase() : size[0].toUpperCase() + size.slice(1),
    requireTokens: ["capucines", size],
    excludeTokens: ["wallet", "compact", "card", "pochette"],
    minPrice: 2000,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV OnTheGo (#437) — tote, sizes PM / MM / GM / East-West.
  ...(["pm", "mm", "gm", "east-west"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "OnTheGo",
    size_label: size === "east-west" ? "East-West" : size.toUpperCase(),
    requireTokens: ["onthego", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 1500,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV Pochette Métis (#438) — sizes Standard / East-West. The handle always contains
  // "pochette-metis"; Standard excludes the East-West + Mini variants.
  {
    brand: "Louis Vuitton", style: "Pochette Métis", size_label: "East-West",
    requireTokens: ["pochette-metis", "east-west"],
    excludeTokens: ["wallet", "card"],
    minPrice: 1200, maxPrice: 4500,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  },
  {
    brand: "Louis Vuitton", style: "Pochette Métis", size_label: "Standard",
    requireTokens: ["pochette-metis"],
    excludeTokens: ["east-west", "mini", "wallet", "card"],
    minPrice: 1200, maxPrice: 4500,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  },

  // LV Keepall (#440) — duffle, NUMERIC sizes 25 / 45 / 50 / 55 / 60 (anchored "-NN-";
  // matches both "keepall-55" and "keepall-bandouliere-55"). TRAP: "keepall ... shoulder
  // strap" is a strap accessory ("25mm" ≠ "-25-"), dropped by excludeTokens + price band.
  ...(["25", "45", "50", "55", "60"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Keepall",
    size_label: size,
    requireTokens: ["keepall", `-${size}-`],
    excludeTokens: ["strap", "wallet", "charm", "puppet", "friends"],
    minPrice: 700,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV Coussin (#442) — sizes BB / MM / PM. excludeTokens drop the metal coussin chain
  // STRAP accessory + the "pochette coussin" / "lou coussin wallet" SLGs.
  ...(["bb", "mm", "pm"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Coussin",
    size_label: size.toUpperCase(),
    requireTokens: ["coussin", size],
    excludeTokens: ["strap", "wallet", "pochette", "scarabeo", "card"],
    minPrice: 1500,
    maxPrice: 5000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV Bumbag (#445) — sizes Mini / Standard (the "high rise" is a Standard variant).
  {
    brand: "Louis Vuitton", style: "Bumbag", size_label: "Mini",
    requireTokens: ["bumbag", "mini"],
    excludeTokens: ["wallet", "charm"],
    minPrice: 1200, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  },
  {
    brand: "Louis Vuitton", style: "Bumbag", size_label: "Standard",
    requireTokens: ["bumbag"],
    excludeTokens: ["mini", "wallet", "charm"],
    minPrice: 1200, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  },

  // LV Dauphine (#441) — sizes Micro / Mini / MM / GM (the "soft GM" folds to GM).
  ...(["micro", "mini", "mm", "gm"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Dauphine",
    size_label: size.length === 2 ? size.toUpperCase() : size[0].toUpperCase() + size.slice(1),
    requireTokens: ["dauphine", size],
    excludeTokens: ["wallet", "chain", "card"],
    minPrice: 1200,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV Twist (#439) — sizes PM / MM. excludeTokens drop the Twist wallet / belt chain.
  ...(["pm", "mm"] as const).map((size) => ({
    brand: "Louis Vuitton",
    style: "Twist",
    size_label: size.toUpperCase(),
    requireTokens: ["twist", size],
    excludeTokens: ["wallet", "belt", "chain", "card"],
    minPrice: 1500,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  })),

  // LV Petite Malle (#443) — the mini trunk, one size (Standard; the soft "Souple"
  // folds in). excludeTokens drop the Petite Malle card/chain SLGs.
  {
    brand: "Louis Vuitton", style: "Petite Malle", size_label: "Standard",
    requireTokens: ["petite-malle"],
    excludeTokens: ["wallet", "card", "chain"],
    minPrice: 1500, maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/louis-vuitton/products.json",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // HERMÈS ICONS 2026-06-23 (batch 4) — Hermès permanent non-Birkin/Kelly icons
  // (Fashionphile-first, no browser). Numeric cm sizes match the existing Birkin/
  // Kelly/Constance convention and are anchored "-NN-" so a product-id digit can't
  // false-match. Validated against the live Hermès collection JSON.
  // ════════════════════════════════════════════════════════════════════════════

  // Picotin Lock (#414) — sizes 18 (PM) / 22 (MM) / 26 (GM) + Micro. excludeTokens
  // drop the Picotin charm / strap.
  ...(["18", "22", "26"] as const).map((size) => ({
    brand: "Hermès",
    style: "Picotin Lock",
    size_label: size,
    requireTokens: ["picotin", `-${size}-`],
    excludeTokens: ["charm", "wallet", "strap"],
    minPrice: 1500,
    maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),
  {
    brand: "Hermès", style: "Picotin Lock", size_label: "Micro",
    requireTokens: ["picotin", "micro"],
    excludeTokens: ["charm", "wallet", "strap"],
    minPrice: 1500, maxPrice: 12000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },

  // Bolide (#415) — sizes Mini / 25 / 27 / 31 / 35. The "1923" in "bolide-1923-31"
  // is the LINE name, not a size (the real size is the anchored "-31-"). excludeTokens
  // drop the Bolide on-wheels charm / à dos backpack / slim wallet.
  {
    brand: "Hermès", style: "Bolide", size_label: "Mini",
    requireTokens: ["bolide", "mini"],
    excludeTokens: ["charm", "wallet", "wheels", "backpack", "a-dos", "slim"],
    minPrice: 2500, maxPrice: 14000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },
  ...(["25", "27", "31", "35"] as const).map((size) => ({
    brand: "Hermès",
    style: "Bolide",
    size_label: size,
    requireTokens: ["bolide", `-${size}-`],
    excludeTokens: ["charm", "wallet", "wheels", "backpack", "a-dos", "slim"],
    minPrice: 2500,
    maxPrice: 14000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // Lindy (#416) — sizes Mini (20) / 26 / 30 / 34. excludeTokens drop the Lindy charm/
  // wallet.
  {
    brand: "Hermès", style: "Lindy", size_label: "Mini",
    requireTokens: ["lindy", "mini"],
    excludeTokens: ["charm", "wallet"],
    minPrice: 3000, maxPrice: 13000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },
  ...(["26", "30", "34"] as const).map((size) => ({
    brand: "Hermès",
    style: "Lindy",
    size_label: size,
    requireTokens: ["lindy", `-${size}-`],
    excludeTokens: ["charm", "wallet"],
    minPrice: 3000,
    maxPrice: 13000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // Herbag (#417) — sizes PM (31) / MM (39); the "Zip" is the same bag's closure
  // variant, folded into its size. excludeTokens drop the Herbag charm/wallet.
  ...(["pm", "mm"] as const).map((size) => ({
    brand: "Hermès",
    style: "Herbag",
    size_label: size.toUpperCase(),
    requireTokens: ["herbag", size],
    excludeTokens: ["charm", "wallet"],
    minPrice: 1200,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // Kelly Pochette (#418) — the evening clutch, one size (Standard). Very high band
  // (a coveted exotic-adjacent clutch). excludeTokens drop any wallet.
  {
    brand: "Hermès", style: "Kelly Pochette", size_label: "Standard",
    requireTokens: ["kelly-pochette"],
    excludeTokens: ["wallet"],
    minPrice: 8000, maxPrice: 45000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },

  // Roulis (#419) — sizes Mini / 23. excludeTokens drop the Roulis slim wallet.
  {
    brand: "Hermès", style: "Roulis", size_label: "Mini",
    requireTokens: ["roulis", "mini"],
    excludeTokens: ["wallet", "slim"],
    minPrice: 3000, maxPrice: 10000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },
  {
    brand: "Hermès", style: "Roulis", size_label: "23",
    requireTokens: ["roulis", "-23-"],
    excludeTokens: ["wallet", "slim"],
    minPrice: 3000, maxPrice: 10000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },

  // Jypsière (#420) — sizes Mini / 28 / 31 / 34. excludeTokens drop any wallet.
  {
    brand: "Hermès", style: "Jypsière", size_label: "Mini",
    requireTokens: ["jypsiere", "mini"],
    excludeTokens: ["wallet"],
    minPrice: 2500, maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  },
  ...(["28", "31", "34"] as const).map((size) => ({
    brand: "Hermès",
    style: "Jypsière",
    size_label: size,
    requireTokens: ["jypsiere", `-${size}-`],
    excludeTokens: ["wallet"],
    minPrice: 2500,
    maxPrice: 9000,
    searchUrl: "https://www.fashionphile.com/collections/hermes/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // GUCCI ICONS 2026-06-23 (batch 5) — Gucci permanent non-Dionysus/Horsebit/Jackie/
  // Marmont icons (Fashionphile-first, no browser). Validated against the live Gucci
  // collection JSON.
  // ════════════════════════════════════════════════════════════════════════════

  // Ophidia (#448) — sizes Super Mini / Mini / Small / Medium / Large / Jumbo. "Super
  // Mini" contains "mini" so the Super Mini anchors on "super-mini-ophidia" and the
  // Mini bucket excludes "super". excludeTokens drop the Ophidia SLGs (wallet / card /
  // cosmetic / key pouch). (The line spans shoulder / belt / top-handle forms — all
  // the same Ophidia style; per-listing spec is preserved on each row.)
  {
    brand: "Gucci", style: "Ophidia", size_label: "Super Mini",
    requireTokens: ["super-mini-ophidia"],
    excludeTokens: ["wallet", "card", "cosmetic", "key"],
    minPrice: 600, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },
  ...(["mini", "small", "medium", "large", "jumbo"] as const).map((size) => ({
    brand: "Gucci",
    style: "Ophidia",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["ophidia", size],
    excludeTokens: size === "mini"
      ? ["super", "wallet", "card", "cosmetic", "key", "pouch"]
      : ["wallet", "card", "cosmetic", "key", "pouch"],
    minPrice: 600,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),

  // Bamboo 1947 (#449) — the revived top-handle, sizes Mini / Small / Medium / Large.
  // require the literal "bamboo-1947" so vintage "bamboo" + "new bamboo" + Dionysus/
  // Diana bamboo-handle bags are NOT folded in. excludeTokens drop backpack / SLGs.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Gucci",
    style: "Bamboo 1947",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["bamboo-1947", size],
    excludeTokens: ["wallet", "backpack", "card"],
    minPrice: 800,
    maxPrice: 5000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),

  // Soho Disco (#450) — the disco crossbody, sizes Small (standard) / Mini. The
  // size-less "soho-disco-bag" is the standard Small; Mini anchors on "mini".
  {
    brand: "Gucci", style: "Soho Disco", size_label: "Mini",
    requireTokens: ["soho-disco", "mini"],
    excludeTokens: ["wallet", "card"],
    minPrice: 500, maxPrice: 2000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },
  {
    brand: "Gucci", style: "Soho Disco", size_label: "Small",
    requireTokens: ["soho-disco"],
    excludeTokens: ["mini", "wallet", "card"],
    minPrice: 500, maxPrice: 2000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },

  // Diana (#451) — the bamboo-handle tote, sizes Mini / Small / Medium / Maxi. TRAP:
  // "jumbo" in "jumbo-gg ... small-diana" is the GG monogram SCALE, not a size (the
  // real size is the word before "diana") — jumbo is NOT a Diana size bucket.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Gucci",
    style: "Diana",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["diana", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),
  {
    brand: "Gucci", style: "Diana", size_label: "Maxi",
    requireTokens: ["maxi-diana"],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  },

  // Attache (#452) — sizes Small / Large.
  ...(["small", "large"] as const).map((size) => ({
    brand: "Gucci",
    style: "Attache",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["attache", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000,
    maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),

  // Blondie (#453) — sizes Mini / Small / Medium / Large. excludeTokens drop the
  // Blondie continental chain wallet / card case. The size-less standard routes to
  // discovered rather than guessing.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Gucci",
    style: "Blondie",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["blondie", size],
    excludeTokens: ["wallet", "card", "continental", "pouch"],
    minPrice: 800,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/gucci/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // MID-LUX CONTEMPORARY ICONS 2026-06-23 (batch 6) — Saint Laurent / Dior / Fendi
  // permanent icons (Fashionphile-first, no browser). Validated against each live
  // collection JSON.
  // ════════════════════════════════════════════════════════════════════════════

  // Saint Laurent College (#465) — the chevron-quilted satchel, sizes Mini/Medium/Large.
  ...(["mini", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "College",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["college", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 800,
    maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Saint Laurent Icare Tote (#470) — the quilted shopper, sizes Maxi / Medium.
  ...(["maxi", "medium"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Icare Tote",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["icare", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 2000,
    maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Saint Laurent Lou Camera (#464) — sizes Mini / Small / Standard. The size-less
  // "lou-camera-bag" is the Standard; excludeTokens drop the Lou wallet.
  {
    brand: "Saint Laurent", style: "Lou Camera", size_label: "Mini",
    requireTokens: ["lou-camera", "mini"],
    excludeTokens: ["wallet", "card"],
    minPrice: 600, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  },
  {
    brand: "Saint Laurent", style: "Lou Camera", size_label: "Small",
    requireTokens: ["lou-camera", "small"],
    excludeTokens: ["wallet", "card"],
    minPrice: 600, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  },
  {
    brand: "Saint Laurent", style: "Lou Camera", size_label: "Standard",
    requireTokens: ["lou-camera"],
    excludeTokens: ["mini", "small", "wallet", "card"],
    minPrice: 600, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  },

  // Saint Laurent Manhattan (#468) — sizes Nano / Mini / Small / Standard (shoulder).
  ...(["nano", "mini", "small"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Manhattan",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["manhattan", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 800,
    maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),
  {
    brand: "Saint Laurent", style: "Manhattan", size_label: "Standard",
    requireTokens: ["manhattan", "shoulder"],
    excludeTokens: ["mini", "nano", "wallet", "card"],
    minPrice: 800, maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  },

  // Saint Laurent Solferino (#469) — sizes Mini / Small / Medium / Large.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Saint Laurent",
    style: "Solferino",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["solferino", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 700,
    maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/saint-laurent/products.json",
  })),

  // Dior Caro (#456) — sizes Mini / Small / Medium. excludeTokens drop the Caro heart
  // pouch / chain pouch / compact card wallet SLGs. Dior collection slug = christian-dior.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Dior",
    style: "Caro",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["caro", size],
    excludeTokens: ["pouch", "wallet", "heart", "card", "compact"],
    minPrice: 1500,
    maxPrice: 5000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  })),

  // Dior Bobby (#457) — sizes Micro / Small / Medium / Large / East-West. TRAP:
  // "diorbobby" sunglasses + "d-bobby" brim hat share the name; excludeTokens drop them.
  ...(["micro", "small", "medium", "large", "east-west"] as const).map((size) => ({
    brand: "Dior",
    style: "Bobby",
    size_label: size === "east-west" ? "East-West" : size[0].toUpperCase() + size.slice(1),
    requireTokens: ["bobby", size],
    excludeTokens: ["sunglass", "hat", "brim", "wallet", "card"],
    minPrice: 1200,
    maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  })),

  // Dior Toujours (#459) — sizes Small / Medium / Large.
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Dior",
    style: "Dior Toujours",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["toujours", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 1500,
    maxPrice: 5000,
    searchUrl: "https://www.fashionphile.com/collections/christian-dior/products.json",
  })),

  // Fendi Mon Trésor (#480) — the bucket bag, sizes Micro / Mini / Small.
  ...(["micro", "mini", "small"] as const).map((size) => ({
    brand: "Fendi",
    style: "Mon Trésor",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["mon-tresor", size],
    excludeTokens: ["charm", "wallet"],
    minPrice: 700,
    maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // Fendi By the Way (#481) — the Boston bag, sizes Mini / Medium / Large.
  ...(["mini", "medium", "large"] as const).map((size) => ({
    brand: "Fendi",
    style: "By the Way",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["by-the-way", size],
    excludeTokens: ["charm", "wallet"],
    minPrice: 500,
    maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // Fendi Fendigraphy (#482) — the hobo, sizes Small / Medium. TRAP: the "nano
  // fendigraphy" is a bag CHARM (excluded, not a size bucket).
  ...(["small", "medium"] as const).map((size) => ({
    brand: "Fendi",
    style: "Fendigraphy",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["fendigraphy", size],
    excludeTokens: ["charm", "wallet"],
    minPrice: 1000,
    maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/fendi/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // ICONS 2026-06-23 (batch 7) — Prada / Bottega Veneta / Chanel permanent icons
  // (Fashionphile-first, no browser). Validated against each live collection JSON.
  // ════════════════════════════════════════════════════════════════════════════

  // Prada Cleo (#493) — the sleek flap, sizes Mini / Standard / Large.
  {
    brand: "Prada", style: "Cleo", size_label: "Mini",
    requireTokens: ["cleo", "mini"],
    excludeTokens: ["wallet", "card"],
    minPrice: 700, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },
  {
    brand: "Prada", style: "Cleo", size_label: "Large",
    requireTokens: ["cleo", "large"],
    excludeTokens: ["wallet", "card"],
    minPrice: 700, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },
  {
    brand: "Prada", style: "Cleo", size_label: "Standard",
    requireTokens: ["cleo"],
    excludeTokens: ["mini", "large", "wallet", "card"],
    minPrice: 700, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },

  // Prada Symbole (#496) — sizes Micro / Mini / Small / Large. TRAP: "symbole" is
  // mostly SUNGLASSES on FP (spr-* style codes); excludeTokens + the price band drop them.
  ...(["micro", "mini", "small", "large"] as const).map((size) => ({
    brand: "Prada",
    style: "Symbole",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["symbole", size],
    excludeTokens: ["sunglass", "spr", "wallet"],
    minPrice: 800,
    maxPrice: 5000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  })),

  // Prada Moon (#497) — the puffy nylon shoulder bag, one size (Standard).
  {
    brand: "Prada", style: "Moon", size_label: "Standard",
    requireTokens: ["moon", "shoulder"],
    excludeTokens: ["wallet", "card"],
    minPrice: 500, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },

  // Prada Arqué (#495) — sizes Mini / Small / Standard.
  {
    brand: "Prada", style: "Arqué", size_label: "Mini",
    requireTokens: ["arque", "mini"],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },
  {
    brand: "Prada", style: "Arqué", size_label: "Small",
    requireTokens: ["arque", "small"],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },
  {
    brand: "Prada", style: "Arqué", size_label: "Standard",
    requireTokens: ["arque"],
    excludeTokens: ["mini", "small", "wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/prada/products.json",
  },

  // Bottega Veneta The Pouch (#471) — the oversized clutch, sizes Mini / Standard.
  // TRAP: "maxi-intrecciato" is the WEAVE not a size, so it folds into Standard.
  {
    brand: "Bottega Veneta", style: "The Pouch", size_label: "Mini",
    requireTokens: ["the-pouch", "mini"],
    excludeTokens: ["wallet", "card"],
    minPrice: 800, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },
  {
    brand: "Bottega Veneta", style: "The Pouch", size_label: "Standard",
    requireTokens: ["the-pouch"],
    excludeTokens: ["mini", "wallet", "card"],
    minPrice: 800, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },

  // Bottega Veneta Loop (#474) — the intrecciato camera bag, sizes Mini / Small / Medium.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Bottega Veneta",
    style: "Loop",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["loop", size],
    excludeTokens: ["wallet", "card"],
    minPrice: 600,
    maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  })),

  // Bottega Veneta Knot (#477) — the double-knot bag, sizes Mini / Small. excludeTokens
  // drop the Knot×Loop hybrid camera bag + wallets.
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Bottega Veneta",
    style: "Knot",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["knot", size],
    excludeTokens: ["loop", "wallet", "card"],
    minPrice: 400,
    maxPrice: 3000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  })),

  // Bottega Veneta Sardine (#475) — sizes Mini / Medium / Standard.
  {
    brand: "Bottega Veneta", style: "Sardine", size_label: "Mini",
    requireTokens: ["sardine", "mini"],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },
  {
    brand: "Bottega Veneta", style: "Sardine", size_label: "Medium",
    requireTokens: ["sardine", "medium"],
    excludeTokens: ["wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },
  {
    brand: "Bottega Veneta", style: "Sardine", size_label: "Standard",
    requireTokens: ["sardine"],
    excludeTokens: ["mini", "medium", "wallet", "card"],
    minPrice: 1000, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },

  // Bottega Veneta Lauren 1980 (#476) — the chain clutch, sizes Small / Standard.
  // require the literal "lauren-1980".
  {
    brand: "Bottega Veneta", style: "Lauren 1980", size_label: "Small",
    requireTokens: ["lauren-1980", "small"],
    excludeTokens: ["wallet", "card"],
    minPrice: 2000, maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },
  {
    brand: "Bottega Veneta", style: "Lauren 1980", size_label: "Standard",
    requireTokens: ["lauren-1980"],
    excludeTokens: ["small", "wallet", "card"],
    minPrice: 2000, maxPrice: 6000,
    searchUrl: "https://www.fashionphile.com/collections/bottega-veneta/products.json",
  },

  // Chanel Deauville (#429) — the tote, sizes Mini / Small / Medium / Large.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Deauville",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["deauville", size],
    excludeTokens: ["wallet", "pouch", "bowling"],
    minPrice: 2000,
    maxPrice: 8000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Chanel Vanity Case (#430) — sizes Mini / Small / Medium / Large (spans classic /
  // round / slim forms — all the same Vanity Case style). Wide band (vintage wood
  // round CC vanity cases run high). excludeTokens drop the makeup brush / SLGs.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Vanity Case",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["vanity", size],
    excludeTokens: ["brush", "wallet", "card"],
    minPrice: 1500,
    maxPrice: 25000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // Chanel Business Affinity (#432) — the flap/shoulder bag, sizes Mini/Small/Medium/
  // Large. excludeTokens route the Affinity backpack / phone holder / waist belt bag /
  // SLGs away (distinct forms), keeping the flap & clutch-with-chain.
  ...(["mini", "small", "medium", "large"] as const).map((size) => ({
    brand: "Chanel",
    style: "Business Affinity",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["affinity", size],
    excludeTokens: ["backpack", "phone", "belt", "waist", "wallet", "card"],
    minPrice: 2000,
    maxPrice: 7000,
    searchUrl: "https://www.fashionphile.com/collections/chanel/products.json",
  })),

  // ════════════════════════════════════════════════════════════════════════════
  // BURBERRY ICONS 2026-06-23 (batch 8) — Burberry permanent icons (Fashionphile-
  // first, no browser). Validated against the live Burberry collection JSON.
  // (Kate Spade has an empty FP collection — not an FP source, like Coach.)
  // ════════════════════════════════════════════════════════════════════════════

  // Burberry Knight (#198) — the crossbody/shoulder, size Small. TRAP: "knight" is
  // also a Burberry COLORWAY ("...duffle-bag-knight") and appears on scarves + the
  // "rose clutch"; require a size + excludeTokens drop scarf/duffle/clutch/peg.
  {
    brand: "Burberry", style: "The Knight", size_label: "Small",
    requireTokens: ["knight", "small"],
    excludeTokens: ["scarf", "duffle", "clutch", "rose", "peg", "wallet"],
    minPrice: 400, maxPrice: 2000,
    searchUrl: "https://www.fashionphile.com/collections/burberry/products.json",
  },

  // Burberry Lola (#199) — the quilted camera bag, sizes Mini / Small. excludeTokens
  // drop the Lola bum bag + wallets.
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Burberry",
    style: "Lola",
    size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["lola", size],
    excludeTokens: ["bum", "wallet", "card"],
    minPrice: 400,
    maxPrice: 2000,
    searchUrl: "https://www.fashionphile.com/collections/burberry/products.json",
  })),
  // ── Balenciaga backbone (2026-06-30, handles validated vs live collection JSON) ──
  // Le Cagole shoulder bag. excludeTokens drop the Neo Cagole sub-model and the
  // duffle/sling/bucket sub-shapes so XS/Mini stay the canonical shoulder bag.
  ...(["xs", "mini"] as const).map((size) => ({
    brand: "Balenciaga", style: "Le Cagole", size_label: size === "xs" ? "XS" : "Mini",
    requireTokens: ["le-cagole", size],
    excludeTokens: ["neo", "duffle", "sling", "bucket", "wallet", "card", "phone"],
    minPrice: 500, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/balenciaga/products.json",
  })),
  // Hourglass top-handle. excludeTokens drop SLGs + the distinct chain-bag shoulder variant.
  ...(["xs", "small"] as const).map((size) => ({
    brand: "Balenciaga", style: "Hourglass", size_label: size === "xs" ? "XS" : "Small",
    requireTokens: ["hourglass", size],
    excludeTokens: ["wallet", "card", "coin", "chain-bag"],
    minPrice: 400, maxPrice: 3500,
    searchUrl: "https://www.fashionphile.com/collections/balenciaga/products.json",
  })),
  // Classic City (Fashionphile handle "le-city"). excludeTokens drop the Neo Classic/Neo Cagole
  // sub-lines that also carry "city" in the handle.
  ...(["small", "medium"] as const).map((size) => ({
    brand: "Balenciaga", style: "City", size_label: size === "small" ? "Small" : "Medium",
    requireTokens: ["le-city", size],
    excludeTokens: ["neo", "wallet", "card", "coin"],
    minPrice: 900, maxPrice: 4000,
    searchUrl: "https://www.fashionphile.com/collections/balenciaga/products.json",
  })),
  // Neo Classic City — Nano is the dominant clean size; exclude the x-Gucci collab outlier + SLGs.
  { brand: "Balenciaga", style: "Neo Classic", size_label: "Nano",
    requireTokens: ["neo-classic", "nano"],
    excludeTokens: ["gucci", "wallet", "card", "coin"],
    minPrice: 400, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/balenciaga/products.json" },
  // Velo — older crossbody; single bucket. Exclude clutches/SLGs that share the collection.
  { brand: "Balenciaga", style: "Velo", size_label: "Standard",
    requireTokens: ["velo"],
    excludeTokens: ["wallet", "card", "coin", "envelope", "clutch"],
    minPrice: 300, maxPrice: 2200,
    searchUrl: "https://www.fashionphile.com/collections/balenciaga/products.json" },
  // Papier zip-around tote (A5/A6) — niche; single bucket.
  { brand: "Balenciaga", style: "Papier", size_label: "Standard",
    requireTokens: ["papier"],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 250, maxPrice: 1500,
    searchUrl: "https://www.fashionphile.com/collections/balenciaga/products.json" },
  // ── Chloé backbone (2026-06-30, handles validated vs live collection JSON) ──
  // Marcie satchel/saddle. Size token anchors the bucket; exclude SLGs.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Chloé", style: "Marcie", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["marcie", size],
    excludeTokens: ["wallet", "card", "coin", "pouch"],
    minPrice: 350, maxPrice: 2200,
    searchUrl: "https://www.fashionphile.com/collections/chloe/products.json",
  })),
  // Faye shoulder/backpack. Size-anchored.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Chloé", style: "Faye", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["faye", size],
    excludeTokens: ["wallet", "card", "coin", "pouch"],
    minPrice: 250, maxPrice: 1600,
    searchUrl: "https://www.fashionphile.com/collections/chloe/products.json",
  })),
  // Woody tote (incl. ribbon tote). Capture the high-n Medium + Large.
  ...(["medium", "large"] as const).map((size) => ({
    brand: "Chloé", style: "Woody Tote", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["woody", size],
    excludeTokens: ["wallet", "card", "coin", "pouch"],
    minPrice: 350, maxPrice: 1600,
    searchUrl: "https://www.fashionphile.com/collections/chloe/products.json",
  })),
  // Drew shoulder bag — low volume, single bucket (most handles carry no size token).
  { brand: "Chloé", style: "Drew", size_label: "Standard",
    requireTokens: ["drew"],
    excludeTokens: ["wallet", "card", "coin", "clutch"],
    minPrice: 300, maxPrice: 1500,
    searchUrl: "https://www.fashionphile.com/collections/chloe/products.json" },
  // Aby day shoulder bag — Medium only on the feed.
  { brand: "Chloé", style: "Aby", size_label: "Medium",
    requireTokens: ["aby", "medium"],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 400, maxPrice: 2000,
    searchUrl: "https://www.fashionphile.com/collections/chloe/products.json" },
  // C Bag — single Mini on the feed.
  { brand: "Chloé", style: "C Bag", size_label: "Mini",
    requireTokens: ["c-bag", "mini"],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 400, maxPrice: 2500,
    searchUrl: "https://www.fashionphile.com/collections/chloe/products.json" },
  // ── Givenchy backbone (2026-06-30, handles validated vs live collection JSON) ──
  // Antigona satchel. Size-anchored; exclude SLGs.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Givenchy", style: "Antigona", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["antigona", size],
    excludeTokens: ["wallet", "card", "coin", "pouch"],
    minPrice: 450, maxPrice: 2600,
    searchUrl: "https://www.fashionphile.com/collections/givenchy/products.json",
  })),
  // Pandora — classic only; exclude the distinct Pandora Box sub-model + SLGs.
  ...(["mini", "small", "medium"] as const).map((size) => ({
    brand: "Givenchy", style: "Pandora", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["pandora", size],
    excludeTokens: ["box", "wallet", "card", "coin"],
    minPrice: 300, maxPrice: 1400,
    searchUrl: "https://www.fashionphile.com/collections/givenchy/products.json",
  })),
  // 4G chain bag/tote. Size-anchored.
  ...(["small", "medium"] as const).map((size) => ({
    brand: "Givenchy", style: "4G", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["4g", size],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 400, maxPrice: 1700,
    searchUrl: "https://www.fashionphile.com/collections/givenchy/products.json",
  })),
  // Voyou — capture the high-n Medium + Nano.
  ...(["nano", "medium"] as const).map((size) => ({
    brand: "Givenchy", style: "Voyou", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["voyou", size],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 500, maxPrice: 2000,
    searchUrl: "https://www.fashionphile.com/collections/givenchy/products.json",
  })),
  // Cut Out (incl. Moon Cut Out) shoulder bag. Size-anchored.
  ...(["mini", "small"] as const).map((size) => ({
    brand: "Givenchy", style: "Cut Out", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["cut-out", size],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 450, maxPrice: 1400,
    searchUrl: "https://www.fashionphile.com/collections/givenchy/products.json",
  })),
  // GV3 — low volume, single bucket.
  { brand: "Givenchy", style: "GV3", size_label: "Standard",
    requireTokens: ["gv3"],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 450, maxPrice: 1600,
    searchUrl: "https://www.fashionphile.com/collections/givenchy/products.json" },
  // ── Valentino backbone (2026-06-30, slug valentino-garavani, handles validated) ──
  // Rockstud SPIKE specifically (handle "rockstud-spike"), not the wider Rockstud line.
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Valentino", style: "Rockstud Spike", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["rockstud-spike", size],
    excludeTokens: ["wallet", "card", "coin", "wristlet"],
    minPrice: 400, maxPrice: 1900,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json",
  })),
  // Roman Stud shoulder/handle bag. Size-anchored.
  ...(["small", "medium", "large"] as const).map((size) => ({
    brand: "Valentino", style: "Roman Stud", size_label: size[0].toUpperCase() + size.slice(1),
    requireTokens: ["roman-stud", size],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 700, maxPrice: 2200,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json",
  })),
  // Locò shoulder bag. Small (high-n) + a Standard bucket for the un-sized handles.
  { brand: "Valentino", style: "Locò", size_label: "Small",
    requireTokens: ["loco", "small"],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 900, maxPrice: 2600,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json" },
  { brand: "Valentino", style: "Locò", size_label: "Standard",
    requireTokens: ["loco"],
    excludeTokens: ["small", "mini", "micro", "wallet", "card", "coin"],
    minPrice: 900, maxPrice: 2600,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json" },
  // One Stud — low volume, single bucket (exclude the chain clutch).
  { brand: "Valentino", style: "One Stud", size_label: "Standard",
    requireTokens: ["one-stud"],
    excludeTokens: ["clutch", "wallet", "card", "coin"],
    minPrice: 400, maxPrice: 1600,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json" },
  // VLogo Signature — the chain crossbody; exclude the other VLogo-tagged models.
  { brand: "Valentino", style: "VLogo Signature", size_label: "Mini",
    requireTokens: ["vlogo", "crossbody"],
    excludeTokens: ["loco", "gate", "antibes", "shopping", "wallet", "card", "coin"],
    minPrice: 500, maxPrice: 1800,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json" },
  // Supervee — low volume, single bucket.
  { brand: "Valentino", style: "Supervee", size_label: "Standard",
    requireTokens: ["supervee"],
    excludeTokens: ["wallet", "card", "coin"],
    minPrice: 700, maxPrice: 1700,
    searchUrl: "https://www.fashionphile.com/collections/valentino-garavani/products.json" },
];

// ---------------------------------------------------------------------------
// MODE A — browser raw-dump (high confidence, per listing)
// ---------------------------------------------------------------------------

/**
 * Shape of one element in the raw dump.
 * `conditionGrade` is optional — capture it from the listing card in the browser
 * (the grade text appears as "Condition: Excellent" on search/product cards).
 * Fashionphile grades: "New" | "Giftable" | "Excellent" | "Very Good" | "Good" | "Fair"
 */
interface RawDumpEntry {
  product: ShopifyProduct;
  /** Canonical listing URL — must be captured alongside the product JSON. */
  url?: string;
  /**
   * Optional condition grade from the listing/product page.
   * Not present in the Shopify product JSON; captured by the condition-enrich pass.
   * Example: "Excellent", "Very Good", "Giftable"
   */
  conditionGrade?: string | null;
  /** Optional free-text condition write-up from the product page. */
  conditionDetail?: string | null;
}

/**
 * Build the shared per-listing spec attrs + enrichment from a parsed FP spec, so the
 * curated and catch-all mappers stay in lockstep (every field the feed/page exposes
 * lands on every row). Listed-date + was-price have no dedicated column yet, so they
 * ride in the `enrichment` jsonb until a migration adds columns.
 */
function fpAttrsAndEnrichment(spec: ReturnType<typeof parseFashionphileProduct>) {
  const enrichment: Record<string, unknown> = {};
  if (spec.listedAt) enrichment.listed_at = spec.listedAt;
  if (spec.compareAtPrice != null) enrichment.compare_at_price = spec.compareAtPrice;
  // Description-mined facts + a PII-scrubbed private reference copy of the text.
  // INTERNAL ONLY: never select enrichment.source_description into user-facing output.
  if (spec.descFacts && Object.values(spec.descFacts).some((v) => v !== null && v !== false)) {
    enrichment.desc_facts = spec.descFacts;
  }
  if (spec.sourceDescription) enrichment.source_description = spec.sourceDescription;
  return {
    attrs: {
      exterior_colorway: spec.color,
      exterior_material: spec.material,
      hardware_color: spec.hardwareColor,
      production_year: spec.productionYear,
      season: spec.season,
      inclusions: spec.inclusions,
      condition_detail: spec.conditionDetail,
      region: spec.region,
      listing_ref: spec.sku,
    },
    enrichment: Object.keys(enrichment).length ? enrichment : null,
  };
}

/**
 * Map a raw Shopify product JSON record to a PriceObservation.
 * Returns null if the record can't be matched to a target or price is absent.
 */
function mapRawRecord(entry: RawDumpEntry, today: string): PriceObservation | null {
  const { product, url, conditionGrade } = entry;
  if (!url) {
    console.warn("fashionphile: raw record missing url — skipping (url is required for attribution)");
    return null;
  }

  const handle = (product.handle ?? "").toLowerCase();
  const title = (product.title ?? "").toLowerCase();

  // BRAND GUARD: only match a target whose brand equals the product's own brand
  // (derived from the handle slug). Without this, a brand's dump can match another
  // brand's target when a loose requireToken appears as a substring — e.g. a
  // Valentino "rockstud-spike-shoulder-bag" was matching a Celine target. Compare
  // accent-/punctuation-insensitively so "Chloé"==="Chloe", "Hermès"==="hermes".
  const productBrand = asciiBrandKey(guessBrandFromHandle(handle));
  const target = TARGETS.find(
    (t) =>
      asciiBrandKey(t.brand) === productBrand &&
      t.requireTokens.every((tok) => handle.includes(tok) || title.includes(tok)) &&
      !(t.excludeTokens ?? []).some((tok) => handle.includes(tok) || title.includes(tok))
  );
  if (!target) {
    console.warn(`fashionphile: no target matched for handle "${product.handle}" — skipping`);
    return null;
  }

  // Pass conditionGrade/Detail so parseFashionphileProduct maps the SaleCondition + write-up.
  const spec = parseFashionphileProduct(product, conditionGrade, entry.conditionDetail);
  if (!spec.price) {
    console.warn(`fashionphile: no price parsed for "${product.handle}" — skipping`);
    return null;
  }
  if (spec.price < target.minPrice || spec.price > target.maxPrice) {
    console.warn(`fashionphile: price ${spec.price} out of band [${target.minPrice}–${target.maxPrice}] for "${product.handle}" — skipping`);
    return null;
  }

  const { attrs, enrichment } = fpAttrsAndEnrichment(spec);
  return {
    brand: target.brand,
    style: target.style,
    attrs: { size_label: target.size_label, ...attrs },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: spec.price,
    currency: spec.currency,
    condition: spec.condition,
    observed_on: today,
    source_url: url,
    confidence: "high",
    notes: product.title?.slice(0, 160) ?? null,
    enrichment,
  };
}

function ingestFromRawDump(): void {
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`fashionphile --raw: dump not found at ${RAW_DUMP}`);
    console.error("Capture step: in Chrome on fashionphile.com, follow docs/research-drafts/fashionphile-capture.md.");
    console.error("Quick version — for each handle, fetch `/products/<handle>.json`, then save:");
    console.error("  [{product: <shopify-product-obj>, url: 'https://www.fashionphile.com/products/<handle>', conditionGrade: 'Excellent'}]");
    console.error("to data/ingest/_raw/fashionphile.json, then re-run with --raw.");
    process.exit(1);
  }
  const raw: RawDumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const today = new Date().toISOString().slice(0, 10);
  const obs: PriceObservation[] = raw
    .map((e) => mapRawRecord(e, today))
    .filter((o): o is PriceObservation => o !== null);

  const { file, kept, dropped } = writeObservations("fashionphile", obs);
  console.log(`fashionphile (raw): ${raw.length} records, ${kept} kept${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

// ---------------------------------------------------------------------------
// MODE A-ALL — catch-all: emit EVERY product (curated mapping where a target
// matches, best-guess otherwise) so nothing is dropped at the adapter. The loader
// places what it can on curated variants and routes the rest into discovered_listing.
// Mirrors the trr-jsonld.ts --catch-all design. The ONLY drop is a missing price.
// ---------------------------------------------------------------------------

/** FP handle/title brand slugs → canonical brand (longest/multi-token first). */
const FP_BRAND_SLUGS: [string, string][] = [
  ["louis-vuitton", "Louis Vuitton"], ["saint-laurent", "Saint Laurent"],
  ["yves-saint-laurent", "Saint Laurent"], ["christian-dior", "Dior"],
  ["bottega-veneta", "Bottega Veneta"], ["kate-spade", "Kate Spade"],
  ["the-row", "The Row"], ["valentino-garavani", "Valentino"], ["miu-miu", "Miu Miu"],
  ["off-white", "Off-White"],
  ["salvatore-ferragamo", "Salvatore Ferragamo"], ["alexander-mcqueen", "Alexander McQueen"],
  ["alexander-wang", "Alexander Wang"], ["marc-jacobs", "Marc Jacobs"], ["jimmy-choo", "Jimmy Choo"],
  ["tory-burch", "Tory Burch"], ["stella-mccartney", "Stella McCartney"], ["dolce-gabbana", "Dolce & Gabbana"],
  // single-token
  ["chanel", "Chanel"], ["hermes", "Hermès"], ["gucci", "Gucci"], ["dior", "Dior"],
  ["celine", "Celine"], ["loewe", "Loewe"], ["fendi", "Fendi"], ["prada", "Prada"],
  ["coach", "Coach"], ["burberry", "Burberry"], ["goyard", "Goyard"], ["balenciaga", "Balenciaga"],
  ["chloe", "Chloe"], ["valentino", "Valentino"], ["givenchy", "Givenchy"], ["versace", "Versace"],
  ["mulberry", "Mulberry"], ["delvaux", "Delvaux"], ["moynat", "Moynat"], ["dolce", "Dolce & Gabbana"],
];

/** Brand-comparison key: lowercase, strip accents + punctuation so "Chloé"==="Chloe". */
export function asciiBrandKey(s: string): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

export function guessBrandFromHandle(handle: string): string {
  const h = (handle ?? "").toLowerCase();
  for (const [slug, name] of FP_BRAND_SLUGS) if (h.startsWith(slug)) return name;
  const first = h.split("-")[0];
  return first ? first[0].toUpperCase() + first.slice(1) : "Unknown";
}

/** Best-guess style from the title: strip the brand and the generic "bag" word. */
export function guessStyleFromTitle(title: string, brand: string): string {
  let s = (title ?? "").trim();
  const lead = [brand.toLowerCase(), "christian dior", "yves saint laurent"];
  const low = s.toLowerCase();
  for (const b of lead) if (low.startsWith(b)) { s = s.slice(b.length); break; }
  s = s.replace(/\bbag\b/gi, "").replace(/\s+/g, " ").trim();
  return s || title?.trim() || "Unknown";
}

/** Catch-all map: every product → observation (best-guess identity, low confidence). */
function mapRawRecordCatchAll(entry: RawDumpEntry, today: string): PriceObservation | null {
  const { product, url, conditionGrade } = entry;
  if (!url) return null;
  const spec = parseFashionphileProduct(product, conditionGrade, entry.conditionDetail);
  if (!spec.price) return null;
  // Prefer the feed's clean vendor string; fall back to slug parsing.
  const brand = product.vendor?.trim() || guessBrandFromHandle(product.handle ?? "");
  const title = product.title ?? product.handle ?? "";
  const { attrs, enrichment } = fpAttrsAndEnrichment(spec);
  return {
    brand,
    style: guessStyleFromTitle(title, brand),
    attrs: { size_label: detectSizeLabel(title), ...attrs },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: spec.price,
    currency: spec.currency,
    condition: spec.condition,
    observed_on: today,
    source_url: url,
    confidence: "low",
    notes: title.slice(0, 160),
    enrichment,
  };
}

/**
 * Catch-all mode: emit ONLY the records that DON'T match a curated target, as
 * best-guess observations. These are meant to load with `load:prices --discovered-only`
 * so they land in discovered_listing (NOT force-matched onto curated variants —
 * pickVariant would otherwise stamp a wrong price on a real variant at score 0).
 * promote-discovered then rolls recurring real models up into the curated catalog.
 */
function ingestCatchAllRemainder(): void {
  if (!fs.existsSync(RAW_DUMP)) {
    console.error(`fashionphile --catch-all: dump not found at ${RAW_DUMP}. Crawl it first (fashionphile-crawl.ts).`);
    process.exit(1);
  }
  const raw: RawDumpEntry[] = JSON.parse(fs.readFileSync(RAW_DUMP, "utf8"));
  const today = new Date().toISOString().slice(0, 10);
  const obs: PriceObservation[] = [];
  let curatedSkipped = 0, dropped = 0;
  for (const e of raw) {
    const handle = (e.product.handle ?? "").toLowerCase();
    const title = (e.product.title ?? "").toLowerCase();
    const hasTarget = TARGETS.some(
      (t) =>
        t.requireTokens.every((tok) => handle.includes(tok) || title.includes(tok)) &&
        !(t.excludeTokens ?? []).some((tok) => handle.includes(tok) || title.includes(tok))
    );
    if (hasTarget) { curatedSkipped++; continue; } // curated rows come from --raw
    const o = mapRawRecordCatchAll(e, today);
    if (o) obs.push(o); else dropped++;
  }
  const { file, kept } = writeObservations("fashionphile", obs);
  console.log(`fashionphile (catch-all): ${raw.length} records -> ${kept} non-curated kept, ${curatedSkipped} curated (use --raw), ${dropped} dropped (no price) -> ${file}`);
}

// ---------------------------------------------------------------------------
// MODE B — live search-page scrape (medium confidence, single search-level row)
// ---------------------------------------------------------------------------

interface ResellerSearchTarget {
  brand: string;
  style: string;
  size_label?: string;
  url: string;
  minPrice: number;
  maxPrice: number;
}

const SEARCH_TARGETS: ResellerSearchTarget[] = TARGETS.map((t) => ({
  brand: t.brand,
  style: t.style,
  size_label: t.size_label,
  url: t.searchUrl,
  minPrice: t.minPrice,
  maxPrice: t.maxPrice,
}));

async function ingestSearchTarget(t: ResellerSearchTarget): Promise<PriceObservation | null> {
  const text = stripTags(await politeFetchText(t.url));
  const prices = parseAllPrices(text)
    .map((p) => p.amount)
    .filter((a) => a >= t.minPrice && a <= t.maxPrice);
  if (prices.length === 0) {
    console.warn(`fashionphile: no in-band prices for ${t.brand} ${t.style} (page may need JS / selector tuning)`);
    return null;
  }
  const amount = Math.min(...prices);
  return {
    brand: t.brand,
    style: t.style,
    attrs: { size_label: t.size_label },
    platform: PLATFORM,
    price_type: "listed",
    sale_price: amount,
    currency: "USD",
    observed_on: new Date().toISOString().slice(0, 10),
    source_url: t.url,
    confidence: "medium",
    notes: `current entry price; min of ${prices.length} in-band listings`,
  };
}

async function ingestFromSearchPages(): Promise<void> {
  const out: PriceObservation[] = [];
  for (const t of SEARCH_TARGETS) {
    const obs = await ingestSearchTarget(t);
    if (obs) out.push(obs);
  }
  const { file, kept, dropped } = writeObservations("fashionphile", out);
  console.log(`fashionphile: wrote ${kept} observation(s)${dropped ? ` (dropped ${dropped})` : ""} -> ${file}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  if (process.argv.includes("--catch-all")) {
    ingestCatchAllRemainder();
  } else if (process.argv.includes("--raw")) {
    ingestFromRawDump();
  } else {
    await ingestFromSearchPages();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
