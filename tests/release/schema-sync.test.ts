import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  bids,
  clicks,
  freeListingClaims,
  hiddenGemPicks,
  products,
  promoRedemptions,
  randomPicks,
  rankingSnapshots,
  sponsors,
} from "@/db/schema";
import { PRODUCT_CLEAR_TABLES } from "@/db/clear-tables";

const SCHEMA_PRODUCT_TABLES = [
  products,
  bids,
  promoRedemptions,
  clicks,
  randomPicks,
  sponsors,
  rankingSnapshots,
  hiddenGemPicks,
  freeListingClaims,
].map((table) => getTableName(table));

describe("release schema sync", () => {
  it("keeps db:clear table list aligned with Drizzle schema", () => {
    expect([...PRODUCT_CLEAR_TABLES].sort()).toEqual([...SCHEMA_PRODUCT_TABLES].sort());
  });

  it("includes free_listing_claims required for production free submits", () => {
    expect(getTableName(freeListingClaims)).toBe("free_listing_claims");
    expect(PRODUCT_CLEAR_TABLES).toContain("free_listing_claims");
  });
});
