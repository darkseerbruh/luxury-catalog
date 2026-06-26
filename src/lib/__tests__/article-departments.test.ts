import { describe, it, expect } from "vitest";
import { classifyDepartment, getDepartment, DEPARTMENTS } from "../article-departments";

const post = (slug: string, title: string) => ({ slug, title });

describe("classifyDepartment", () => {
  it("routes authentication pieces by their markers", () => {
    expect(classifyDepartment(post("how-to-authenticate-louis-vuitton", "How to authenticate Louis Vuitton"))).toBe("authentication");
    expect(classifyDepartment(post("spot-a-fake-gucci-marmont", "How to spot a fake Gucci Marmont"))).toBe("authentication");
    expect(classifyDepartment(post("resale-red-flags", "Five resale red flags worth walking away from"))).toBe("authentication");
  });

  it("routes bag-vs-bag pieces to comparisons", () => {
    expect(classifyDepartment(post("birkin-vs-kelly", "Birkin vs Kelly: which one to chase"))).toBe("comparisons");
    expect(classifyDepartment(post("neverfull-mm-vs-pm", "Neverfull MM vs PM"))).toBe("comparisons");
  });

  it("routes pricing/demand pieces to market", () => {
    expect(classifyDepartment(post("what-a-coach-tabby-actually-sells-for", "What a Coach Tabby actually sells for"))).toBe("market");
    expect(classifyDepartment(post("dior-saddle-resale-price", "The Dior Saddle is back. Here is what it costs now"))).toBe("market");
  });

  it("pins market pieces whose titles contain 'vs' (override beats the vs keyword)", () => {
    expect(classifyDepartment(post("asking-price-vs-sold-price", "The asking-price illusion: what bags list for vs what they sell for"))).toBe("market");
    expect(classifyDepartment(post("most-searched-vs-most-expensive-bags", "The most-wanted bags are not the most expensive (mostly)"))).toBe("market");
  });

  it("keeps a 'vs' comparison that is also about value in comparisons", () => {
    expect(classifyDepartment(post("caviar-vs-lambskin-chanel-flap", "Caviar vs lambskin: which Flap holds value better"))).toBe("comparisons");
  });

  it("falls back to 'what it's worth' when nothing else matches", () => {
    expect(classifyDepartment(post("is-the-chanel-classic-flap-worth-it", "Is the Chanel Classic Flap worth it?"))).toBe("value");
    expect(classifyDepartment(post("are-designer-bags-an-investment", "Are designer bags an investment?"))).toBe("value");
  });

  it("authentication leads over comparisons for real-vs-fake framing", () => {
    expect(classifyDepartment(post("real-vs-fake-chanel", "Real vs fake Chanel: the markers to check"))).toBe("authentication");
  });
});

describe("getDepartment", () => {
  it("resolves known ids and rejects junk", () => {
    expect(getDepartment("market")?.label).toBe("Market report");
    expect(getDepartment("nonsense")).toBeNull();
    expect(getDepartment(null)).toBeNull();
  });

  it("every department carries a non-empty frame, and the judgment ones hedge", () => {
    for (const d of DEPARTMENTS) expect(d.frame.length).toBeGreaterThan(0);
    // value/authenticity/taste are uncertain, so they hedge "X, not Y"; market
    // data is measured, so it anchors on "dated and sourced" instead.
    for (const id of ["authentication", "value", "comparisons"] as const) {
      expect(getDepartment(id)!.frame).toMatch(/not/i);
    }
  });
});
