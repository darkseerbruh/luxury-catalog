import { describe, it, expect } from "vitest";
import {
  listingRefFromUrl,
  normalizeDesc,
  recordToObservation,
  detectSizeLabel,
  catchAllStyle,
  recordToCatchAllObservation,
  dionysusSize,
  horsebitSize,
  coachModelSize,
  coachPillowTabby,
  ophidiaSize,
  evelyneSize,
  keepallSize,
  picotinSize,
  pochetteMetisSize,
  onTheGoSize,
  bumbagSize,
  capucinesSize,
  neoNoeSize,
  lindySize,
  herbagSize,
  dianaSize,
  coussinSize,
  twistSize,
  bolideSize,
  sohoDiscoSize,
  bamboo1947Size,
  jypsiereSize,
  dauphineSize,
  petiteMalleStandard,
  roulisSize,
  attacheSize,
  type TrrRecord,
  type TrrJsonLdTarget,
} from "../../../supabase/ingest/sources/trr-jsonld";

// Mirror of the proven chanel-classic-flap-medium target (kept inline so the test
// doesn't depend on the private TARGETS map).
const CHANEL_FLAP_MEDIUM: TrrJsonLdTarget = {
  brand: "Chanel",
  style: "Classic Flap",
  size_label: "Medium",
  namePredicate: (name: string) => {
    const n = name.toLowerCase();
    return (
      n.includes("flap") &&
      n.includes("medium") &&
      !["jumbo", "maxi", "mini", "small"].some((t) => n.includes(t))
    );
  },
  minPrice: 1500,
  maxPrice: 20000,
};

describe("trr-jsonld name predicate", () => {
  const p = CHANEL_FLAP_MEDIUM.namePredicate;
  it("accepts a Classic Medium Double Flap", () => {
    expect(p("Classic Medium Double Flap Bag")).toBe(true);
    expect(p("Lambskin Classic Double Flap Bag Medium")).toBe(true);
  });
  it("rejects a Jumbo flap", () => {
    expect(p("Jumbo Classic Double Flap Bag")).toBe(false);
  });
  it("rejects a Mini flap (even if it also says medium-ish)", () => {
    expect(p("Mini Square Flap Bag")).toBe(false);
  });
});

describe("normalizeDesc", () => {
  it("recovers colour/material/hardware from a collapsed '. '-separated desc", () => {
    const collapsed =
      "Chanel Shoulder Bag. From the 2011-2012 Collection. Black Caviar Leather. Gold-Tone Hardware. Includes Dust Bag.";
    // Without normalization the facts run together; with it they split into segments.
    expect(normalizeDesc(collapsed)).toContain("Black Caviar Leather.\n");
  });
});

describe("listingRefFromUrl", () => {
  it("extracts the last path segment as the slug", () => {
    expect(
      listingRefFromUrl(
        "https://www.therealreal.com/products/women/handbags/shoulder-bags/chanel-medium-classic-double-flap-bag-teci7"
      )
    ).toBe("chanel-medium-classic-double-flap-bag-teci7");
  });
  it("strips query/hash before taking the slug", () => {
    expect(listingRefFromUrl("https://www.therealreal.com/products/x-abc123?ref=foo#a")).toBe("x-abc123");
  });
});

