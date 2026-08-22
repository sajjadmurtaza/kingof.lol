import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockDb } from "../../../tests/helpers/mock-db";

const mock = createMockDb();

vi.mock("@/db", () => ({
  getDb: () => mock.db,
}));

import {
  FREE_LISTING_LIMIT_ERROR,
  hasFreeListingFromIp,
  recordFreeListingClaim,
  shouldEnforceFreeListingLimit,
} from "./free-listing-limit";

describe("free listing limit", () => {
  beforeEach(() => {
    mock.reset();
  });

  it("exports a stable error code", () => {
    expect(FREE_LISTING_LIMIT_ERROR).toBe("FREE_LISTING_LIMIT");
  });

  it("skips enforcement for localhost in non-production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    expect(shouldEnforceFreeListingLimit("0.0.0.0")).toBe(false);
    process.env.NODE_ENV = original;
  });

  it("enforces limit for localhost in production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(shouldEnforceFreeListingLimit("0.0.0.0")).toBe(true);
    process.env.NODE_ENV = original;
  });

  it("detects an existing free listing claim for an IP hash", async () => {
    mock.enqueue([{ id: "claim-1" }]);
    await expect(hasFreeListingFromIp("hash-a")).resolves.toBe(true);
  });

  it("allows first free listing when no claim exists", async () => {
    mock.enqueue([]);
    await expect(hasFreeListingFromIp("hash-b")).resolves.toBe(false);
  });

  it("records a free listing claim", async () => {
    await recordFreeListingClaim("hash-c", "prod-1");
    expect(mock.db.insert).toHaveBeenCalled();
  });
});
