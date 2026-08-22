import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../helpers/mock-db";

const mock = createMockDb();
const rawToken = "a".repeat(64);

vi.mock("@/domains/leaderboard/queries", () => ({
  getProductRanks: vi.fn(),
}));

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

import { getProductRanks } from "@/domains/leaderboard/queries";
import { GET as manageGet } from "@/app/api/manage/[token]/route";

describe("GET /api/manage/[token]", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
  });

  it("returns overall and category ranks for a valid token", async () => {
    mock.enqueue([
      {
        id: "prod-linkedin",
        slug: "linkedin",
        name: "LinkedIn",
        tagline: "Professional network",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "linkedin.com",
        totalBid: 0,
        categoryName: "Social",
        categorySlug: "social",
        categoryEmoji: "👥",
        clickCount: 0,
      },
    ]);

    vi.mocked(getProductRanks).mockResolvedValue({
      overallRank: 2,
      categoryRank: 1,
      categoryName: "Social",
      categoryEmoji: "👥",
    });

    const res = await manageGet(new Request("https://kingof.lol/api/manage/x"), {
      params: Promise.resolve({ token: rawToken }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      name: "LinkedIn",
      totalBid: 0,
      overallRank: 2,
      categoryRank: 1,
      categorySlug: "social",
      categoryEmoji: "👥",
    });
    expect(getProductRanks).toHaveBeenCalledWith("prod-linkedin");
  });

  it("returns 404 for unknown token", async () => {
    mock.enqueue([]);

    const res = await manageGet(new Request("https://kingof.lol/api/manage/x"), {
      params: Promise.resolve({ token: "unknown-token" }),
    });

    expect(res.status).toBe(404);
    expect(getProductRanks).not.toHaveBeenCalled();
  });

  it("returns 404 when ranks cannot be resolved", async () => {
    mock.enqueue([
      {
        id: "prod-missing",
        slug: "missing",
        name: "Missing",
        tagline: "Gone",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "missing.com",
        totalBid: 0,
        categoryName: "SaaS",
        categorySlug: "saas",
        categoryEmoji: "☁️",
        clickCount: 0,
      },
    ]);
    vi.mocked(getProductRanks).mockResolvedValue(null);

    const res = await manageGet(new Request("https://kingof.lol/api/manage/x"), {
      params: Promise.resolve({ token: rawToken }),
    });

    expect(res.status).toBe(404);
  });
});