describe("recordToObservation", () => {
  const rec: TrrRecord = {
    url: "https://www.therealreal.com/products/women/handbags/shoulder-bags/chanel-medium-classic-double-flap-bag-teci7",
    name: "Medium Classic Double Flap Bag",
    sku: null,
    price: 3040,
    currency: "USD",
    condition: "UsedCondition",
    desc: "Chanel Shoulder Bag. From the 2011-2012 Collection by Karl Lagerfeld. Black Caviar Leather. Gold-Tone Hardware. Includes Dust Bag.",
  };

  it("maps a kept record to a full PriceObservation (spec + listing_ref + null condition)", () => {
    const o = recordToObservation(rec, CHANEL_FLAP_MEDIUM, "2026-06-22");
    expect(o).not.toBeNull();
    expect(o!.brand).toBe("Chanel");
    expect(o!.style).toBe("Classic Flap");
    expect(o!.platform).toBe("The RealReal");
    expect(o!.price_type).toBe("listed");
    expect(o!.sale_price).toBe(3040);
    expect(o!.currency).toBe("USD");
    expect(o!.observed_on).toBe("2026-06-22");
    expect(o!.source_url).toBe(rec.url);
    expect(o!.confidence).toBe("high");
    expect(o!.notes).toBe("Medium Classic Double Flap Bag");
    // Never fake a graded condition from generic "UsedCondition".
    expect(o!.condition).toBeNull();
    // Spec recovered from the collapsed desc.
    expect(o!.attrs.size_label).toBe("Medium");
    expect(o!.attrs.exterior_colorway).toBe("Black");
    expect(o!.attrs.exterior_material).toBe("Caviar Leather");
    expect(o!.attrs.hardware_color).toBe("gold");
    expect(o!.attrs.production_year).toBe(2011);
    expect(o!.attrs.season).toBe("2011-2012");
    expect(o!.attrs.inclusions).toBe("Dust Bag");
    // listing_ref = URL slug.
    expect(o!.attrs.listing_ref).toBe("chanel-medium-classic-double-flap-bag-teci7");
  });

  it("returns null when the name fails the predicate", () => {
    expect(recordToObservation({ ...rec, name: "Jumbo Classic Double Flap Bag" }, CHANEL_FLAP_MEDIUM, "2026-06-22")).toBeNull();
  });

  it("returns null when the price is out of bounds", () => {
    expect(recordToObservation({ ...rec, price: 500 }, CHANEL_FLAP_MEDIUM, "2026-06-22")).toBeNull();
  });
});

// ── Catch-all mode (Feature 1) ───────────────────────────────────────────────

describe("detectSizeLabel", () => {
  it("prefers word sizes and returns canonical casing", () => {
    expect(detectSizeLabel("Louis Vuitton Speedy Nano Monogram")).toBe("Nano");
    expect(detectSizeLabel("Dior Mini Book Tote")).toBe("Mini");
    expect(detectSizeLabel("Chanel Jumbo Classic Flap")).toBe("Jumbo");
  });
  it("detects letter-code sizes as whole words (not inside other words)", () => {
    expect(detectSizeLabel("Louis Vuitton Alma BB")).toBe("BB");
    expect(detectSizeLabel("Neverfull MM Tote")).toBe("MM");
    // "mm"/"pm" must NOT match inside monogram/etc.
    expect(detectSizeLabel("Monogram Canvas Pochette")).toBeNull();
  });
  it("detects numeric sizes by whole word and ignores years", () => {
    expect(detectSizeLabel("Birkin 30 Togo")).toBe("30");
    // A standalone year is not a size (no bare 20/25 inside 2025).
    expect(detectSizeLabel("Speedy Bandoulière 2025 release")).toBeNull();
  });
  it("prefers a letter/word size over a bare numeric in the same name", () => {
    expect(detectSizeLabel("Alma BB 25cm strap")).toBe("BB");
  });
  it("returns null when no size token is present", () => {
    expect(detectSizeLabel("Louis Vuitton Monogram Shoulder Bag")).toBeNull();
  });
});

describe("catchAllStyle", () => {
  it("prefers the operator-supplied guess", () => {
    expect(catchAllStyle("Some Verbose Bag Title", "Speedy")).toBe("Speedy");
    expect(catchAllStyle("Some Verbose Bag Title", "  Alma  ")).toBe("Alma");
  });
  it("falls back to the name (minus a trailing 'Bag') when no guess", () => {
    expect(catchAllStyle("Monogram Speedy Bag", null)).toBe("Monogram Speedy");
    expect(catchAllStyle("Monogram Speedy Bag", "")).toBe("Monogram Speedy");
  });
  it("never returns empty", () => {
    expect(catchAllStyle("Bag", null)).toBe("Bag");
  });
});

