import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../helpers/mock-db";
import { sampleCategory } from "../helpers/sample-data";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

vi.mock("@/domains/payments/stripe", () => ({
  createBidCheckoutSession: vi.fn(),
}));

vi.mock("@/domains/email/resend", () => ({
  sendManagementLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/domains/leaderboard/queries", () => ({
  getProductRanks: vi.fn(),
}));

vi.mock("@/lib/slack", () => ({
  notifySlack: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import { createBidCheckoutSession } from "@/domains/payments/stripe";
import { getProductRanks } from "@/domains/leaderboard/queries";
import { POST as submitPost } from "@/app/api/submit/route";

function submitBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "KINGOF",
    url: "https://kingof.lol",
    tagline: "Competitive leaderboard",
    category: "saas",
    email: "founder@kingof.lol",
    bid: 0,
    locale: "en",
    ...overrides,
  };
}

describe("POST /api/submit", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
    vi.mocked(getProductRanks).mockResolvedValue({
      overallRank: 26,
      categoryRank: 7,
      categoryName: "SaaS",
      categoryEmoji: "☁️",
    });
  });

  it("creates a free listing and returns real ranks (not hardcoded UI placeholders)", async () => {
    mock.enqueue([]);
    mock.enqueue([{ id: sampleCategory.id }]);
    mock.enqueue([]);
    mock.enqueue([{ id: "prod-new", slug: "kingof" }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitBody()),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      slug: "kingof",
      overallRank: 26,
      categoryRank: 7,
      categoryName: "SaaS",
    });
  });

  it("rejects duplicate URLs with 409", async () => {
    mock.enqueue([{ id: "prod-existing", slug: "kingof" }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        body: JSON.stringify(submitBody()),
      }),
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "This product is already listed",
      existingSlug: "kingof",
    });
  });

  it("returns checkout URL for paid bids", async () => {
    vi.mocked(createBidCheckoutSession).mockResolvedValue("https://checkout.stripe.com/test");

    mock.enqueue([]);
    mock.enqueue([{ id: sampleCategory.id }]);
    mock.enqueue([]);
    mock.enqueue([{ id: "prod-new", slug: "kingof" }]);
    mock.enqueue([{ id: "bid-1" }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        body: JSON.stringify(submitBody({ bid: 2500 })),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      slug: "kingof",
      checkoutUrl: "https://checkout.stripe.com/test",
      overallRank: 26,
    });
  });

  it("rolls back product and bid when Stripe checkout fails", async () => {
    vi.mocked(createBidCheckoutSession).mockRejectedValue(new Error("Stripe down"));

    mock.enqueue([]);
    mock.enqueue([{ id: sampleCategory.id }]);
    mock.enqueue([]);
    mock.enqueue([{ id: "prod-new", slug: "kingof" }]);
    mock.enqueue([{ id: "bid-1" }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        body: JSON.stringify(submitBody({ bid: 2500 })),
      }),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ error: "Payment setup failed" });
    expect(mock.db.delete).toHaveBeenCalledTimes(2);
  });

  it("validates required fields", async () => {
    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );

    expect(res.status).toBe(400);
  });
});
