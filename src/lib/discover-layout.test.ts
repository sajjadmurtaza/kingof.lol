import { describe, it, expect } from "vitest";
import { heroContentGrid, discoverContentGrid } from "./discover-layout";

describe("discover layout tokens", () => {
  it("exports grid class strings", () => {
    expect(heroContentGrid).toContain("grid");
    expect(discoverContentGrid).toContain("grid");
  });
});
