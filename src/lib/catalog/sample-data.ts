/**
 * Sample catalog data for the first vertical slice.
 *
 * This is a small, hand-built dataset so the browse -> detail flow renders and
 * fires real value events before the Supabase tables are populated. The shape
 * mirrors the `variant` row plus its related detail tables (serial_tag,
 * provenance_packaging, price_history). Swap `getAllBags`/`getBagById` for
 * Supabase queries once the catalog is seeded — the page components only depend
 * on these two functions.
 */

export type BrandTier = "thrift" | "mid" | "ultra-luxury";
export type SizeCategory = "mini" | "small" | "medium" | "large" | "oversized";
export type MaterialCategory =
  | "leather"
  | "exotic"
  | "fabric"
  | "coated canvas"
  | "other";
export type ConfidenceLevel = "low" | "medium" | "high" | "verified";

export interface AuthMarker {
  title: string;
  detail: string;
}

export interface ProvenanceItem {
  item: string;
  detail: string;
}

export interface PricePoint {
  platform: string;
  condition: string;
  price: number;
  date: string;
}

export interface ResaleLink {
  platform: string;
  url: string;
}

export interface Bag {
  id: string;
  brand: string;
  brand_tier: BrandTier;
  style: string;
  silhouette: string;
  size_category: SizeCategory;
  material_category: MaterialCategory;
  colorway: string;
  retail_price: number;
  currency: string;
  confidence_level: ConfidenceLevel;
  summary: string;
  authMarkers: AuthMarker[];
  provenance: ProvenanceItem[];
  priceHistory: PricePoint[];
  resaleLinks: ResaleLink[];
}

