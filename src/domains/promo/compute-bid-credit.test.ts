import { describe, it, expect } from "vitest";
import { computeBidCreditCents } from "./compute-bid-credit";

describe("computeBidCreditCents", () => {
  it("doubles payment at 200 basis points", () => {
    expect(computeBidCreditCents(2500, 200)).toBe(5000);
  });

  it("returns same amount at 100 basis points", () => {
    expect(computeBidCreditCents(500, 100)).toBe(500);
  });

  it("rounds fractional cents", () => {
    expect(computeBidCreditCents(501, 150)).toBe(752);
  });
});
