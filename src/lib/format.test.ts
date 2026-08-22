import { describe, it, expect } from "vitest";
import { formatBid, formatClicks, rankLabel, rankEmoji } from "./format";

describe("formatBid", () => {
  it("formats zero cents", () => {
    expect(formatBid(0)).toBe("$0");
  });

  it("formats small amounts", () => {
    expect(formatBid(500)).toBe("$5");
    expect(formatBid(1000)).toBe("$10");
  });

  it("formats large amounts with commas", () => {
    expect(formatBid(100000)).toBe("$1,000");
    expect(formatBid(1000000)).toBe("$10,000");
  });

  it("handles fractional cents", () => {
    expect(formatBid(550)).toBe("$5.5");
    expect(formatBid(1299)).toBe("$12.99");
  });
});

describe("formatClicks", () => {
  it("formats small numbers as-is", () => {
    expect(formatClicks(0)).toBe("0");
    expect(formatClicks(42)).toBe("42");
    expect(formatClicks(999)).toBe("999");
  });

  it("formats thousands with k suffix", () => {
    expect(formatClicks(1000)).toBe("1.0k");
    expect(formatClicks(1500)).toBe("1.5k");
    expect(formatClicks(10000)).toBe("10.0k");
  });
});

describe("rankLabel", () => {
  it("returns crown for rank 1", () => {
    expect(rankLabel(1)).toBe("👑");
  });

  it("returns hash-number for other ranks", () => {
    expect(rankLabel(2)).toBe("#2");
    expect(rankLabel(10)).toBe("#10");
    expect(rankLabel(100)).toBe("#100");
  });
});

describe("rankEmoji", () => {
  it("returns crown for rank 1", () => {
    expect(rankEmoji(1)).toBe("👑");
  });

  it("returns empty string for other ranks", () => {
    expect(rankEmoji(2)).toBe("");
    expect(rankEmoji(50)).toBe("");
  });
});
