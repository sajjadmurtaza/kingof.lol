import { describe, it, expect } from "vitest";
import { normalizePromoCode } from "./normalize-code";

describe("normalizePromoCode", () => {
  it("uppercases and trims", () => {
    expect(normalizePromoCode(" ph2x ")).toBe("PH2X");
  });

  it("removes internal whitespace", () => {
    expect(normalizePromoCode("ph 2 x")).toBe("PH2X");
  });

  it("returns empty for blank input", () => {
    expect(normalizePromoCode("   ")).toBe("");
  });
});
