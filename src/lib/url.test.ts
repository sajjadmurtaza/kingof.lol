import { describe, it, expect } from "vitest";
import { normalizeUrl, isPrivateOrBlocked, validateFetchUrl } from "./url";

describe("normalizeUrl", () => {
  it("normalizes a basic URL", () => {
    const result = normalizeUrl("https://example.com");
    expect(result).toEqual({ normalized: "https://example.com", domain: "example.com" });
  });

  it("strips www prefix", () => {
    const result = normalizeUrl("https://www.example.com");
    expect(result).toEqual({ normalized: "https://example.com", domain: "example.com" });
  });

  it("adds https when missing", () => {
    const result = normalizeUrl("example.com");
    expect(result).toEqual({ normalized: "https://example.com", domain: "example.com" });
  });

  it("strips trailing slashes", () => {
    const result = normalizeUrl("https://example.com/");
    expect(result).toEqual({ normalized: "https://example.com", domain: "example.com" });
  });

  it("preserves paths", () => {
    const result = normalizeUrl("https://example.com/about");
    expect(result).toEqual({ normalized: "https://example.com/about", domain: "example.com" });
  });

  it("removes tracking parameters", () => {
    const result = normalizeUrl("https://example.com?utm_source=twitter&utm_medium=social&page=1");
    expect(result).not.toBeNull();
    expect(result!.normalized).toContain("page=1");
    expect(result!.normalized).not.toContain("utm_source");
    expect(result!.normalized).not.toContain("utm_medium");
  });

  it("removes fbclid and gclid", () => {
    const result = normalizeUrl("https://example.com?fbclid=abc123&gclid=xyz");
    expect(result!.normalized).toBe("https://example.com");
  });

  it("returns null for empty input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("  ")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(normalizeUrl("not a url")).toBeNull();
  });

  it("lowercases domain", () => {
    const result = normalizeUrl("https://EXAMPLE.COM");
    expect(result!.domain).toBe("example.com");
  });

  it("handles http protocol", () => {
    const result = normalizeUrl("http://example.com");
    expect(result).not.toBeNull();
    expect(result!.normalized).toBe("https://example.com");
  });
});

describe("isPrivateOrBlocked", () => {
  it("blocks localhost", () => {
    expect(isPrivateOrBlocked("localhost")).toBe(true);
  });

  it("blocks private IP ranges", () => {
    expect(isPrivateOrBlocked("127.0.0.1")).toBe(true);
    expect(isPrivateOrBlocked("10.0.0.1")).toBe(true);
    expect(isPrivateOrBlocked("192.168.1.1")).toBe(true);
    expect(isPrivateOrBlocked("172.16.0.1")).toBe(true);
  });

  it("blocks metadata endpoints", () => {
    expect(isPrivateOrBlocked("169.254.169.254")).toBe(true);
    expect(isPrivateOrBlocked("metadata.google.internal")).toBe(true);
  });

  it("blocks .local and .internal domains", () => {
    expect(isPrivateOrBlocked("myhost.local")).toBe(true);
    expect(isPrivateOrBlocked("server.internal")).toBe(true);
    expect(isPrivateOrBlocked("dev.localhost")).toBe(true);
  });

  it("allows public domains", () => {
    expect(isPrivateOrBlocked("example.com")).toBe(false);
    expect(isPrivateOrBlocked("google.com")).toBe(false);
    expect(isPrivateOrBlocked("kingof.lol")).toBe(false);
  });

  it("allows public IPs", () => {
    expect(isPrivateOrBlocked("8.8.8.8")).toBe(false);
    expect(isPrivateOrBlocked("1.1.1.1")).toBe(false);
  });
});

describe("validateFetchUrl", () => {
  it("validates a good URL", () => {
    const result = validateFetchUrl("https://example.com");
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.domain).toBe("example.com");
    }
  });

  it("rejects empty URL", () => {
    const result = validateFetchUrl("");
    expect("error" in result).toBe(true);
  });

  it("rejects URLs with credentials", () => {
    const result = validateFetchUrl("https://user:pass@example.com");
    expect("error" in result).toBe(true);
  });

  it("rejects private/localhost URLs (SSRF protection)", () => {
    expect("error" in validateFetchUrl("https://localhost")).toBe(true);
    expect("error" in validateFetchUrl("https://127.0.0.1")).toBe(true);
    expect("error" in validateFetchUrl("https://10.0.0.1")).toBe(true);
    expect("error" in validateFetchUrl("https://192.168.1.1")).toBe(true);
    expect("error" in validateFetchUrl("https://metadata.google.internal")).toBe(true);
  });

  it("strips www from domain", () => {
    const result = validateFetchUrl("https://www.example.com");
    if (!("error" in result)) {
      expect(result.domain).toBe("example.com");
    }
  });

  it("adds https when missing", () => {
    const result = validateFetchUrl("example.com");
    expect("error" in result).toBe(false);
  });
});
