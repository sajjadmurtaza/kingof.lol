import { describe, it, expect } from "vitest";
import { detectCategory, extractNameFromDomain, resolveRelativeUrl } from "./metadata";

describe("detectCategory", () => {
  it("detects AI category with high confidence", () => {
    const result = detectCategory(
      "AI-powered machine learning model training platform with deep learning and NLP",
    );
    expect(result.slug).toBe("ai");
    expect(result.confidence).toBe("high");
  });

  it("detects fintech category", () => {
    const result = detectCategory("Digital banking and payment platform for crypto trading");
    expect(result.slug).toBe("fintech");
  });

  it("detects devtools category", () => {
    const result = detectCategory("Developer tools for API testing, deployment and CI/CD");
    expect(result.slug).toBe("devtools");
  });

  it("detects design category", () => {
    const result = detectCategory("UI design tool with prototyping and typography features");
    expect(result.slug).toBe("design");
  });

  it("detects SaaS category", () => {
    const result = detectCategory("SaaS project management platform with workflow automation");
    expect(result.slug).toBe("saas");
  });

  it("detects health category", () => {
    const result = detectCategory("Mental health therapy and meditation wellness app");
    expect(result.slug).toBe("health");
  });

  it("falls back to saas with low confidence for unknown text", () => {
    const result = detectCategory("Best restaurant in Tokyo");
    expect(result.slug).toBe("saas");
    expect(result.confidence).toBe("low");
  });

  it("handles empty text", () => {
    const result = detectCategory("");
    expect(result.slug).toBe("saas");
    expect(result.confidence).toBe("low");
  });

  it("is case insensitive", () => {
    const result = detectCategory("AI MACHINE LEARNING DEEP LEARNING NLP");
    expect(result.slug).toBe("ai");
  });
});

describe("extractNameFromDomain", () => {
  it("extracts and capitalizes name from domain", () => {
    expect(extractNameFromDomain("instagram.com")).toBe("Instagram");
    expect(extractNameFromDomain("google.com")).toBe("Google");
    expect(extractNameFromDomain("stripe.com")).toBe("Stripe");
  });

  it("handles subdomains", () => {
    expect(extractNameFromDomain("app.example.com")).toBe("App");
  });
});

describe("resolveRelativeUrl", () => {
  it("resolves absolute URLs as-is", () => {
    expect(resolveRelativeUrl("https://example.com", "https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("resolves protocol-relative URLs", () => {
    expect(resolveRelativeUrl("https://example.com", "//cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png",
    );
  });

  it("resolves relative paths", () => {
    expect(resolveRelativeUrl("https://example.com", "/favicon.ico")).toBe(
      "https://example.com/favicon.ico",
    );
  });

  it("resolves relative paths without leading slash", () => {
    expect(resolveRelativeUrl("https://example.com/page", "assets/logo.png")).toBe(
      "https://example.com/assets/logo.png",
    );
  });

  it("returns empty string for invalid base", () => {
    expect(resolveRelativeUrl("not a url", "path")).toBe("");
  });
});
