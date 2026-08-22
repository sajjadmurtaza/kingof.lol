import { describe, it, expect, vi } from "vitest";
import { isBot, hashIp, isRateLimited, getClientIp } from "./tracking";

describe("isBot", () => {
  it("detects null user agent as bot", () => {
    expect(isBot(null)).toBe(true);
  });

  it("detects short user agent as bot", () => {
    expect(isBot("curl")).toBe(true);
    expect(isBot("test")).toBe(true);
  });

  it("detects common bots", () => {
    expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("Twitterbot/1.0")).toBe(true);
    expect(isBot("LinkedInBot/1.0")).toBe(true);
    expect(isBot("python-requests/2.28")).toBe(true);
    expect(isBot("curl/7.85.0")).toBe(true);
    expect(isBot("wget/1.21")).toBe(true);
  });

  it("allows real browsers", () => {
    expect(
      isBot(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isBot(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });
});

describe("hashIp", () => {
  it("returns a hex string", () => {
    const hash = hashIp("192.168.1.1");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces same hash for same input", () => {
    expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
  });

  it("produces different hash for different input", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("5.6.7.8"));
  });
});

describe("isRateLimited", () => {
  it("returns false when no DB is available (graceful fallback)", async () => {
    const hash = `test-hash-${Date.now()}`;
    expect(await isRateLimited(hash, "product-1")).toBe(false);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(request)).toBe("9.8.7.6");
  });

  it("falls back to 0.0.0.0", () => {
    const request = new Request("https://example.com");
    expect(getClientIp(request)).toBe("0.0.0.0");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
      },
    });
    expect(getClientIp(request)).toBe("1.1.1.1");
  });
});
