import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";
import {
  emailHasConfirmedPaidBid,
  emailHasRedeemedPromo,
  recordPromoRedemption,
  validateAndApplyPromo,
  resolveBidCreditOnConfirm,
} from "./validate-promo";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

const activePromo = {
  id: "promo-1",
  code: "PH2X",
  type: "bid_multiplier" as const,
  multiplier: 200,
  maxRedemptions: null,
  redeemedCount: 0,
  expiresAt: null,
  active: true,
};

describe("validateAndApplyPromo", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("rejects empty codes", async () => {
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "   ",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INVALID" });
  });

  it("rejects bid increases", async () => {
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "bid_increase",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INCREASE_NOT_ELIGIBLE" });
  });

  it("rejects payments below minimum", async () => {
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 400,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INVALID" });
  });

  it("rejects unknown codes", async () => {
    mock.enqueue([]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "NOPE",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INVALID" });
  });

  it("rejects inactive codes", async () => {
    mock.enqueue([{ ...activePromo, active: false }]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INVALID" });
  });

  it("rejects expired codes", async () => {
    mock.enqueue([{ ...activePromo, expiresAt: new Date("2020-01-01") }]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_EXPIRED" });
  });

  it("rejects when max redemptions reached", async () => {
    mock.enqueue([{ ...activePromo, maxRedemptions: 10, redeemedCount: 10 }]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_MAX_REDEMPTIONS" });
  });

  it("rejects when email already redeemed", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([{ id: "redemption-1" }]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_ALREADY_USED" });
  });

  it("rejects when email already has a confirmed paid bid", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1" }]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_NOT_FIRST_PAID" });
  });

  it("applies 2x bid credit for valid first-time users", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([]);
    mock.enqueue([]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "ph2x",
      email: " User@Example.com ",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({
      ok: true,
      promoCodeId: "promo-1",
      code: "PH2X",
      amountPaidCents: 2500,
      bidCreditCents: 5000,
      multiplier: 200,
    });
  });

  it("rejects unsupported promo types", async () => {
    mock.enqueue([{ ...activePromo, type: "flat_discount" as never }]);
    mock.enqueue([]);
    mock.enqueue([]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INVALID" });
  });

  it("rejects when multiplier does not increase bid credit", async () => {
    mock.enqueue([{ ...activePromo, multiplier: 50 }]);
    mock.enqueue([]);
    mock.enqueue([]);
    const result = await validateAndApplyPromo({
      db: mock.db as never,
      rawCode: "PH2X",
      email: "user@example.com",
      paymentCents: 2500,
      context: "new_listing",
    });
    expect(result).toEqual({ ok: false, error: "PROMO_INVALID" });
  });
});

describe("resolveBidCreditOnConfirm", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("returns metadata credit when no promo is attached", async () => {
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: null,
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 2500,
    });
    expect(credit).toBe(2500);
  });

  it("downgrades credit when promo is no longer eligible", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([{ id: "redemption-1" }]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(2500);
  });

  it("keeps doubled credit when promo is still eligible", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([]);
    mock.enqueue([]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(5000);
  });

  it("downgrades credit when promo is inactive", async () => {
    mock.enqueue([{ ...activePromo, active: false }]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(2500);
  });

  it("downgrades credit when promo is expired", async () => {
    mock.enqueue([{ ...activePromo, expiresAt: new Date("2020-01-01") }]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(2500);
  });

  it("downgrades credit when max redemptions are reached", async () => {
    mock.enqueue([{ ...activePromo, maxRedemptions: 1, redeemedCount: 1 }]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(2500);
  });

  it("downgrades credit when email already has a confirmed paid bid", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1" }]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(2500);
  });

  it("downgrades credit for unsupported promo types", async () => {
    mock.enqueue([{ ...activePromo, type: "flat_discount" as never }]);
    mock.enqueue([]);
    mock.enqueue([]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 5000,
    });
    expect(credit).toBe(2500);
  });

  it("downgrades credit when metadata credit does not match promo math", async () => {
    mock.enqueue([activePromo]);
    mock.enqueue([]);
    mock.enqueue([]);
    const credit = await resolveBidCreditOnConfirm({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      amountPaidCents: 2500,
      metadataBidCreditCents: 4000,
    });
    expect(credit).toBe(2500);
  });
});

describe("recordPromoRedemption", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("records redemption and increments counter", async () => {
    mock.enqueue([{ id: "redemption-new" }]);
    const ok = await recordPromoRedemption({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      productId: "prod-1",
      bidId: "bid-1",
      amountPaidCents: 2500,
      bidCreditCents: 5000,
    });
    expect(ok).toBe(true);
    expect(mock.db.update).toHaveBeenCalled();
  });

  it("returns false on duplicate redemption", async () => {
    mock.enqueue([]);
    const ok = await recordPromoRedemption({
      db: mock.db as never,
      promoCodeId: "promo-1",
      email: "user@example.com",
      productId: "prod-1",
      bidId: "bid-1",
      amountPaidCents: 2500,
      bidCreditCents: 5000,
    });
    expect(ok).toBe(false);
  });
});

describe("email helpers", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("detects confirmed paid bids by email", async () => {
    mock.enqueue([{ id: "bid-1" }]);
    await expect(emailHasConfirmedPaidBid(mock.db as never, "user@example.com")).resolves.toBe(
      true,
    );
  });

  it("detects prior promo redemption by email", async () => {
    mock.enqueue([{ id: "redemption-1" }]);
    await expect(
      emailHasRedeemedPromo(mock.db as never, "promo-1", "user@example.com"),
    ).resolves.toBe(true);
  });
});
