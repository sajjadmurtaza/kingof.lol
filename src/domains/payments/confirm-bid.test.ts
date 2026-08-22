import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();
const retrieveSession = vi.fn();

vi.mock("@/db", () => ({ getDb: () => mock.db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));
vi.mock("@/lib/site-url", () => ({ getSiteUrl: () => "https://kingof.lol" }));
vi.mock("@/domains/payments/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { retrieve: retrieveSession } },
  }),
}));
vi.mock("@/domains/email/resend", () => ({ sendDethronedEmail: vi.fn() }));

import { confirmBidFromCheckoutSession, confirmBidFromCheckoutSessionId } from "./confirm-bid";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { sendDethronedEmail } from "@/domains/email/resend";

function paidSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test",
    payment_status: "paid",
    metadata: {
      productId: "prod-1",
      bidId: "bid-1",
      bidAmount: "2500",
      productSlug: "acme",
    },
    ...overrides,
  } as Stripe.Checkout.Session;
}

describe("confirmBidFromCheckoutSession", () => {
  beforeEach(() => {
    mock.reset();
    retrieveSession.mockReset();
    vi.mocked(sendDethronedEmail).mockReset().mockResolvedValue(undefined);
    vi.mocked(Sentry.captureException).mockReset();
    vi.mocked(revalidatePath).mockReset();
  });

  it("rejects unpaid sessions", async () => {
    const result = await confirmBidFromCheckoutSession(
      paidSession({ payment_status: "unpaid" }),
      "evt-1",
    );
    expect(result).toEqual({ ok: false, error: "Payment not completed" });
  });

  it("rejects missing metadata", async () => {
    const result = await confirmBidFromCheckoutSession(paidSession({ metadata: {} }), "evt-1");
    expect(result).toEqual({ ok: false, error: "Missing checkout metadata" });
  });

  it("rejects null metadata", async () => {
    const result = await confirmBidFromCheckoutSession(
      paidSession({ metadata: null as unknown as Stripe.Metadata }),
      "evt-1",
    );
    expect(result).toEqual({ ok: false, error: "Missing checkout metadata" });
  });

  it("rejects invalid bid amount metadata", async () => {
    const result = await confirmBidFromCheckoutSession(
      paidSession({
        metadata: {
          productId: "prod-1",
          bidId: "bid-1",
          bidAmount: "0",
        },
      }),
      "evt-1",
    );
    expect(result).toEqual({ ok: false, error: "Missing checkout metadata" });
  });

  it("rejects non-numeric bid amount metadata", async () => {
    const result = await confirmBidFromCheckoutSession(
      paidSession({
        metadata: {
          productId: "prod-1",
          bidId: "bid-1",
          bidAmount: "abc",
        },
      }),
      "evt-1",
    );
    expect(result).toEqual({ ok: false, error: "Missing checkout metadata" });
  });

  it("accepts metadata without productSlug", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "confirmed", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 2500 }]);

    const result = await confirmBidFromCheckoutSession(
      paidSession({
        metadata: {
          productId: "prod-1",
          bidId: "bid-1",
          bidAmount: "2500",
        },
      }),
      "evt-1",
    );
    expect(result).toMatchObject({ ok: true, productSlug: "acme" });
  });

  it("returns error when bid is missing", async () => {
    mock.enqueue([]);
    mock.enqueue([]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-1");
    expect(result).toEqual({ ok: false, error: "Bid not found" });
  });

  it("returns error when product is missing", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-1");
    expect(result).toEqual({ ok: false, error: "Product not found" });
  });

  it("returns already confirmed when bid is confirmed", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "confirmed", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 2500 }]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-1");
    expect(result).toEqual({
      ok: true,
      alreadyConfirmed: true,
      productSlug: "acme",
      productId: "prod-1",
      productName: "Acme",
      bidAmountCents: 2500,
      totalBidCents: 2500,
    });
  });

  it("returns already confirmed when idempotency event exists", async () => {
    mock.enqueue([{ id: "evt-row" }]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 2500 }]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-1");
    expect(result).toMatchObject({ ok: true, alreadyConfirmed: true });
  });

  it("confirms a pending bid and notifies dethroned kings", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 0 }]);
    mock.enqueue([{ totalBid: 2500, name: "Acme", slug: "acme" }]);
    mock.enqueue([
      {
        id: "prod-1",
        name: "Acme",
        categoryId: "cat-1",
        totalBid: 2500,
      },
    ]);
    mock.enqueue([{ name: "SaaS" }]);
    mock.enqueue([
      {
        id: "prod-2",
        email: "old@example.com",
        name: "Old King",
      },
    ]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-new");

    expect(result).toEqual({
      ok: true,
      alreadyConfirmed: false,
      productSlug: "acme",
      productId: "prod-1",
      productName: "Acme",
      bidAmountCents: 2500,
      totalBidCents: 2500,
    });
    expect(revalidatePath).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(sendDethronedEmail).toHaveBeenCalled();
    });
  });

  it("falls back to original product fields when refresh select is empty", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 1000 }]);
    mock.enqueue([]);
    mock.enqueue([]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-fallback");
    expect(result).toEqual({
      ok: true,
      alreadyConfirmed: false,
      productSlug: "acme",
      productId: "prod-1",
      productName: "Acme",
      bidAmountCents: 2500,
      totalBidCents: 3500,
    });
  });

  it("retrieves session by id", async () => {
    retrieveSession.mockResolvedValue(paidSession());
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "confirmed", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 2500 }]);

    const result = await confirmBidFromCheckoutSessionId("cs_test");
    expect(retrieveSession).toHaveBeenCalledWith("cs_test");
    expect(result).toMatchObject({ ok: true, alreadyConfirmed: true });
  });

  it("captures email failures without failing confirmation", async () => {
    vi.mocked(sendDethronedEmail).mockRejectedValue(new Error("email down"));
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 0 }]);
    mock.enqueue([{ totalBid: 2500, name: "Acme", slug: "acme" }]);
    mock.enqueue([
      {
        id: "prod-1",
        name: "Acme",
        categoryId: "cat-1",
        totalBid: 2500,
      },
    ]);
    mock.enqueue([{ name: "SaaS" }]);
    mock.enqueue([
      {
        id: "prod-2",
        email: "old@example.com",
        name: "Old King",
      },
    ]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-email-fail");
    expect(result).toMatchObject({ ok: true, alreadyConfirmed: false });
    await vi.waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  it("captures dethroned lookup failures without failing confirmation", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 0 }]);
    mock.enqueue([{ totalBid: 2500, name: "Acme", slug: "acme" }]);
    mock.enqueue([
      {
        id: "prod-1",
        name: "Acme",
        categoryId: "cat-1",
        totalBid: 2500,
      },
    ]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-dethrone-fail");
    expect(result).toMatchObject({ ok: true, alreadyConfirmed: false });
    await vi.waitFor(() => {
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { route: "payments/confirm-bid", failure: "email_send_failed" },
          extra: { productId: "prod-1" },
        }),
      );
    });
  });

  it("skips dethroned emails when product lookup returns empty", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 0 }]);
    mock.enqueue([{ totalBid: 2500, name: "Acme", slug: "acme" }]);
    mock.enqueue([]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-no-product");
    expect(result).toMatchObject({ ok: true, alreadyConfirmed: false });
    await vi.waitFor(() => {
      expect(sendDethronedEmail).not.toHaveBeenCalled();
    });
  });

  it("skips dethroned emails when category lookup returns empty", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: "bid-1", status: "pending", productId: "prod-1" }]);
    mock.enqueue([{ slug: "acme", name: "Acme", totalBid: 0 }]);
    mock.enqueue([{ totalBid: 2500, name: "Acme", slug: "acme" }]);
    mock.enqueue([
      {
        id: "prod-1",
        name: "Acme",
        categoryId: "cat-1",
        totalBid: 2500,
      },
    ]);
    mock.enqueue([]);

    const result = await confirmBidFromCheckoutSession(paidSession(), "evt-no-category");
    expect(result).toMatchObject({ ok: true, alreadyConfirmed: false });
    await vi.waitFor(() => {
      expect(sendDethronedEmail).not.toHaveBeenCalled();
    });
  });
});
