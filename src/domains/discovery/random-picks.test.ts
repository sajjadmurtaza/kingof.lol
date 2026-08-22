import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

import { refreshRandomPicks, getActiveRandomPicks } from "./random-picks";

describe("random picks domain", () => {
  beforeEach(() => mock.reset());

  it("returns empty array when no eligible products", async () => {
    mock.enqueue([]);
    await expect(refreshRandomPicks(3)).resolves.toEqual([]);
  });

  it("inserts picks for eligible products", async () => {
    mock.enqueue([{ id: "p1" }, { id: "p2" }]);
    const picks = await refreshRandomPicks(2);
    expect(picks).toHaveLength(2);
    expect(mock.db.insert).toHaveBeenCalled();
  });

  it("filters by category when provided", async () => {
    mock.enqueue([{ id: "p1" }]);
    await refreshRandomPicks(1, "cat-1");
    expect(mock.db.select).toHaveBeenCalled();
  });

  it("returns active picks and refreshes when short", async () => {
    mock.enqueue([
      {
        id: "p1",
        slug: "a",
        name: "A",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
    ]);
    mock.enqueue([{ id: "p2" }]);
    mock.enqueue([
      {
        id: "p1",
        slug: "a",
        name: "A",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
      {
        id: "p2",
        slug: "b",
        name: "B",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
      {
        id: "p3",
        slug: "c",
        name: "C",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
    ]);

    const picks = await getActiveRandomPicks(3);
    expect(picks.length).toBeGreaterThan(0);
  });

  it("filters active picks by category", async () => {
    mock.enqueue([
      {
        id: "p1",
        slug: "a",
        name: "A",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c1",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
      {
        id: "p2",
        slug: "b",
        name: "B",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c1",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
      {
        id: "p3",
        slug: "c",
        name: "C",
        tagline: "",
        url: "",
        totalBid: 1,
        categoryId: "c1",
        categorySlug: "saas",
        categoryName: "SaaS",
        categoryEmoji: "☁️",
      },
    ]);

    const picks = await getActiveRandomPicks(3, "c1");
    expect(picks).toHaveLength(3);
  });
});
