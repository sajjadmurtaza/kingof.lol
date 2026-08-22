import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();
const checkoutCreate = vi.fn();

vi.mock("@/domains/payments/stripe", () => ({
  createBidCheckoutSession: (...args: unknown[]) => checkoutCreate(...args),
  formatStripeError: (err: unknown) =>
    err instanceof Error ? err.message : "Unknown Stripe error",
}));

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { createPaidBidCheckout } from "./create-paid-bid-checkout";
import * as Sentry from "@sentry/nextjs";

describe("createPaidBidCheckout", () => {
  beforeEach(() => {
    mock.reset();
    checkoutCreate.mockReset();
    vi.mocked(Sentry.captureException).mockReset();
  });

  it("creates a pending bid and returns checkout url", async () => {
    mock.enqueue([{ id: "bid-1" }]);
    checkoutCreate.mockResolvedValue("https://checkout.stripe.com/pay/cs_test");

    const result = await createPaidBidCheckout({
      db: mock.db as never,
      product: { id: "prod-1", slug: "acme", name: "Acme" },
      paymentCents: 2500,
      email: "owner@example.com",
      locale: "en",
      manageToken: "token-1",
    });

    expect(result).toEqual({ checkoutUrl: "https://checkout.stripe.com/pay/cs_test" });
  });

  it("cleans up bid and returns error when checkout fails", async () => {
    mock.enqueue([{ id: "bid-1" }]);
    checkoutCreate.mockRejectedValue(new Error("stripe down"));

    const result = await createPaidBidCheckout({
      db: mock.db as never,
      product: { id: "prod-1", slug: "acme", name: "Acme" },
      paymentCents: 2500,
      email: "owner@example.com",
      locale: "en",
    });

    expect(result).toEqual({
      error: "Payment setup failed",
      reason: "stripe down",
    });
  });

  it("reports cleanup failures to sentry", async () => {
    mock.enqueue([{ id: "bid-1" }]);
    checkoutCreate.mockRejectedValue(new Error("stripe down"));
    mock.db.delete.mockImplementationOnce(() => ({
      where: () => Promise.reject(new Error("cleanup failed")),
    }));

    const result = await createPaidBidCheckout({
      db: mock.db as never,
      product: { id: "prod-1", slug: "acme", name: "Acme" },
      paymentCents: 2500,
      email: "owner@example.com",
      locale: "en",
    });

    expect(result).toEqual({
      error: "Payment setup failed",
      reason: "stripe down",
    });
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
