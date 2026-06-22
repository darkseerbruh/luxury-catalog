/**
 * Voyage AI embedding client — server-only.
 *
 * Uses voyage-multimodal-3.5 (1024-dim, supports text).
 * Degrades gracefully: returns null for every call when VOYAGE_API_KEY is unset.
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-multimodal-3.5";
const BATCH_SIZE = 128; // Voyage max per request

type InputType = "query" | "document";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
}

async function fetchEmbeddings(
  inputs: string[],
  input_type: InputType
): Promise<number[][] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, input: inputs, input_type }),
  });

  if (!res.ok) {
    console.error(`Voyage API error ${res.status}: ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as VoyageResponse;
  // Sort by index to match input order (Voyage may return out of order).
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** Embed a single query string (e.g. a user's search query). */
export async function embedQuery(text: string): Promise<number[] | null> {
  const result = await fetchEmbeddings([text], "query");
  return result ? result[0] : null;
}

/** Embed a batch of document strings (e.g. variant descriptions for catalog indexing). */
export async function embedDocuments(texts: string[]): Promise<(number[] | null)[]> {
  if (!process.env.VOYAGE_API_KEY) return texts.map(() => null);
  if (texts.length === 0) return [];

  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await fetchEmbeddings(batch, "document");
    if (embeddings) {
      for (let j = 0; j < batch.length; j++) {
        results[i + j] = embeddings[j];
      }
    }
  }

  return results;
}

/** Build the text representation of a catalog variant for embedding. */
export function variantToEmbedText(v: {
  brand?: string | null;
  styleName?: string | null;
  silhouette?: string | null;
  sizeCategory?: string | null;
  sizeLabel?: string | null;
  exteriorColorway?: string | null;
  hardwareColor?: string | null;
  materialType?: string | null;
}): string {
  const parts = [
    v.brand,
    v.styleName,
    v.silhouette,
    v.sizeLabel ?? v.sizeCategory,
    v.exteriorColorway,
    v.hardwareColor ? `${v.hardwareColor} hardware` : null,
    v.materialType,
  ].filter(Boolean);
  return parts.join(", ");
}
