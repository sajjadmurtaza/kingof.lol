import { describe, it, expect } from "vitest";
import {
  formatBid,
  formatClicks,
  rankLabel,
  rankEmoji,
  timeAgoParts,
  siteLabelForAvatar,
} from "./format";

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

describe("timeAgoParts", () => {
  const now = new Date("2026-01-01T12:00:00.000Z").getTime();

  it("returns now for sub-minute diff", () => {
    expect(timeAgoParts(new Date(now - 30_000), now)).toEqual({ unit: "now" });
  });

  it("returns minutes", () => {
    expect(timeAgoParts(new Date(now - 5 * 60_000), now)).toEqual({
      unit: "minutes",
      count: 5,
    });
  });

  it("returns hours", () => {
    expect(timeAgoParts(new Date(now - 3 * 60 * 60_000), now)).toEqual({
      unit: "hours",
      count: 3,
    });
  });

  it("returns days", () => {
    expect(timeAgoParts(new Date(now - 2 * 24 * 60 * 60_000), now)).toEqual({
      unit: "days",
      count: 2,
    });
  });
});

describe("siteLabelForAvatar", () => {
  it("prefers domain stem over product name", () => {
    expect(siteLabelForAvatar("ChatGPT", "openai.com", 40).text).toBe("openai");
  });

  it("shortens label for small avatars", () => {
    expect(siteLabelForAvatar("Stripe", "stripe.com", 24).text).toBe("st");
    expect(siteLabelForAvatar("Stripe", "stripe.com", 32).text).toBe("stri");
  });

  it("falls back to product name when domain is missing", () => {
    expect(siteLabelForAvatar("NeuralForge", null, 44).text).toBe("neural");
  });

  it("scales font size down for longer labels", () => {
    const small = siteLabelForAvatar("Example", "example.com", 28);
    const large = siteLabelForAvatar("Example", "example.com", 64);
    expect(small.fontSize).toBeLessThan(large.fontSize);
  });

  it("handles special-character names and large avatars", () => {
    expect(siteLabelForAvatar("!!!", null, 64).text).toBe("!!");
    expect(siteLabelForAvatar("Product", "product.io", 60).text.length).toBeLessThanOrEqual(10);
    expect(siteLabelForAvatar("Stripe", null, 48).text).toBe("stripe");
    expect(siteLabelForAvatar("   ", null, 40).text).toBe("  ");
  });
});
