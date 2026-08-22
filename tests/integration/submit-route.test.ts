import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../helpers/mock-db";
import { sampleCategory } from "../helpers/sample-data";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

vi.mock("@/domains/payments/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/payments/stripe")>();
  return {
    ...actual,
    createBidCheckoutSession: vi.fn(),
  };
});

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

vi.mock("@/domains/submissions/free-listing-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/submissions/free-listing-limit")>();
  return {
    ...actual,
    hasFreeListingFromIp: vi.fn(actual.hasFreeListingFromIp),
    recordFreeListingClaim: vi.fn(actual.recordFreeListingClaim),
  };
});

import { createBidCheckoutSession } from "@/domains/payments/stripe";
import { getProductRanks } from "@/domains/leaderboard/queries";
import {
  hasFreeListingFromIp,
  recordFreeListingClaim,
} from "@/domains/submissions/free-listing-limit";
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
  beforeEach(async () => {
    mock.reset();
    vi.clearAllMocks();
    vi.mocked(getProductRanks).mockResolvedValue({
      overallRank: 26,
      categoryRank: 7,
      categoryName: "SaaS",
      categoryEmoji: "☁️",
    });

    const actual = await vi.importActual<typeof import("@/domains/submissions/free-listing-limit")>(
      "@/domains/submissions/free-listing-limit",
    );
    vi.mocked(hasFreeListingFromIp).mockImplementation(actual.hasFreeListingFromIp);
    vi.mocked(recordFreeListingClaim).mockImplementation(actual.recordFreeListingClaim);
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
    expect(recordFreeListingClaim).not.toHaveBeenCalled();
  });

  it("records a free listing claim in production after a successful submit", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    vi.mocked(hasFreeListingFromIp).mockResolvedValue(false);

    mock.enqueue([]);
    mock.enqueue([{ id: sampleCategory.id }]);
    mock.enqueue([]);
    mock.enqueue([{ id: "prod-new", slug: "launch-app" }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.77",
        },
        body: JSON.stringify(
          submitBody({
            bid: 0,
            name: "Launch App",
            url: "https://launch-app.example",
          }),
        ),
      }),
    );

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(200);
    expect(recordFreeListingClaim).toHaveBeenCalledWith(expect.any(String), "prod-new");
  });

  it("returns 500 when the free listing claim table is missing in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    vi.mocked(hasFreeListingFromIp).mockRejectedValue(
      Object.assign(new Error('relation "free_listing_claims" does not exist'), {
        code: "42P01",
      }),
    );

    mock.enqueue([]);
    mock.enqueue([{ id: sampleCategory.id }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.88",
        },
        body: JSON.stringify(
          submitBody({ bid: 0, url: "https://missing-table.example", name: "Missing Table" }),
        ),
      }),
    );

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ error: "Internal error" });
  });

  it("rejects a second free listing from the same IP in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    mock.enqueue([]);
    mock.enqueue([{ id: sampleCategory.id }]);
    mock.enqueue([{ id: "claim-1" }]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.50",
        },
        body: JSON.stringify(
          submitBody({ bid: 0, url: "https://another-product.example", name: "Another" }),
        ),
      }),
    );

    process.env.NODE_ENV = originalEnv;

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ error: "FREE_LISTING_LIMIT" });
  });

  it("returns checkout for an existing product instead of rejecting duplicate URLs", async () => {
    vi.mocked(createBidCheckoutSession).mockResolvedValue("https://checkout.stripe.com/existing");

    mock.enqueue([
      {
        id: "prod-existing",
        slug: "kingof",
        name: "KINGOF",
        email: "founder@kingof.lol",
        totalBid: 0,
      },
    ]);
    mock.enqueue([{ id: "bid-2" }]);

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
      checkoutUrl: "https://checkout.stripe.com/existing",
      alreadyListed: true,
    });
    expect(mock.db.insert).toHaveBeenCalled();
  });

  it("rejects bid increases from a different email", async () => {
    mock.enqueue([
      {
        id: "prod-existing",
        slug: "kingof",
        name: "KINGOF",
        email: "owner@kingof.lol",
        totalBid: 2500,
      },
    ]);

    const res = await submitPost(
      new Request("https://kingof.lol/api/submit", {
        method: "POST",
        body: JSON.stringify(
          submitBody({ email: "founder@kingof.lol", bid: 2500, bidIsIncrement: true }),
        ),
      }),
    );

    expect(res.status).toBe(403);
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
    await expect(res.json()).resolves.toMatchObject({
      error: "Payment setup failed",
      reason: "Stripe down",
    });
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
