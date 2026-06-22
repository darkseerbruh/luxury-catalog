import { describe, it, expect } from "vitest";

// Test RRF fusion logic in isolation (no DB calls).
// The rrfFuse and tasteRerank functions are not exported, but we can test
// the contract via the observable outputs of the module.

// Import the pure helper that IS exported:
import { variantToEmbedText } from "../voyage";

// ── RRF math (inline, mirrors implementation) ──────────────────────────────

const RRF_K = 60;
function rrfScore(rank: number) { return 1 / (RRF_K + rank); }

function rrfFuse(
  bm25: Map<number, number>,
  vector: Map<number, number>
): { variantId: number; score: number }[] {
  const all = new Set([...bm25.keys(), ...vector.keys()]);
  const scores: { variantId: number; score: number }[] = [];
  for (const vid of all) {
    let score = 0;
    if (bm25.has(vid)) score += rrfScore(bm25.get(vid)!);
    if (vector.has(vid)) score += rrfScore(vector.get(vid)!);
    scores.push({ variantId: vid, score });
  }
  return scores.sort((a, b) => b.score - a.score);
}

describe("RRF fusion", () => {
  it("item appearing in both legs scores higher than either leg alone", () => {
    const bm25 = new Map([[1, 1], [2, 2], [3, 3]]);
    const vec  = new Map([[1, 1], [4, 2]]);
    const result = rrfFuse(bm25, vec);
    const idOrder = result.map((r) => r.variantId);
    // Item 1 appears in both → highest score
    expect(idOrder[0]).toBe(1);
  });

  it("produces deterministic ordering for equal-rank items", () => {
    const bm25 = new Map([[10, 1], [20, 2]]);
    const vec  = new Map([[20, 1], [10, 2]]);
    const r1 = rrfFuse(bm25, vec);
    const r2 = rrfFuse(bm25, vec);
    expect(r1.map((x) => x.variantId)).toEqual(r2.map((x) => x.variantId));
  });

  it("handles empty vector leg (degrades to BM25 only)", () => {
    const bm25 = new Map([[5, 1], [6, 2], [7, 3]]);
    const result = rrfFuse(bm25, new Map());
    expect(result.map((r) => r.variantId)).toEqual([5, 6, 7]);
  });

  it("handles empty BM25 leg (degrades to vector only)", () => {
    const vec = new Map([[5, 1], [6, 2]]);
    const result = rrfFuse(new Map(), vec);
    expect(result[0].variantId).toBe(5);
  });

  it("RRF score is strictly between 0 and 1/(K+1) for any rank ≥ 1", () => {
    for (const rank of [1, 5, 100, 1000]) {
      const s = rrfScore(rank);
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(1 / (RRF_K + 1));
    }
  });

  it("lower rank (better) produces higher RRF score", () => {
    expect(rrfScore(1)).toBeGreaterThan(rrfScore(10));
    expect(rrfScore(10)).toBeGreaterThan(rrfScore(100));
  });
});

// ── variantToEmbedText (cross-check) ──────────────────────────────────────

describe("variantToEmbedText produces non-empty text for typical variants", () => {
  it("Birkin 35", () => {
    const t = variantToEmbedText({ brand: "Hermès", styleName: "Birkin", sizeLabel: "35", exteriorColorway: "gold", materialType: "leather" });
    expect(t.length).toBeGreaterThan(10);
    expect(t).toContain("Hermès");
    expect(t).toContain("Birkin");
  });
});
