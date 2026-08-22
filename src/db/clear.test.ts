import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockDb } from "../../tests/helpers/mock-db";
import { PRODUCT_CLEAR_TABLES } from "./clear-tables";

const mock = createMockDb();

vi.mock("./index", () => ({
  getDb: () => mock.db,
}));

describe("PRODUCT_CLEAR_TABLES", () => {
  it("includes every product-related table used by free listing and rankings", () => {
    expect(PRODUCT_CLEAR_TABLES).toEqual(
      expect.arrayContaining([
        "products",
        "bids",
        "clicks",
        "free_listing_claims",
        "random_picks",
        "hidden_gem_picks",
        "ranking_snapshots",
        "sponsors",
      ]),
    );
  });
});

describe("clearProductData", () => {
  beforeEach(() => {
    mock.reset();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("truncates only existing tables and clears webhook cache tables", async () => {
    mock.enqueue([
      { tablename: "bids" },
      { tablename: "products" },
      { tablename: "free_listing_claims" },
    ]);
    mock.enqueue([]);
    mock.enqueue([]);
    mock.enqueue([]);
    mock.enqueue([{ count: "0" }]);
    mock.enqueue([{ count: "0" }]);
    mock.enqueue([{ count: "15" }]);

    const { clearProductData } = await import("./clear");
    await clearProductData();

    expect(mock.db.execute).toHaveBeenCalledTimes(7);
  });

  it("skips truncate when no product tables exist yet", async () => {
    mock.enqueue([]);
    mock.enqueue([]);
    mock.enqueue([]);
    mock.enqueue([{ count: "0" }]);
    mock.enqueue([{ count: "0" }]);
    mock.enqueue([{ count: "15" }]);

    const log = vi.spyOn(console, "log");
    const { clearProductData } = await import("./clear");
    await clearProductData();

    expect(log).toHaveBeenCalledWith("No product tables found to truncate.");
    expect(mock.db.execute).toHaveBeenCalledTimes(6);
  });
});

describe("assertClearConfirmed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses to run without CONFIRM_CLEAR=1", async () => {
    vi.stubEnv("CONFIRM_CLEAR", "0");
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { assertClearConfirmed } = await import("./clear");
    assertClearConfirmed();

    expect(error).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });
});
