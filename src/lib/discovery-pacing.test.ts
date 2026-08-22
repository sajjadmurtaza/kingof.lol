import { describe, it, expect } from "vitest";
import {
  DISCOVERY_PICK_MS,
  DISCOVERY_COOLDOWN_MS,
  DISCOVER_PAGE_PICK_MS,
  DISCOVER_PAGE_COOLDOWN_MS,
} from "./discovery-pacing";

describe("discovery pacing constants", () => {
  it("defines homepage and discover page timings", () => {
    expect(DISCOVERY_PICK_MS).toBe(30_000);
    expect(DISCOVERY_COOLDOWN_MS).toBe(20_000);
    expect(DISCOVER_PAGE_PICK_MS).toBe(60_000);
    expect(DISCOVER_PAGE_COOLDOWN_MS).toBe(60_000);
  });
});
