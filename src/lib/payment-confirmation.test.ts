import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { confirmPaymentSession } from "./payment-confirmation";

describe("confirmPaymentSession", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          confirmed: true,
          slug: "acme",
          productName: "Acme",
          bidAmountCents: 2500,
          totalBidCents: 2500,
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns confirmation payload on success", async () => {
    const result = await confirmPaymentSession("cs_test_123");

    expect(result).toEqual({
      confirmed: true,
      slug: "acme",
      productName: "Acme",
      bidAmountCents: 2500,
      totalBidCents: 2500,
    });
    expect(fetch).toHaveBeenCalledWith("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_test_123" }),
    });
  });

  it("returns error when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ reason: "Payment not completed" }),
      })),
    );

    const result = await confirmPaymentSession("cs_test_123");
    expect(result).toEqual({ error: "Payment not completed" });
  });

  it("returns error when confirmed flag is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ slug: "acme" }),
      })),
    );

    const result = await confirmPaymentSession("cs_test_123");
    expect(result).toEqual({ error: "Confirmation failed" });
  });

  it("falls back when json parsing fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => {
          throw new Error("invalid json");
        },
      })),
    );

    const result = await confirmPaymentSession("cs_test_123");
    expect(result).toEqual({ error: "Confirmation failed" });
  });

  it("defaults missing product fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          confirmed: true,
          slug: "acme",
        }),
      })),
    );

    const result = await confirmPaymentSession("cs_test_123");
    expect(result).toEqual({
      confirmed: true,
      slug: "acme",
      productName: "acme",
      bidAmountCents: 0,
      totalBidCents: 0,
    });
  });
});
