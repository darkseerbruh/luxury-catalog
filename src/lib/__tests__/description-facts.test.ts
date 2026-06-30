import { describe, it, expect } from "vitest";
import { extractDescriptionFacts, scrubPii } from "../ingest/description-facts";

// Real Fashionphile templated phrasings (verified live 2026-06-29).
const CELINE = "This is an authentic CELINE Shiny Calfskin Mini Triomphe in Black. This chic shoulder bag is crafted of calfskin leather in black. The bag features an adjustable leather shoulder strap, gold hardware, and a gold snap lock. This opens to a black leather interior with a patch pocket.";
const LV = "This is an authentic LOUIS VUITTON Monogram Side Trunk PM. This chic trunk is featured in classic Louis Vuitton monogram canvas in brown. This side trunk features a vachetta shoulder strap with gold hardware and a push lock on the front. The top zipper opens to a brown microfiber interior.";

describe("extractDescriptionFacts", () => {
  it("pulls colour, strap, closure, interior from a real Celine description", () => {
    const f = extractDescriptionFacts(CELINE);
    expect(f.color).toBe("Black");
    expect(f.strap_type).toContain("strap");
    expect(f.closure).toBe("snap lock");
    expect(f.interior_material).toBe("leather");
  });

  it("pulls pattern + interior from a real LV description", () => {
    const f = extractDescriptionFacts(LV);
    expect(f.pattern).toBe("Monogram");
    expect(f.closure).toBe("push lock");
    expect(f.interior_material).toBe("microfiber");
  });

  it("captures measurements and date-code presence (eBay-style text)", () => {
    const f = extractDescriptionFacts('Pre-owned. Measures 10" x 8" x 4". Date code SD1024 present inside.');
    expect(f.measurements).toMatch(/10/);
    expect(f.has_date_code).toBe(true);
  });

  it("returns all-null/false for empty text (never invents)", () => {
    const f = extractDescriptionFacts("");
    expect(f.color).toBeNull();
    expect(f.has_date_code).toBe(false);
  });
});

describe("scrubPii", () => {
  it("removes email + phone from an off-platform solicitation sentence", () => {
    const out = scrubPii("Authentic bag, great shape. Text me at 555-123-4567 or seller@gmail.com to buy direct.")!;
    expect(out).not.toContain("seller@gmail.com");
    expect(out).not.toContain("555-123-4567");
    expect(out).toContain("[redacted");
  });

  it("redacts a bare email + phone outside a contact lead-in", () => {
    const out = scrubPii("Questions to jane@example.com. Inventory line 1-800-555-0199.")!;
    expect(out).toContain("[redacted-email]");
    expect(out).toContain("[redacted-phone]");
  });

  it("keeps the surrounding factual sentence intact", () => {
    const out = scrubPii("Black caviar leather, gold hardware. Includes box and dust bag.");
    expect(out).toBe("Black caviar leather, gold hardware. Includes box and dust bag.");
  });

  it("redacts off-platform URLs", () => {
    expect(scrubPii("See more at www.myshop.com")).toContain("[redacted-url]");
  });

  it("returns null for empty input", () => {
    expect(scrubPii("")).toBeNull();
    expect(scrubPii(null)).toBeNull();
  });
});