describe("recordToCatchAllObservation", () => {
  const rec: TrrRecord = {
    url: "https://www.therealreal.com/products/women/handbags/totes/louis-vuitton-monogram-speedy-30-abc12",
    name: "Louis Vuitton Monogram Speedy 30",
    sku: null,
    price: 1295,
    currency: "USD",
    condition: "UsedCondition",
    desc: "Louis Vuitton Speedy. From the 2018 Collection. Brown Monogram Canvas. Gold-Tone Hardware. Includes Dust Bag.",
  };

  it("emits a low-confidence observation with parsed size + spec + listing_ref", () => {
    const o = recordToCatchAllObservation(rec, "Louis Vuitton", "Speedy", "2026-06-23");
    expect(o).not.toBeNull();
    expect(o!.brand).toBe("Louis Vuitton");
    expect(o!.style).toBe("Speedy");
    expect(o!.attrs.size_label).toBe("30");
    expect(o!.attrs.exterior_material).toBe("Monogram Canvas");
    expect(o!.attrs.exterior_colorway).toBe("Brown");
    expect(o!.attrs.hardware_color).toBe("gold");
    expect(o!.attrs.production_year).toBe(2018);
    expect(o!.attrs.listing_ref).toBe("louis-vuitton-monogram-speedy-30-abc12");
    expect(o!.price_type).toBe("listed");
    expect(o!.platform).toBe("The RealReal");
    expect(o!.confidence).toBe("low");
    expect(o!.condition).toBeNull();
    expect(o!.notes).toBe(rec.name);
    expect(o!.observed_on).toBe("2026-06-23");
  });

  it("never applies a price band — keeps a cheap vintage outlier the curated target would drop", () => {
    const cheap = { ...rec, name: "Louis Vuitton Vintage Speedy", price: 220, desc: "Vintage." };
    const o = recordToCatchAllObservation(cheap, "Louis Vuitton", "Speedy", "2026-06-23");
    expect(o).not.toBeNull();
    expect(o!.sale_price).toBe(220);
    // No size in the title -> null (loader routes it to discovered_listing).
    expect(o!.attrs.size_label).toBeNull();
  });

  it("emits a null size (not a drop) when the name has no size token", () => {
    const o = recordToCatchAllObservation({ ...rec, name: "Louis Vuitton Speedy" }, "Louis Vuitton", "Speedy", "2026-06-23");
    expect(o).not.toBeNull();
    expect(o!.attrs.size_label).toBeNull();
  });

  it("derives the style from the name when no style guess is given", () => {
    const o = recordToCatchAllObservation({ ...rec, name: "Monogram Speedy Bag" }, "Louis Vuitton", null, "2026-06-23");
    expect(o!.style).toBe("Monogram Speedy");
  });

  it("returns null ONLY for a non-positive / invalid price", () => {
    expect(recordToCatchAllObservation({ ...rec, price: 0 }, "Louis Vuitton", "Speedy", "2026-06-23")).toBeNull();
    expect(recordToCatchAllObservation({ ...rec, price: -5 }, "Louis Vuitton", "Speedy", "2026-06-23")).toBeNull();
    expect(recordToCatchAllObservation({ ...rec, price: NaN }, "Louis Vuitton", "Speedy", "2026-06-23")).toBeNull();
  });
});

// ── Gucci curated Super-Mini-aware predicates ────────────────────────────────

describe("dionysusSize (Super-Mini-aware)", () => {
  const superMini = dionysusSize("super mini");
  const mini = dionysusSize("mini");
  const small = dionysusSize("small");
  const medium = dionysusSize("medium");

  it("routes 'Super Mini' to the Super Mini bucket, never to Mini", () => {
    expect(superMini("Gucci Super Mini Dionysus Bag")).toBe(true);
    expect(superMini("Gucci GG Supreme Super-Mini Dionysus")).toBe(true); // hyphenated
    // The whole point of the fix: a Super Mini must NOT also land in the plain Mini bucket.
    expect(mini("Gucci Super Mini Dionysus Bag")).toBe(false);
    expect(mini("Gucci GG Supreme Super-Mini Dionysus")).toBe(false);
  });

  it("routes a plain Mini to Mini only", () => {
    expect(mini("Gucci Mini Dionysus Shoulder Bag")).toBe(true);
    expect(superMini("Gucci Mini Dionysus Shoulder Bag")).toBe(false);
    expect(small("Gucci Mini Dionysus Shoulder Bag")).toBe(false);
  });

  it("separates Small and Medium by whole word", () => {
    expect(small("Gucci Small Dionysus Bag")).toBe(true);
    expect(medium("Gucci Small Dionysus Bag")).toBe(false);
    expect(medium("Gucci Medium Dionysus Shoulder Bag")).toBe(true);
    expect(small("Gucci Medium Dionysus Shoulder Bag")).toBe(false);
  });

  it("drops Dionysus footwear / SLGs from every bucket", () => {
    expect(mini("Gucci Mini Dionysus Loafer")).toBe(false);
    expect(superMini("Gucci Super Mini Dionysus Wallet")).toBe(false);
    expect(small("Gucci Dionysus Card Holder Small")).toBe(false);
  });

  it("rejects non-Dionysus names", () => {
    expect(mini("Gucci Mini GG Marmont Bag")).toBe(false);
  });
});

