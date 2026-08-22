import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

describe("most clicked domain cache", () => {
  beforeEach(async () => {
    mock.reset();
    vi.resetModules();
  });

  it("queries and caches most clicked products", async () => {
    const rows = [{ id: "p1", slug: "a", name: "A", clickCount: 10 }];
    mock.enqueue(rows);

    const { getMostClickedProducts } = await import("./most-clicked");
    await expect(getMostClickedProducts(1)).resolves.toEqual(rows);
    await expect(getMostClickedProducts(1)).resolves.toEqual(rows);
    expect(mock.db.select).toHaveBeenCalledTimes(1);
  });
});
