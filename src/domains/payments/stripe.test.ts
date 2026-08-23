import { describe, it, expect, vi, beforeEach } from "vitest";

const checkoutCreate = vi.fn();
const { MockStripeError } = vi.hoisted(() => {
  class StripeError extends Error {}
  return { MockStripeError: StripeError };
});

vi.mock("stripe", () => ({
  default: class StripeMock {
    static errors = { StripeError: MockStripeError };
    checkout = { sessions: { create: checkoutCreate } };
  },
}));

describe("stripe payments", () => {
  beforeEach(() => {
    vi.resetModules();
    checkoutCreate.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://kingof.lol";
  });

  it("throws when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY not set");
  });

  it("throws when STRIPE_SECRET_KEY is invalid", async () => {
    process.env.STRIPE_SECRET_KEY = "not-a-stripe-key";
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY must start with sk_");
  });

  it("reuses stripe client singleton", async () => {
    const { getStripe } = await import("./stripe");
    expect(getStripe()).toBe(getStripe());
  });

  it("creates checkout session with metadata", async () => {
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test" });
    const { createBidCheckoutSession } = await import("./stripe");

    const url = await createBidCheckoutSession({
      productName: "Acme",
      paymentCents: 2500,
      bidCreditCents: 5000,
      productSlug: "acme",
      productId: "prod-1",
      bidId: "bid-1",
      manageToken: "token-1",
      email: "owner@example.com",
      locale: "de",
      promoCodeId: "promo-1",
      datafastAttribution: {
        visitorId: "visitor-1",
        sessionId: "session-1",
      },
    });

    expect(url).toBe("https://checkout.stripe.com/pay/cs_test");
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "owner@example.com",
        metadata: expect.objectContaining({
          productId: "prod-1",
          bidId: "bid-1",
          bidAmount: "5000",
          amountPaid: "2500",
          promoCodeId: "promo-1",
          datafast_visitor_id: "visitor-1",
          datafast_session_id: "session-1",
        }),
        cancel_url: "https://kingof.lol/de/product/acme",
      }),
    );
  });

  it("uses canonical SITE_URL when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    checkoutCreate.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test" });
    const { createBidCheckoutSession } = await import("./stripe");

    await createBidCheckoutSession({
      productName: "Acme",
      paymentCents: 2500,
      bidCreditCents: 2500,
      productSlug: "acme",
      productId: "prod-1",
      bidId: "bid-1",
      manageToken: "token-1",
      email: "owner@example.com",
    });

    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://kingof.lol/payment/success?session_id={CHECKOUT_SESSION_ID}",
      }),
    );
  });

  it("throws when checkout session has no redirect URL", async () => {
    checkoutCreate.mockResolvedValue({ url: null });
    const { createBidCheckoutSession } = await import("./stripe");

    await expect(
      createBidCheckoutSession({
        productName: "Acme",
        paymentCents: 2500,
        bidCreditCents: 2500,
        productSlug: "acme",
        productId: "prod-1",
        bidId: "bid-1",
        email: "owner@example.com",
      }),
    ).rejects.toThrow("Stripe checkout session missing redirect URL");
  });
});

describe("formatStripeError", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  it("returns Stripe error messages", async () => {
    const { formatStripeError } = await import("./stripe");
    const err = new MockStripeError("Invalid request");
    expect(formatStripeError(err)).toBe("Invalid request");
  });

  it("returns generic Error messages", async () => {
    const { formatStripeError } = await import("./stripe");
    expect(formatStripeError(new Error("network down"))).toBe("network down");
  });

  it("returns fallback for unknown values", async () => {
    const { formatStripeError } = await import("./stripe");
    expect(formatStripeError("unexpected")).toBe("Unknown Stripe error");
  });
});