describe("horsebitSize (Mini / Small / Shoulder)", () => {
  const mini = horsebitSize("mini");
  const small = horsebitSize("small");
  const shoulder = horsebitSize(null);

  it("requires both 'horsebit' and '1955' (drops Horsebit Chain + loafers)", () => {
    expect(shoulder("Gucci Horsebit 1955 Shoulder Bag")).toBe(true);
    expect(shoulder("Gucci Horsebit Chain Shoulder Bag")).toBe(false); // no 1955
    expect(shoulder("Gucci Horsebit 1955 Loafer")).toBe(false); // footwear
  });

  it("buckets Mini and Small by whole word", () => {
    expect(mini("Gucci Mini Horsebit 1955 Bag")).toBe(true);
    expect(small("Gucci Mini Horsebit 1955 Bag")).toBe(false);
    expect(small("Gucci Small Horsebit 1955 Shoulder Bag")).toBe(true);
    expect(mini("Gucci Small Horsebit 1955 Shoulder Bag")).toBe(false);
  });

  it("Shoulder = horsebit-1955 with no size token (even though the name says 'shoulder')", () => {
    expect(shoulder("Gucci Horsebit 1955 Shoulder Bag")).toBe(true);
    // A sized listing must NOT fall into the unsized Shoulder bucket.
    expect(shoulder("Gucci Mini Horsebit 1955 Bag")).toBe(false);
    expect(shoulder("Gucci Small Horsebit 1955 Shoulder Bag")).toBe(false);
  });
});

// ── Coach curated predicates (numeric sizes + Standard bucket; Pillow split) ──

describe("coachModelSize", () => {
  const TABBY = ["12", "20", "26"];
  const tabby26 = coachModelSize("tabby", "26", TABBY, ["pillow"]);
  const tabby20 = coachModelSize("tabby", "20", TABBY, ["pillow"]);
  const tabbyStd = coachModelSize("tabby", null, TABBY, ["pillow"]);

  it("buckets numeric Coach sizes by whole word", () => {
    expect(tabby26("Coach Leather Tabby 26")).toBe(true);
    expect(tabby20("Coach Leather Tabby 26")).toBe(false);
    expect(tabby20("Coach Signature Tabby 20")).toBe(true);
  });

  it("routes a model named with NO numeric size to the Standard bucket", () => {
    expect(tabbyStd("Coach Leather Tabby")).toBe(true);
    expect(tabbyStd("Coach Leather Tabby 26")).toBe(false); // sized → not Standard
    expect(tabby26("Coach Leather Tabby")).toBe(false); // unsized → not the 26 bucket
  });

  it("excludes Pillow Tabby from the plain Tabby buckets (distinct backbone style)", () => {
    expect(tabby26("Coach Signature Pillow Tabby 26")).toBe(false);
    expect(tabbyStd("Coach Pillow Tabby")).toBe(false);
  });

  it("drops Coach SLGs (wallets, card cases, wristlets)", () => {
    expect(tabby26("Coach Tabby 26 Wristlet")).toBe(false);
    expect(coachModelSize("rogue", null, ["17", "25", "30", "39"])("Coach Rogue Card Case")).toBe(false);
  });

  it("does not cross-match a different model", () => {
    expect(tabby26("Coach Leather Brooklyn 28")).toBe(false);
  });
});

describe("coachPillowTabby", () => {
  const p18 = coachPillowTabby("18");
  const pStd = coachPillowTabby(null);
  it("requires BOTH 'pillow' and 'tabby'", () => {
    expect(p18("Coach Signature Pillow Tabby 18")).toBe(true);
    expect(p18("Coach Leather Tabby 18")).toBe(false); // not pillow
    expect(pStd("Coach Pillow Tabby")).toBe(true);
  });
});

