import { describe, it, expect } from "vitest";
import { classifyChanelFlap, flapMislabel } from "@/lib/ingest/chanel-flap-classify";

describe("classifyChanelFlap", () => {
  it("classifies the Classic Flap 11.12 across reseller conventions", () => {
    expect(classifyChanelFlap("Caviar Classic Medium Double Flap Bag")).toBe("Classic Flap"); // TRR
    expect(classifyChanelFlap("Caviar Quilted Jumbo Classic Double Flap Black")).toBe("Classic Flap"); // FP
    expect(classifyChanelFlap("Classic Double Flap Bag Quilted Lambskin Small")).toBe("Classic Flap"); // Rebag
    expect(classifyChanelFlap("black leather timeless/classique chanel handbag")).toBe("Classic Flap"); // VC
    expect(classifyChanelFlap("Chanel Medium Patent Classic Double Flap Bag")).toBe("Classic Flap"); // TLC
  });

  it("classifies the 2.55 Reissue by word or numeric code, even when 'Classic' is present", () => {
    expect(classifyChanelFlap("225 Reissue Double Flap Bag")).toBe("2.55 Reissue"); // TRR numeric
    expect(classifyChanelFlap("Chanel Brown 2.55 Reissue 225 Flap Bag")).toBe("2.55 Reissue"); // Yoogi's
    expect(classifyChanelFlap("226 Classic Reissue 2.55 Flap Bag")).toBe("2.55 Reissue"); // TLC blended
    expect(classifyChanelFlap("black quilted 227 flap", "Mademoiselle turn-lock closure")).toBe("2.55 Reissue"); // lock in desc
  });

  it("classifies Coco Handle and Boy distinctly", () => {
    expect(classifyChanelFlap("Aged Calfskin Chevron Quilted Mini Coco Handle Flap Red")).toBe("Coco Handle");
    expect(classifyChanelFlap("Timeless/Classique Top Handle Flap Bag")).toBe("Coco Handle");
    expect(classifyChanelFlap("Medium Chevron Boy Bag")).toBe("Boy");
  });

  it("does not misread a size code out of a price or year", () => {
    // 224-228 must be a standalone token, not a fragment of 2240 or 2024.
    expect(classifyChanelFlap("Classic Medium Double Flap Bag $2,240")).toBe("Classic Flap");
    expect(classifyChanelFlap("Classic Jumbo Double Flap 2024 collection")).toBe("Classic Flap");
  });

  it("returns null / seasonal for non-flap or unresolved text", () => {
    expect(classifyChanelFlap("Chanel Deauville Tote")).toBeNull();
    expect(classifyChanelFlap("Chanel quilted seasonal flap crossbody")).toBe("seasonal flap");
    expect(classifyChanelFlap("")).toBeNull();
  });
});

describe("flapMislabel", () => {
  it("flags a Reissue/Coco Handle/Boy listing sitting on the Classic Flap style", () => {
    expect(flapMislabel("225 Reissue Double Flap Bag", null, "Classic Flap")).toBe("2.55 Reissue");
    expect(flapMislabel("Mini Coco Handle Flap Red", null, "Classic Flap")).toBe("Coco Handle");
    expect(flapMislabel("Medium Boy Bag", null, "Classic Flap")).toBe("Boy");
  });

  it("does not flag a correctly-placed listing", () => {
    expect(flapMislabel("Caviar Classic Medium Double Flap Bag", null, "Classic Flap")).toBeNull();
    expect(flapMislabel("225 Reissue Double Flap Bag", null, "2.55 Reissue")).toBeNull();
  });

  it("only audits flap-line styles, and only on a confident named model", () => {
    expect(flapMislabel("225 Reissue Flap", null, "Deauville")).toBeNull(); // not a flap-line style
    expect(flapMislabel("some seasonal flap", null, "Classic Flap")).toBeNull(); // not a named model
  });
});
