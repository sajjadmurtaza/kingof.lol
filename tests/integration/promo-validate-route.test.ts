import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../helpers/mock-db";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

vi.mock("@/domains/promo/validate-promo", () => ({
  validateAndApplyPromo: vi.fn(),
}));

vi.mock("@/domains/promo/seed-default", () => ({
  ensureDefaultLaunchPromo: vi.fn().mockResolvedValue(undefined),
}));

import { validateAndApplyPromo } from "@/domains/promo/validate-promo";
import { POST as promoValidatePost } from "@/app/api/promo/validate/route";

describe("POST /api/promo/validate", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
  });

  it("returns applied promo details for valid codes", async () => {
    vi.mocked(validateAndApplyPromo).mockResolvedValue({
      ok: true,
      promoCodeId: "promo-1",
      code: "PH2X",
      amountPaidCents: 2500,
      bidCreditCents: 5000,
      multiplier: 200,
    });

    const res = await promoValidatePost(
      new Request("https://kingof.lol/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "PH2X",
          email: "user@example.com",
          paymentCents: 2500,
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      valid: true,
      bidCreditCents: 5000,
      multiplier: 200,
    });
  });

  it("returns 400 for invalid promo codes", async () => {
    vi.mocked(validateAndApplyPromo).mockResolvedValue({
      ok: false,
      error: "PROMO_INVALID",
    });

    const res = await promoValidatePost(
      new Request("https://kingof.lol/api/promo/validate", {
        method: "POST",
        body: JSON.stringify({
          code: "BAD",
          email: "user@example.com",
          paymentCents: 2500,
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "PROMO_INVALID" });
  });

  it("validates request fields", async () => {
    const res = await promoValidatePost(
      new Request("https://kingof.lol/api/promo/validate", {
        method: "POST",
        body: JSON.stringify({ code: "", email: "user@example.com", paymentCents: 2500 }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
