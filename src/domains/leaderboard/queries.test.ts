import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";
import { sampleCategory, sampleRankedRow } from "../../../tests/helpers/sample-data";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

import {
  getTopProducts,
  getCategoryKings,
  getCategoryProducts,
  getProductBySlug,
  getMostClicked,
  getRandomPicks,
  getHiddenGems,
  getRising,
  getCountryLeaderboards,
  getTopProductsByCountry,
  getCountryMeta,
  getAllCountries,
  getAllCategories,
  getTodayClickCount,
  getProductCount,
  getCategoryCount,
  getTrendingNow,
  getRecentActivity,
  getHappeningNow,
  getProductsPaginated,
} from "./queries";

describe("leaderboard queries", () => {
  beforeEach(() => mock.reset());

  it("getTopProducts maps ranked rows", async () => {
    mock.enqueue([
      sampleRankedRow,
      { ...sampleRankedRow, id: "prod-2", slug: "beta", totalBid: 1000 },
    ]);
    const rows = await getTopProducts(2);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.rank).toBe(1);
    expect(rows[0]!.createdAt).toMatch(/T/);

    mock.reset();
    mock.enqueue([{ ...sampleRankedRow, createdAt: "2026-01-01T00:00:00.000Z" }]);
    const stringDateRows = await getTopProducts(1);
    expect(stringDateRows[0]!.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("getCategoryKings skips categories without kings", async () => {
    mock.enqueue([sampleCategory, { ...sampleCategory, id: "cat-2", slug: "ai" }]);
    mock.enqueue([sampleRankedRow]);
    mock.enqueue([]);
    const kings = await getCategoryKings();
    expect(kings).toHaveLength(1);
    expect(kings[0]!.king.rank).toBe(1);
  });

  it("getCategoryProducts and getProductBySlug resolve ranks", async () => {
    mock.enqueue([sampleRankedRow]);
    const products = await getCategoryProducts("saas", 10);
    expect(products[0]!.rank).toBe(1);

    mock.enqueue([sampleRankedRow]);
    mock.enqueue([{ id: "prod-1" }, { id: "prod-2" }]);
    const product = await getProductBySlug("acme");
    expect(product?.rank).toBe(1);

    mock.enqueue([]);
    await expect(getProductBySlug("missing")).resolves.toBeNull();
  });

  it("getMostClicked maps click counts", async () => {
    mock.enqueue([{ ...sampleRankedRow, clickCount: "4" }]);
    const rows = await getMostClicked(1);
    expect(rows[0]!.clickCount).toBe(4);
  });

  it("getRandomPicks returns active picks or fallback", async () => {
    mock.enqueue([sampleRankedRow]);
    await expect(getRandomPicks(1)).resolves.toHaveLength(1);

    mock.reset();
    mock.enqueue([]);
    mock.enqueue([sampleRankedRow]);
    await expect(getRandomPicks(1)).resolves.toHaveLength(1);
  });

  it("getHiddenGems returns active picks or fallback", async () => {
    mock.enqueue([sampleRankedRow]);
    await expect(getHiddenGems(1)).resolves.toHaveLength(1);

    mock.reset();
    mock.enqueue([]);
    mock.enqueue([sampleRankedRow]);
    await expect(getHiddenGems(1)).resolves.toHaveLength(1);
  });

  it("getRising compares snapshot ranks", async () => {
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ product_id: "prod-1", overall_rank: 1 }],
    }));
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ product_id: "prod-1", overall_rank: 5 }],
    }));
    mock.enqueue([sampleRankedRow]);

    const rising = await getRising(1);
    expect(rising[0]!.positionsUp).toBe(4);
  });

  it("getRising sorts multiple risers by positions gained", async () => {
    mock.execute.mockImplementationOnce(async () => ({
      rows: [
        { product_id: "prod-1", overall_rank: 1 },
        { product_id: "prod-2", overall_rank: 3 },
      ],
    }));
    mock.execute.mockImplementationOnce(async () => ({
      rows: [
        { product_id: "prod-1", overall_rank: 4 },
        { product_id: "prod-2", overall_rank: 8 },
      ],
    }));
    mock.enqueue([sampleRankedRow]);
    mock.enqueue([{ ...sampleRankedRow, id: "prod-2", slug: "beta" }]);

    const rising = await getRising(2);
    expect(rising[0]!.positionsUp).toBeGreaterThanOrEqual(rising[1]!.positionsUp);
  });

  it("getRising ignores products that did not move up", async () => {
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ product_id: "prod-1", overall_rank: 5 }],
    }));
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ product_id: "prod-1", overall_rank: 3 }],
    }));

    await expect(getRising(3)).resolves.toEqual([]);
  });

  it("getRising returns empty when no movement", async () => {
    mock.execute.mockImplementationOnce(async () => ({ rows: [] }));
    mock.execute.mockImplementationOnce(async () => ({ rows: [] }));
    await expect(getRising(3)).resolves.toEqual([]);
  });

  it("getCountryLeaderboards maps known countries", async () => {
    mock.execute.mockImplementationOnce(async () => ({
      rows: [
        { country_code: "US", click_count: 10 },
        { country_code: "XX", click_count: 1 },
      ],
    }));
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ name: "Acme", slug: "acme", clicks: 3 }],
    }));

    const boards = await getCountryLeaderboards(2);
    expect(boards).toHaveLength(1);
    expect(boards[0]!.code).toBe("US");
    expect(boards[0]!.top3[0]!.clicks).toBe(3);
  });

  it("getTopProductsByCountry maps sql rows", async () => {
    mock.execute.mockImplementationOnce(async () => ({
      rows: [
        {
          name: "Acme",
          slug: "acme",
          tagline: "Build",
          icon_url: null,
          og_image_url: null,
          normalized_domain: "acme.com",
          category_name: "SaaS",
          category_emoji: "☁️",
          clicks: "12",
        },
      ],
    }));

    const rows = await getTopProductsByCountry("US", 1);
    expect(rows[0]).toMatchObject({ name: "Acme", clicks: 12 });
  });

  it("exposes country metadata helpers", () => {
    expect(getCountryMeta("US")?.name).toBe("United States");
    expect(getCountryMeta("ZZ")).toBeUndefined();
    expect(getAllCountries().some((c) => c.code === "DE")).toBe(true);
  });

  it("getAllCategories returns ordered categories", async () => {
    mock.enqueue([sampleCategory]);
    await expect(getAllCategories()).resolves.toEqual([sampleCategory]);
  });

  it("returns aggregate counts", async () => {
    mock.enqueue([{ count: 7 }]);
    await expect(getTodayClickCount()).resolves.toBe(7);

    mock.enqueue([{ count: 3 }]);
    await expect(getProductCount()).resolves.toBe(3);

    mock.enqueue([{ count: 2 }]);
    await expect(getCategoryCount()).resolves.toBe(2);

    mock.enqueue([]);
    await expect(getTodayClickCount()).resolves.toBe(0);

    mock.enqueue([]);
    await expect(getProductCount()).resolves.toBe(0);

    mock.enqueue([]);
    await expect(getCategoryCount()).resolves.toBe(0);
  });

  it("getTrendingNow falls back from hour to day to most clicked", async () => {
    mock.enqueue([
      {
        slug: "a",
        name: "A",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "a.com",
        clicks: 10,
      },
    ]);
    await expect(getTrendingNow(1)).resolves.toHaveLength(1);

    mock.reset();
    mock.enqueue([]);
    mock.enqueue([
      {
        slug: "b",
        name: "B",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "b.com",
        clicks: 5,
      },
    ]);
    const dayTrend = await getTrendingNow(1);
    expect(dayTrend[0]!.slug).toBe("b");

    mock.reset();
    mock.enqueue([]);
    mock.enqueue([]);
    mock.enqueue([{ ...sampleRankedRow, clickCount: 14 }]);
    const fallback = await getTrendingNow(1);
    expect(fallback[0]!.slug).toBe("acme");
  });

  it("getRecentActivity merges bids and joins", async () => {
    const at = new Date("2026-01-02T00:00:00.000Z");
    mock.enqueue([
      {
        slug: "acme",
        name: "Acme",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "acme.com",
        totalBid: 5000,
        rank: 1,
        categoryName: "SaaS",
        createdAt: at,
      },
    ]);
    mock.enqueue([
      {
        slug: "beta",
        name: "Beta",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "beta.com",
        totalBid: 1000,
        rank: 2,
        categoryName: "SaaS",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const activity = await getRecentActivity(2);
    expect(activity[0]!.slug).toBe("acme");
    expect(activity.some((a) => a.type === "bid")).toBe(true);
    expect(activity.some((a) => a.type === "joined")).toBe(true);
  });

  it("getHappeningNow combines trending and activity", async () => {
    mock.enqueue([
      {
        slug: "a",
        name: "A",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "a.com",
        clicks: 2,
      },
    ]);
    mock.enqueue([]);
    mock.enqueue([]);

    const data = await getHappeningNow(1, 0);
    expect(data.trending).toHaveLength(1);
    expect(data.activity).toEqual([]);
  });

  it("getProductsPaginated handles bid sort", async () => {
    mock.enqueue([{ total: 1 }]);
    mock.enqueue([sampleRankedRow]);

    const page = await getProductsPaginated({ sort: "bid", page: 1, pageSize: 10 });
    expect(page.total).toBe(1);
    expect(page.products[0]!.slug).toBe("acme");
    expect(page.hasMore).toBe(false);
  });

  it("getProductsPaginated handles new sort and clamps inputs", async () => {
    mock.enqueue([{ total: 0 }]);
    mock.enqueue([]);

    const page = await getProductsPaginated({
      sort: "new",
      page: 0,
      pageSize: 100,
      newWithinMinutes: 90,
    });

    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(50);
    expect(page.products).toEqual([]);
  });

  it("getProductsPaginated reports hasMore when additional pages exist", async () => {
    mock.enqueue([{ total: 3 }]);
    mock.enqueue([sampleRankedRow]);

    const page = await getProductsPaginated({ sort: "bid", page: 1, pageSize: 1 });
    expect(page.hasMore).toBe(true);
  });

  it("getRising skips products that no longer exist", async () => {
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ product_id: "missing", overall_rank: 1 }],
    }));
    mock.execute.mockImplementationOnce(async () => ({
      rows: [{ product_id: "missing", overall_rank: 4 }],
    }));
    mock.enqueue([]);

    await expect(getRising(1)).resolves.toEqual([]);
  });

  it("getTopProductsByCountry handles db failures in callers", async () => {
    mock.execute.mockRejectedValueOnce(new Error("db"));
    await expect(getTopProductsByCountry("US")).rejects.toThrow("db");
  });

  it("getProductsPaginated new sort reports hasMore", async () => {
    mock.enqueue([{ total: 4 }]);
    mock.enqueue([sampleRankedRow, { ...sampleRankedRow, id: "prod-2", slug: "beta" }]);

    const page = await getProductsPaginated({
      sort: "new",
      page: 1,
      pageSize: 2,
      newWithinMinutes: 5,
    });

    expect(page.hasMore).toBe(true);
    expect(page.products).toHaveLength(2);
  });

  it("getProductsPaginated bid sort handles missing total rows", async () => {
    mock.enqueue([]);
    mock.enqueue([]);

    const page = await getProductsPaginated({ sort: "bid", page: 1, pageSize: 10 });
    expect(page.total).toBe(0);
    expect(page.products).toEqual([]);
  });

  it("getProductsPaginated new sort handles missing total rows", async () => {
    mock.enqueue([]);
    mock.enqueue([]);

    const page = await getProductsPaginated({
      sort: "new",
      page: 1,
      pageSize: 10,
      newWithinMinutes: 5,
    });
    expect(page.total).toBe(0);
    expect(page.products).toEqual([]);
  });
});
