import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();

vi.mock("@/domains/promo/validate-promo", () => ({
  validateAndApplyPromo: vi.fn(),
}));

import { validateAndApplyPromo } from "@/domains/promo/validate-promo";
import { resolveBidPayment } from "./resolve-bid-payment";

describe("resolveBidPayment", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
  });

  it("returns 1:1 payment when no promo code is provided", async () => {
    const result = await resolveBidPayment({
      db: mock.db as never,
      paymentCents: 2500,
      email: "user@example.com",
      promoCode: null,
      context: "new_listing",
    });
    expect(result).toEqual({
      ok: true,
      paymentCents: 2500,
      bidCreditCents: 2500,
    });
    expect(validateAndApplyPromo).not.toHaveBeenCalled();
  });

  it("delegates to validateAndApplyPromo when a code is provided", async () => {
    vi.mocked(validateAndApplyPromo).mockResolvedValue({
      ok: true,
      promoCodeId: "promo-1",
      code: "PH2X",
      amountPaidCents: 2500,
      bidCreditCents: 5000,
      multiplier: 200,
    });

    const result = await resolveBidPayment({
      db: mock.db as never,
      paymentCents: 2500,
      email: "user@example.com",
      promoCode: "ph2x",
      context: "new_listing",
    });

    expect(validateAndApplyPromo).toHaveBeenCalledWith({
      db: mock.db,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({
      ok: true,
      paymentCents: 2500,
      bidCreditCents: 5000,
      promoCodeId: "promo-1",
    });
  });

  it("surfaces promo validation errors", async () => {
    vi.mocked(validateAndApplyPromo).mockResolvedValue({
      ok: false,
      error: "PROMO_ALREADY_USED",
    });

    const result = await resolveBidPayment({
      db: mock.db as never,
      paymentCents: 2500,
      email: "user@example.com",
      promoCode: "PH2X",
      context: "new_listing",
    });

    expect(result).toEqual({ ok: false, error: "PROMO_ALREADY_USED" });
  });
});
