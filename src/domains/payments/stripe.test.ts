import { describe, it, expect, vi, beforeEach } from "vitest";

const checkoutCreate = vi.fn();

vi.mock("stripe", () => ({
  default: class StripeMock {
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
      bidAmountCents: 2500,
      productSlug: "acme",
      productId: "prod-1",
      bidId: "bid-1",
      manageToken: "token-1",
      email: "owner@example.com",
      locale: "de",
    });

    expect(url).toBe("https://checkout.stripe.com/pay/cs_test");
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "owner@example.com",
        metadata: expect.objectContaining({
          productId: "prod-1",
          bidId: "bid-1",
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
      bidAmountCents: 2500,
      productSlug: "acme",
      productId: "prod-1",
      bidId: "bid-1",
      manageToken: "token-1",
      email: "owner@example.com",
    });

    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://kingof.lol/manage/token-1?bid=success",
      }),
    );
  });
});