describe("ophidiaSize (Super-Mini-aware, like Dionysus)", () => {
  it("routes 'Super Mini' away from the plain Mini bucket", () => {
    expect(ophidiaSize("super mini")("Gucci GG Supreme Super Mini Ophidia")).toBe(true);
    expect(ophidiaSize("mini")("Gucci GG Supreme Super Mini Ophidia")).toBe(false);
    expect(ophidiaSize("mini")("Gucci GG Canvas Mini Ophidia")).toBe(true);
  });
  it("buckets the real TRR size names by whole word", () => {
    expect(ophidiaSize("small")("Gucci GG Supreme Ophidia Small")).toBe(true);
    expect(ophidiaSize("medium")("Gucci GG Canvas Ophidia Medium")).toBe(true);
    expect(ophidiaSize("large")("Web Ophidia Large")).toBe(true);
    expect(ophidiaSize("small")("Web Ophidia Large")).toBe(false);
  });
  it("drops Ophidia SLGs / backpack / belt bag", () => {
    expect(ophidiaSize("small")("Gucci Small Ophidia Wallet")).toBe(false);
    expect(ophidiaSize("medium")("Gucci Ophidia Backpack")).toBe(false);
    expect(ophidiaSize("mini")("Gucci Ophidia Belt Bag")).toBe(false);
  });
});

describe("evelyneSize (numeric TRR cm → TPM/PM/GM)", () => {
  it("maps numeric cm to the backbone letter size", () => {
    expect(evelyneSize("PM")("Clemence Evelyne III 29")).toBe(true);
    expect(evelyneSize("GM")("Clemence Evelyne III 33")).toBe(true);
    expect(evelyneSize("TPM")("Clemence Amazone Evelyne TPM 16")).toBe(true);
  });
  it("keeps 'TPM 16' out of the PM bucket and vice versa", () => {
    expect(evelyneSize("PM")("Clemence Amazone Evelyne TPM 16")).toBe(false);
    expect(evelyneSize("TPM")("Clemence Evelyne III 29")).toBe(false);
  });
  it("drops the non-backbone TGM 40", () => {
    expect(evelyneSize("GM")("Clemence Evelyne III TGM 40")).toBe(false);
    expect(evelyneSize("PM")("Clemence Evelyne III TGM 40")).toBe(false);
  });
});

describe("keepallSize (whole-word numeric)", () => {
  it("buckets each size and folds Bandoulière in", () => {
    expect(keepallSize("50")("Monogram Keepall Bandoulière 50")).toBe(true);
    expect(keepallSize("55")("Monogram Keepall 55")).toBe(true);
    expect(keepallSize("50")("Monogram Keepall 55")).toBe(false);
  });
  it("a year cannot false-match a size token", () => {
    expect(keepallSize("50")("2019 Monogram Keepall 45")).toBe(false);
  });
});

describe("picotinSize (numeric + rare Micro)", () => {
  it("buckets 18/22/26 by whole word", () => {
    expect(picotinSize("18")("Clemence Picotin Lock 18")).toBe(true);
    expect(picotinSize("22")("Clemence Picotin Lock 22")).toBe(true);
    expect(picotinSize("18")("Clemence Picotin Lock 22")).toBe(false);
  });
  it("drops the seller typo and the larger 31", () => {
    expect(picotinSize("18")("Clemence Pictoin Lock 18")).toBe(false);
    expect(picotinSize("26")("Clemence Picotin Lock 31")).toBe(false);
  });
});

describe("pochetteMetisSize (Standard / East-West)", () => {
  it("is accent-insensitive and splits East-West out", () => {
    expect(pochetteMetisSize("Standard")("Monogram Pochette Metis")).toBe(true);
    expect(pochetteMetisSize("East-West")("Monogram Pochette Metis East West")).toBe(true);
    expect(pochetteMetisSize("Standard")("Monogram Pochette Metis East West")).toBe(false);
  });
  it("excludes other LV Pochettes", () => {
    expect(pochetteMetisSize("Standard")("LV Monogram Pochette Félicie")).toBe(false);
  });
});