const BAGS: Bag[] = [
  {
    id: "hermes-birkin-30-togo",
    brand: "Hermès",
    brand_tier: "ultra-luxury",
    style: "Birkin 30",
    silhouette: "structured",
    size_category: "medium",
    material_category: "leather",
    colorway: "Étoupe / Palladium",
    retail_price: 11400,
    currency: "USD",
    confidence_level: "verified",
    summary:
      "The 30cm Birkin in Togo leather — the benchmark structured top-handle. Palladium hardware, sangles, and a turn-lock clochette.",
    authMarkers: [
      {
        title: "Blind stamp",
        detail:
          "Heat-pressed date stamp on the interior strap; letter-in-a-shape system identifies the production year and workshop.",
      },
      {
        title: "Saddle stitching",
        detail:
          "Hand-saddle-stitched, slightly irregular and angled — never perfectly machine-uniform on an authentic piece.",
      },
      {
        title: "Hardware engraving",
        detail:
          "'HERMÈS PARIS' engraving on the turn-lock is crisp and centred; screws are flush and unscratched.",
      },
    ],
    provenance: [
      { item: "Box", detail: "Orange textured box with brown ribbon." },
      { item: "Dust bag", detail: "Cream flannel bag with brown print." },
      { item: "Rain cape", detail: "Branded protective cape, often missing on resale." },
      { item: "Clochette, lock & 2 keys", detail: "Numbered lock matching keys." },
    ],
    priceHistory: [
      { platform: "Fashionphile", condition: "very good", price: 18500, date: "2026-05-12" },
      { platform: "The RealReal", condition: "excellent", price: 21200, date: "2026-04-02" },
      { platform: "Vestiaire", condition: "good", price: 16900, date: "2026-02-20" },
    ],
    resaleLinks: [
      { platform: "Fashionphile", url: "https://www.fashionphile.com/shop?q=birkin%2030%20togo" },
      { platform: "The RealReal", url: "https://www.therealreal.com/search?keywords=birkin%2030" },
    ],
  },
  {
    id: "chanel-classic-flap-medium",
    brand: "Chanel",
    brand_tier: "ultra-luxury",
    style: "Classic Flap (Medium)",
    silhouette: "semi-structured",
    size_category: "medium",
    material_category: "leather",
    colorway: "Black Caviar / Gold",
    retail_price: 10800,
    currency: "USD",
    confidence_level: "verified",
    summary:
      "The medium/large Classic Flap in caviar with the CC turn-lock and leather-woven chain. The quietest blue-chip resale bag there is.",
    authMarkers: [
      {
        title: "Serial sticker & hologram",
        detail:
          "Hologram sticker with a serial whose first digits map to the production year; edges should be intact, not re-glued.",
      },
      {
        title: "CC lock alignment",
        detail:
          "Right-over-left CC overlap at the top, left-over-right at the bottom; backing plate engraved 'CHANEL'.",
      },
      {
        title: "Quilting continuity",
        detail:
          "Diamond quilting lines up across the flap seam and around the back — a common giveaway on fakes.",
      },
    ],
    provenance: [
      { item: "Box", detail: "Black magnetic box with camellia." },
      { item: "Authenticity card", detail: "Serial on card matches the interior sticker." },
      { item: "Dust bag", detail: "Two styles by era: tie-top and envelope." },
    ],
    priceHistory: [
      { platform: "Fashionphile", condition: "excellent", price: 9400, date: "2026-05-28" },
      { platform: "Rebag", condition: "very good", price: 8800, date: "2026-03-15" },
    ],
    resaleLinks: [
      { platform: "Fashionphile", url: "https://www.fashionphile.com/shop?q=chanel%20classic%20flap%20medium" },
      { platform: "Rebag", url: "https://www.rebag.com/shop/?q=chanel%20classic%20flap" },
    ],
  },
  {
    id: "louis-vuitton-neverfull-mm",
    brand: "Louis Vuitton",
    brand_tier: "ultra-luxury",
    style: "Neverfull MM",
    silhouette: "tote",
    size_category: "large",
    material_category: "coated canvas",
    colorway: "Monogram / Beige interior",
    retail_price: 2200,
    currency: "USD",
    confidence_level: "high",
    summary:
      "The workhorse monogram tote with a removable zip pouch. High availability, so price history is a sharper authentication tool than rarity.",
    authMarkers: [
      {
        title: "Date code (legacy)",
        detail:
          "Pieces before 2021 carry a heat-stamped date code (factory + week + year); 2021+ use an embedded RFID chip instead.",
      },
      {
        title: "Monogram symmetry",
        detail:
          "Canvas is cut so the monogram mirrors across the central seam; LV logos are never cut off at the seams on newer pieces.",
      },
    ],
    provenance: [
      { item: "Removable pochette", detail: "Matching zip pouch with its own date code." },
      { item: "Dust bag", detail: "Beige/yellow drawstring bag." },
    ],
    priceHistory: [
      { platform: "Fashionphile", condition: "good", price: 1450, date: "2026-06-01" },
      { platform: "The RealReal", condition: "very good", price: 1620, date: "2026-04-18" },
      { platform: "Vestiaire", condition: "fair", price: 1180, date: "2026-03-09" },
    ],
    resaleLinks: [
      { platform: "Fashionphile", url: "https://www.fashionphile.com/shop?q=neverfull%20mm" },
      { platform: "Vestiaire", url: "https://www.vestiairecollective.com/search/?q=neverfull%20mm" },
    ],
  },
  {
    id: "polene-numero-un-nano",
    brand: "Polène",
    brand_tier: "mid",
    style: "Numéro Un Nano",
    silhouette: "structured",
    size_category: "mini",
    material_category: "leather",
    colorway: "Camel textured",
    retail_price: 360,
    currency: "USD",
    confidence_level: "high",
    summary:
      "The trompe-l'œil crescent mini that drove Polène's breakout. Smooth, full-grain leather and a clean magnetic fold-over.",
    authMarkers: [
      {
        title: "Embossed logo",
        detail:
          "'Polène Paris' deboss is shallow and even; the accent on the first é is present and correctly placed.",
      },
      {
        title: "Edge paint",
        detail:
          "Hand-painted edges are smooth and consistent in colour with no cracking on a new piece.",
      },
    ],
    provenance: [
      { item: "Dust bag", detail: "Off-white cotton bag with centred logo." },
      { item: "Box", detail: "Recycled kraft box, magnetic lid." },
    ],
    priceHistory: [
      { platform: "Vestiaire", condition: "excellent", price: 280, date: "2026-05-20" },
      { platform: "Vestiaire", condition: "good", price: 230, date: "2026-02-11" },
    ],
    resaleLinks: [
      { platform: "Vestiaire", url: "https://www.vestiairecollective.com/search/?q=polene%20numero%20un%20nano" },
    ],
  },
  {
    id: "telfar-shopping-bag-medium",
    brand: "Telfar",
    brand_tier: "mid",
    style: "Shopping Bag (Medium)",
    silhouette: "tote",
    size_category: "medium",
    material_category: "other",
    colorway: "Black vegan leather",
    retail_price: 257,
    currency: "USD",
    confidence_level: "high",
    summary:
      "The 'Bushwick Birkin' — vegan-leather shopper with embossed logo and crossbody + handheld carry. Drop-based releases drive resale.",
    authMarkers: [
      {
        title: "Embossed T logo",
        detail:
          "Central debossed Telfar 'T' is sharp and symmetric; spacing of the logo lines is consistent.",
      },
      {
        title: "Strap construction",
        detail:
          "Three-strap system (two short, one long crossbody) with clean, even stitching at the anchor points.",
      },
    ],
    provenance: [
      { item: "Dust bag", detail: "Not always included; printed Telfar logo when present." },
    ],
    priceHistory: [
      { platform: "Grailed", condition: "very good", price: 240, date: "2026-06-05" },
      { platform: "eBay", condition: "good", price: 195, date: "2026-04-22" },
    ],
    resaleLinks: [
      { platform: "Grailed", url: "https://www.grailed.com/shop?query=telfar%20medium" },
    ],
  },
  {
    id: "longchamp-le-pliage-l",
    brand: "Longchamp",
    brand_tier: "thrift",
    style: "Le Pliage (Large)",
    silhouette: "tote",
    size_category: "large",
    material_category: "fabric",
    colorway: "Navy nylon / Tan leather",
    retail_price: 165,
    currency: "USD",
    confidence_level: "verified",
    summary:
      "The foldable nylon tote with a leather flap and snap. Ubiquitous and inexpensive — a useful 'entry tier' reference point.",
    authMarkers: [
      {
        title: "Horse logo embossing",
        detail:
          "'Longchamp Paris' jockey logo on the flap is cleanly stamped into the leather, not printed.",
      },
      {
        title: "Zip pull",
        detail:
          "Engraved branded zip pull; nylon is matte ripstop, not glossy.",
      },
    ],
    provenance: [
      { item: "Dust bag", detail: "Rarely sold with one; not expected at this tier." },
    ],
    priceHistory: [
      { platform: "eBay", condition: "good", price: 70, date: "2026-05-30" },
      { platform: "Poshmark", condition: "very good", price: 95, date: "2026-03-25" },
    ],
    resaleLinks: [
      { platform: "eBay", url: "https://www.ebay.com/sch/i.html?_nkw=longchamp%20le%20pliage%20large" },
    ],
  },
];

export function getAllBags(): Bag[] {
  return BAGS;
}

export function getBagById(id: string): Bag | undefined {
  return BAGS.find((bag) => bag.id === id);
}

/** Event-property bundle for a bag, matching `CatalogEventProperties`. */
export function bagEventProps(bag: Bag) {
  return {
    brand: bag.brand,
    brand_tier: bag.brand_tier,
    style: bag.style,
    silhouette: bag.silhouette,
    material_category: bag.material_category,
    size_category: bag.size_category,
    confidence_level: bag.confidence_level,
  };
}
