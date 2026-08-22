import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

describe("hidden gems domain cache", () => {
  beforeEach(async () => {
    mock.reset();
    vi.resetModules();
  });

  it("queries and caches hidden gems", async () => {
    const gems = [
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
        clickCount: 1,
      },
    ];
    mock.enqueue(gems);

    const { getHiddenGems } = await import("./hidden-gems");
    await expect(getHiddenGems(1)).resolves.toEqual(gems);
    await expect(getHiddenGems(1)).resolves.toEqual(gems);
    expect(mock.db.select).toHaveBeenCalledTimes(1);
  });
});
