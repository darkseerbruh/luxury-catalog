import { describe, it, expect } from "vitest";
import { canonicalModel } from "../ingest/model-normalize";

describe("canonicalModel", () => {
  it("maps a known model from a brand-less FP title", () => {
    expect(canonicalModel("Celine", "Leather Luggage Medium")).toBe("Luggage");
    expect(canonicalModel("Gucci", "Calfskin Mini Dionysus Shoulder Bag")).toBe("Dionysus");
    expect(canonicalModel("Hermès", "Togo Birkin 30")).toBe("Birkin");
    expect(canonicalModel("Louis Vuitton", "Monogram Neverfull MM")).toBe("Neverfull");
  });

  it("excludes accessories / small leather goods (shares a model name)", () => {
    expect(canonicalModel("Gucci", "Calfskin Mini Dionysus Chain Wallet")).toBeNull();
    expect(canonicalModel("Chanel", "Lambskin Classic Flap Card Holder")).toBeNull();
    expect(canonicalModel("Hermès", "Epsom Constance Slim Wallet")).toBeNull();
    expect(canonicalModel("Gucci", "GG Marmont Key Pouch")).toBeNull();
  });

  it("prefers the more-specific model when listed first", () => {
    expect(canonicalModel("Louis Vuitton", "Monogram Pochette Metis East West")).toBe("Pochette Métis");
    expect(canonicalModel("Loewe", "Calfskin Puzzle Edge Small")).toBe("Puzzle Edge");
  });

  it("returns null for an unknown model or unknown brand", () => {
    expect(canonicalModel("Chanel", "Some Totally Unknown Style")).toBeNull();
    expect(canonicalModel("Nonexistent Brand", "Birkin 30")).toBeNull();
    expect(canonicalModel("Celine", "")).toBeNull();
  });

  it("does not false-match a substring inside another word", () => {
    // "noe" must not match inside "monogram"/"shoulder"; requires whole word
    expect(canonicalModel("Louis Vuitton", "Monogram Shoulder Bag")).toBeNull();
  });
});
