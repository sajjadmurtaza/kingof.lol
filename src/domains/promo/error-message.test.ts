import { describe, it, expect, vi } from "vitest";
import { promoErrorMessage } from "./error-message";

describe("promoErrorMessage", () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  it.each([
    ["PROMO_INVALID", "promoInvalid"],
    ["PROMO_EXPIRED", "promoExpired"],
    ["PROMO_MAX_REDEMPTIONS", "promoMaxRedemptions"],
    ["PROMO_ALREADY_USED", "promoAlreadyUsed"],
    ["PROMO_NOT_FIRST_PAID", "promoNotFirstPaid"],
    ["PROMO_INCREASE_NOT_ELIGIBLE", "promoIncreaseNotEligible"],
    ["PROMO_SETUP_REQUIRED", "promoSetupRequired"],
  ])("maps %s to %s", (code, key) => {
    expect(promoErrorMessage(code, t)).toBe(`translated:${key}`);
  });

  it("falls back to promoInvalid for unknown codes", () => {
    expect(promoErrorMessage("UNKNOWN", t)).toBe("translated:promoInvalid");
  });
});
