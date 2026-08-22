import { describe, it, expect, afterEach } from "vitest";
import {
  demoTopProducts,
  demoCategoryKings,
  demoMostClicked,
  demoRandom3,
  demoHiddenGems,
  demoCategoryProducts,
  demoProductBySlug,
  demoAllCategories,
  demoRising,
  demoCountryLeaderboards,
  demoTrendingNow,
  demoRecentActivity,
  demoHappeningNow,
  shouldShowDemoActivity,
  emptyHappeningNow,
  DEMO_ALL_PRODUCTS,
} from "./demo-data";

describe("demo-data", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("exports seeded products", () => {
    expect(DEMO_ALL_PRODUCTS.length).toBeGreaterThan(20);
  });

  it("returns top products sorted by bid", () => {
    const top = demoTopProducts(3);
    expect(top).toHaveLength(3);
    expect(top[0]!.rank).toBe(1);
    expect(top[0]!.totalBid).toBeGreaterThanOrEqual(top[1]!.totalBid);
  });

  it("returns category kings", () => {
    const kings = demoCategoryKings();
    expect(kings.length).toBeGreaterThan(0);
    expect(kings[0]!.king.rank).toBe(1);
    expect(kings.every((entry) => entry.king !== null)).toBe(true);
  });

  it("returns most clicked products", () => {
    const items = demoMostClicked(5);
    expect(items).toHaveLength(5);
    expect(items[0]!.clickCount).toBeGreaterThanOrEqual(items[1]!.clickCount);
  });

  it("returns random and hidden gem picks", () => {
    expect(demoRandom3()).toHaveLength(3);
    expect(demoHiddenGems()).toHaveLength(3);
  });

  it("filters category products and resolves slug rank", () => {
    const ai = demoCategoryProducts("ai");
    expect(ai.every((p) => p.categorySlug === "ai")).toBe(true);
    expect(demoProductBySlug("neuralforge")?.slug).toBe("neuralforge");
    expect(demoProductBySlug("missing")).toBeNull();
  });

  it("returns categories, rising products, and country boards", () => {
    expect(demoAllCategories().length).toBeGreaterThan(0);
    expect(demoRising(3)[0]!.positionsUp).toBeGreaterThan(0);
    expect(demoCountryLeaderboards()[0]!.top3).toHaveLength(3);
  });

  it("returns trending and activity feeds", () => {
    expect(demoTrendingNow(3)).toHaveLength(3);
    expect(demoRecentActivity(3)).toHaveLength(3);
    expect(demoHappeningNow(2, 2)).toMatchObject({
      trending: expect.any(Array),
      activity: expect.any(Array),
    });
  });

  it("gates demo activity by environment", () => {
    process.env.NODE_ENV = "production";
    expect(shouldShowDemoActivity()).toBe(false);
    process.env.NODE_ENV = "development";
    expect(shouldShowDemoActivity()).toBe(true);
    expect(emptyHappeningNow()).toEqual({ trending: [], activity: [] });
  });
});
