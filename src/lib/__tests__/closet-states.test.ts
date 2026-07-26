import { describe, it, expect } from "vitest";
import {
  CLOSET_STATUSES,
  HAD_REASONS,
  isClosetStatus,
  isHadReason,
  hasLivedWithIt,
  CLOSET_STATUS_META,
  HAD_REASON_META,
} from "../closet-states";

describe("closet vocabulary", () => {
  it("keeps tried between want and have, matching the buying journey", () => {
    expect([...CLOSET_STATUSES]).toEqual(["want", "tried", "have", "had"]);
  });

  it("rejects anything outside the closed set", () => {
    expect(isClosetStatus("have")).toBe(true);
    expect(isClosetStatus("tried")).toBe(true);
    expect(isClosetStatus("owned")).toBe(false); // the pre-0005 value
    expect(isClosetStatus(null)).toBe(false);
  });

  it("carries rented as a first-class reason, so renters are not counted as ex-owners", () => {
    expect([...HAD_REASONS]).toContain("rented");
    expect(isHadReason("rented")).toBe(true);
    expect(isHadReason("hated")).toBe(false); // sentiment does not belong here
  });

  it("treats only have and had as having lived with the bag", () => {
    // Someone who tried a bag in a boutique can speak to how it opens,
    // but not to how it looks after three years.
    expect(hasLivedWithIt("have")).toBe(true);
    expect(hasLivedWithIt("had")).toBe(true);
    expect(hasLivedWithIt("tried")).toBe(false);
    expect(hasLivedWithIt("want")).toBe(false);
    expect(hasLivedWithIt(null)).toBe(false);
  });

  it("has display copy for every state and reason", () => {
    for (const s of CLOSET_STATUSES) expect(CLOSET_STATUS_META[s].chip).toBeTruthy();
    for (const r of HAD_REASONS) expect(HAD_REASON_META[r].chip).toBeTruthy();
  });
});
