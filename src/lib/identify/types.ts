/**
 * Shared request/response types for the camera identify flow.
 * Imported by both the /api/identify route (server) and the /identify page
 * (client), so the contract can't silently drift.
 */

export interface IdentificationResult {
  brand: string | null;
  style: string | null;
  sizeLabel: string | null;
  colorway: string | null;
  hardwareColor: string | null;
  hardwareType: string | null;
  materialType: string | null;
  visibleAuthMarkers: string[];
  madeIn: string | null;
  /** Store price tag read off the sticker when one is legible (e.g. "$18.99"). */
  priceTagText: string | null;
  confidence: "high" | "medium" | "low";
  notes: string | null;
}

/**
 * A brand-bearing region the model spotted in a frame: a stamp, label, medallion,
 * price tag or printed logo. `region` is normalized 0..1 in the sent image's
 * coordinate space so the client can re-crop the SAME region from its native-res
 * copy of the frame for the refine round.
 */
export interface LogoHint {
  /** Index into the images sent with the request. */
  imageIndex: number;
  kind: "stamp" | "label" | "tag" | "medallion" | "print" | "hardware";
  /** Whether the text was readable at the resolution seen. */
  legible: boolean;
  /** The text as read, when legible. */
  text: string | null;
  region: { x: number; y: number; w: number; h: number };
}

export interface CatalogMatch {
  styleId: number;
  styleName: string;
  brandName: string;
  variantId: number | null;
  sizeLabel: string | null;
  exteriorColorway: string | null;
  hardwareColor: string | null;
}

export interface ResaleEstimate {
  median: number;
  low?: number | null;
  count: number;
  currency: string;
  asOf: string | null;
}

export interface IdentifyResponse {
  identification?: IdentificationResult;
  /** Regions worth a native-resolution re-read (the logo pass). */
  logoHints?: LogoHint[];
  catalogMatch?: CatalogMatch | null;
  resale?: ResaleEstimate | null;
  hardFlag?: { reason: string } | null;
  error?: string;
}

export interface LiveReadResponse {
  /** True when a brand stamp/label/tag was read well enough to name text. */
  readable: boolean;
  kind: "stamp" | "label" | "tag" | "medallion" | "print" | "none";
  text: string | null;
  error?: string;
}