describe("onTheGoSize (PM/MM/GM/East-West)", () => {
  it("matches both OnTheGo and On The Go spellings, whole-word size", () => {
    expect(onTheGoSize("MM")("Louis Vuitton OnTheGo MM")).toBe(true);
    expect(onTheGoSize("GM")("Louis Vuitton On The Go GM")).toBe(true);
    expect(onTheGoSize("MM")("Louis Vuitton On The Go GM")).toBe(false);
  });
  it("checks East-West before the letter buckets", () => {
    expect(onTheGoSize("East-West")("OnTheGo East West")).toBe(true);
  });
});

describe("bumbagSize (Mini / Standard)", () => {
  it("matches Bumbag and Bum Bag, splits Mini out", () => {
    expect(bumbagSize("Standard")("Monogram Bumbag")).toBe(true);
    expect(bumbagSize("Mini")("Monogram Mini Bum Bag")).toBe(true);
    expect(bumbagSize("Standard")("Monogram Mini Bum Bag")).toBe(false);
  });
  it("excludes other LV belt bags", () => {
    expect(bumbagSize("Standard")("Monogram Belt Bag")).toBe(false);
  });
});

describe("capucinesSize (Mini/BB/MM/GM/East-West)", () => {
  it("checks East-West before letter buckets", () => {
    expect(capucinesSize("East-West")("Taurillon Capucines East West")).toBe(true);
    expect(capucinesSize("BB")("Taurillon Capucines East West")).toBe(false);
  });
  it("separates Mini from BB/MM/GM", () => {
    expect(capucinesSize("Mini")("Taurillon Mini Capucines")).toBe(true);
    expect(capucinesSize("BB")("Taurillon Mini Capucines")).toBe(false);
    expect(capucinesSize("MM")("Taurillon Capucines MM")).toBe(true);
    expect(capucinesSize("BB")("Taurillon Capucines MM")).toBe(false);
  });
});

describe("neoNoeSize (BB / MM)", () => {
  it("requires the neonoe token, not bare Noé", () => {
    expect(neoNoeSize("MM")("Monogram NeoNoe MM")).toBe(true);
    expect(neoNoeSize("BB")("Monogram NéoNoé BB")).toBe(true);
    expect(neoNoeSize("MM")("Monogram Noé GM")).toBe(false);
    expect(neoNoeSize("MM")("Monogram Neverfull MM")).toBe(false);
  });
});

describe("lindySize (Mini / 26 / 30 / 34)", () => {
  it("Mini wins over a numeric in the same name", () => {
    expect(lindySize("Mini")("Swift Mini Lindy 26")).toBe(true);
    expect(lindySize("26")("Swift Mini Lindy 26")).toBe(false);
  });
  it("buckets numerics whole-word", () => {
    expect(lindySize("30")("Clemence Lindy 30")).toBe(true);
    expect(lindySize("26")("Clemence Lindy 30")).toBe(false);
  });
  it("drops non-Lindy Hermès models", () => {
    expect(lindySize("26")("Swift Mini Halzan 22")).toBe(false);
  });
});

describe("herbagSize (PM / MM, numeric 31/39)", () => {
  it("maps numeric cm to PM/MM", () => {
    expect(herbagSize("PM")("Toile Herbag Zip 31")).toBe(true);
    expect(herbagSize("MM")("Toile Herbag Zip 39")).toBe(true);
    expect(herbagSize("PM")("Toile Herbag Zip 39")).toBe(false);
  });
  it("also accepts the literal letter size", () => {
    expect(herbagSize("MM")("Toile Herbag MM")).toBe(true);
    expect(herbagSize("PM")("Toile Herbag MM")).toBe(false);
  });
});

describe("dianaSize (Maxi = TRR 'Large')", () => {
  it("maps TRR Large to the Maxi bucket", () => {
    expect(dianaSize("Maxi")("Gucci Bamboo Diana Large")).toBe(true);
    expect(dianaSize("Medium")("Gucci Bamboo Diana Large")).toBe(false);
  });
  it("buckets Mini/Small/Medium whole-word", () => {
    expect(dianaSize("Mini")("Gucci Diana Mini")).toBe(true);
    expect(dianaSize("Small")("Gucci Diana Small")).toBe(true);
    expect(dianaSize("Medium")("Gucci Diana Small")).toBe(false);
  });
  it("drops Diana footwear", () => {
    expect(dianaSize("Mini")("Gucci Diana Mini Loafer")).toBe(false);
  });
});

