import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../helpers/mock-db";

const mock = createMockDb();

vi.mock("@/domains/leaderboard/queries", () => ({
  getHappeningNow: vi.fn(),
  getAllCategories: vi.fn(),
  getProductsPaginated: vi.fn(),
  getTopProductsByCountry: vi.fn(),
  getCountryMeta: vi.fn((code: string) =>
    code === "US" ? { flag: "🇺🇸", name: "United States" } : undefined,
  ),
  getAllCountries: vi.fn(() => [{ code: "US", flag: "🇺🇸", name: "United States" }]),
}));

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

import {
  getHappeningNow,
  getAllCategories,
  getProductsPaginated,
  getTopProductsByCountry,
} from "@/domains/leaderboard/queries";
import { GET as activityGet } from "@/app/api/activity/route";
import { GET as categoriesGet } from "@/app/api/categories/route";
import { GET as listGet } from "@/app/api/products/list/route";
import { GET as topByCountryGet } from "@/app/api/top-by-country/route";
import { GET as snapshotsGet } from "@/app/api/cron/snapshots/route";

describe("API route integration", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("GET /api/activity returns live data", async () => {
    vi.mocked(getHappeningNow).mockResolvedValue({
      trending: [
        {
          slug: "a",
          name: "A",
          iconUrl: null,
          ogImageUrl: null,
          normalizedDomain: "a.com",
          clicksPerHour: 1,
        },
      ],
      activity: [],
    });

    const res = await activityGet();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ trending: expect.any(Array) });
  });

  it("GET /api/activity falls back to demo in development", async () => {
    vi.mocked(getHappeningNow).mockRejectedValue(new Error("db down"));
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const res = await activityGet();
    const body = await res.json();
    process.env.NODE_ENV = original;

    expect(body.trending.length).toBeGreaterThan(0);
  });

  it("GET /api/activity returns empty feed in production on failure", async () => {
    vi.mocked(getHappeningNow).mockRejectedValue(new Error("db down"));
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const res = await activityGet();
    const body = await res.json();
    process.env.NODE_ENV = original;

    expect(body).toEqual({ trending: [], activity: [] });
  });

  it("GET /api/categories returns categories or fallback", async () => {
    vi.mocked(getAllCategories).mockResolvedValue([
      { id: "1", slug: "ai", name: "AI", emoji: "🤖", sortOrder: 1 },
    ]);
    const ok = await categoriesGet();
    expect(ok.status).toBe(200);

    vi.mocked(getAllCategories).mockRejectedValue(new Error("db down"));
    const fallback = await categoriesGet();
    const body = await fallback.json();
    expect(body.length).toBeGreaterThan(0);
  });

  it("GET /api/products/list parses query params", async () => {
    vi.mocked(getProductsPaginated).mockResolvedValue({
      products: [],
      total: 0,
      page: 1,
      pageSize: 10,
      hasMore: false,
    });

    const req = new Request(
      "https://kingof.lol/api/products/list?sort=new&page=2&limit=5&minutes=10",
    );
    const res = await listGet(req);
    expect(res.status).toBe(200);
    expect(getProductsPaginated).toHaveBeenCalledWith({
      sort: "new",
      page: 2,
      pageSize: 5,
      newWithinMinutes: 10,
    });
  });

  it("GET /api/products/list returns 500 payload on failure", async () => {
    vi.mocked(getProductsPaginated).mockRejectedValue(new Error("db down"));
    const res = await listGet(new Request("https://kingof.lol/api/products/list"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ products: [], hasMore: false });
  });

  it("GET /api/top-by-country lists countries when no code provided", async () => {
    const req = new Request("https://kingof.lol/api/top-by-country", {
      headers: { "x-vercel-ip-country": "us" },
    });
    const res = await topByCountryGet(req);
    const body = await res.json();
    expect(body.detectedCountry).toBe("US");
    expect(body.countries).toHaveLength(1);
  });

  it("GET /api/top-by-country rejects unknown country", async () => {
    const req = new Request("https://kingof.lol/api/top-by-country?country=ZZ");
    const res = await topByCountryGet(req);
    expect(res.status).toBe(400);
  });

  it("GET /api/top-by-country returns products for supported country", async () => {
    vi.mocked(getTopProductsByCountry).mockResolvedValue([
      {
        name: "Acme",
        slug: "acme",
        tagline: "Build",
        clicks: 3,
        categoryName: "SaaS",
        categoryEmoji: "☁️",
        iconUrl: null,
        ogImageUrl: null,
        normalizedDomain: "acme.com",
      },
    ]);

    const req = new Request("https://kingof.lol/api/top-by-country?country=US");
    const res = await topByCountryGet(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ code: "US", products: expect.any(Array) });
  });

  it("GET /api/cron/snapshots enforces auth and records snapshots", async () => {
    process.env.CRON_SECRET = "secret";
    const unauthorized = await snapshotsGet(new Request("https://kingof.lol/api/cron/snapshots"));
    expect(unauthorized.status).toBe(401);

    mock.enqueue([
      { id: "p1", categoryId: "c1", totalBid: 100 },
      { id: "p2", categoryId: "c1", totalBid: 50 },
    ]);

    const authorized = await snapshotsGet(
      new Request("https://kingof.lol/api/cron/snapshots", {
        headers: { authorization: "Bearer secret" },
      }),
    );
    expect(authorized.status).toBe(200);
    await expect(authorized.json()).resolves.toMatchObject({ success: true, count: 2 });
  });
});