describe("coussinSize (BB / MM / PM)", () => {
  it("buckets letters whole-word, requires coussin", () => {
    expect(coussinSize("PM")("Monogram Coussin PM")).toBe(true);
    expect(coussinSize("BB")("Monogram Coussin PM")).toBe(false);
    expect(coussinSize("PM")("Monogram Bella")).toBe(false);
  });
});

describe("twistSize (PM / MM, jewelry-guarded)", () => {
  it("buckets PM/MM but drops Twist jewelry", () => {
    expect(twistSize("MM")("Epi Leather Twist MM")).toBe(true);
    expect(twistSize("MM")("18K Diamond Idylle Blossom Twist Bracelet")).toBe(false);
  });
});

describe("bolideSize (Mini / 25 / 27 / 31 / 35)", () => {
  it("Mini-first, numerics whole-word", () => {
    expect(bolideSize("Mini")("Clemence Mini Bolide")).toBe(true);
    expect(bolideSize("31")("Clemence Bolide 31")).toBe(true);
    expect(bolideSize("25")("Clemence Bolide 31")).toBe(false);
  });
});

describe("sohoDiscoSize (requires 'disco')", () => {
  it("treats unsized Disco as Small, requires disco", () => {
    expect(sohoDiscoSize("Small")("Interlocking G Soho Disco")).toBe(true);
    expect(sohoDiscoSize("Mini")("Soho Disco Mini")).toBe(true);
    expect(sohoDiscoSize("Small")("Soho Disco Mini")).toBe(false);
    expect(sohoDiscoSize("Small")("Soho Chain Tote Medium")).toBe(false);
  });
});

describe("bamboo1947Size (requires bamboo + 1947)", () => {
  it("excludes vintage Bamboo Top Handle", () => {
    expect(bamboo1947Size("Small")("Gucci Bamboo 1947 Small")).toBe(true);
    expect(bamboo1947Size("Medium")("Leather Medium Bamboo Top Handle Flap")).toBe(false);
  });
});

describe("jypsiereSize (Mini / 28 / 31 / 34)", () => {
  it("Mini-first, drops non-backbone 37", () => {
    expect(jypsiereSize("Mini")("Evercolor Mini Jypsiere")).toBe(true);
    expect(jypsiereSize("31")("Clemence Jypsiere 31")).toBe(true);
    expect(jypsiereSize("34")("Clemence Jypsiere 37")).toBe(false);
  });
});

describe("dauphineSize (Micro/Mini/MM/GM)", () => {
  it("separates Micro from Mini whole-word", () => {
    expect(dauphineSize("Mini")("Monogram Dauphine Mini")).toBe(true);
    expect(dauphineSize("Micro")("Monogram Dauphine Mini")).toBe(false);
    expect(dauphineSize("MM")("Monogram Dauphine MM")).toBe(true);
  });
});

describe("petiteMalleStandard", () => {
  it("requires the full phrase", () => {
    expect(petiteMalleStandard("Monogram Petite Malle")).toBe(true);
    expect(petiteMalleStandard("LV Monogram Petit Malle")).toBe(false); // typo, no 'e'
    expect(petiteMalleStandard("LV Monogram Montaigne MM")).toBe(false);
  });
});

describe("roulisSize (Mini / 23, SLG-guarded)", () => {
  it("guards out wallet/bracelet, unsized = 23", () => {
    expect(roulisSize("23")("Clemence Roulis 23")).toBe(true);
    expect(roulisSize("23")("Evercolor Roulis")).toBe(true); // unsized standard
    expect(roulisSize("Mini")("Evercolor Mini Roulis")).toBe(true);
    expect(roulisSize("23")("Roulis Slim Wallet")).toBe(false);
    expect(roulisSize("23")("Roulis Double Tour Bracelet")).toBe(false);
  });
});

describe("attacheSize (Small / Large)", () => {
  it("Large=large, Small=non-large, Mini drops", () => {
    expect(attacheSize("Large")("GG Supreme Attache Large")).toBe(true);
    expect(attacheSize("Small")("GG Supreme Attache")).toBe(true);
    expect(attacheSize("Small")("Web Attache Mini")).toBe(false);
  });
});
