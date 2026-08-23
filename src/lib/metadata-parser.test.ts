import { describe, it, expect } from "vitest";
import { parseHtmlMetadata, pickDisplayIcon, googleFaviconUrl } from "./metadata-parser";

const FIXTURE_OG = `<!DOCTYPE html>
<html>
<head>
  <title>Stripe | Financial Infrastructure</title>
  <meta property="og:site_name" content="Stripe" />
  <meta property="og:title" content="Stripe — Online payments" />
  <meta property="og:description" content="Financial infrastructure for the internet." />
  <meta property="og:image" content="https://stripe.com/og.png" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
</head>
<body></body>
</html>`;

const FIXTURE_INSTAGRAM = `<!DOCTYPE html>
<html>
<head>
  <title>Instagram • Photos and videos</title>
  <meta property="og:title" content="Instagram" />
  <meta name="description" content="Create an account or log in to Instagram." />
  <link rel="icon" href="//static.cdninstagram.com/favicon.ico" />
</head>
<body></body>
</html>`;

const FIXTURE_RELATIVE = `<!DOCTYPE html>
<html>
<head>
  <title>Example</title>
  <link rel="shortcut icon" href="assets/favicon.png" />
  <meta property="og:image" content="/images/og.jpg" />
</head>
<body></body>
</html>`;

const FIXTURE_MINIMAL = `<!DOCTYPE html>
<html><head><title></title></head><body></body></html>`;

describe("parseHtmlMetadata", () => {
  it("extracts og fields, icons, and category from rich HTML", () => {
    const parsed = parseHtmlMetadata(FIXTURE_OG, "https://stripe.com", "stripe.com");
    expect(parsed.name).toBe("Stripe");
    expect(parsed.description).toContain("Financial infrastructure");
    expect(parsed.faviconUrl).toBe("https://stripe.com/favicon.ico");
    expect(parsed.appleTouchIconUrl).toBe("https://stripe.com/apple-touch-icon.png");
    expect(parsed.logoUrl).toBe("https://stripe.com/apple-touch-icon.png");
    expect(parsed.ogImageUrl).toBe("https://stripe.com/og.png");
    expect(parsed.suggestedCategory).toBe("fintech");
    expect(parsed.categoryConfidence).toBe("high");
  });

  it("cleans Instagram title and categorizes as social", () => {
    const parsed = parseHtmlMetadata(FIXTURE_INSTAGRAM, "https://instagram.com", "instagram.com");
    expect(parsed.name).toBe("Instagram");
    expect(parsed.description).toContain("Create an account");
    expect(parsed.faviconUrl).toBe("https://static.cdninstagram.com/favicon.ico");
    expect(parsed.suggestedCategory).toBe("social");
    expect(parsed.categoryConfidence).toBe("high");
  });

  it("resolves relative icon and og image URLs", () => {
    const parsed = parseHtmlMetadata(FIXTURE_RELATIVE, "https://example.com/page", "example.com");
    expect(parsed.faviconUrl).toBe("https://example.com/assets/favicon.png");
    expect(parsed.ogImageUrl).toBe("https://example.com/images/og.jpg");
  });

  it("falls back to domain name and favicon for minimal HTML", () => {
    const parsed = parseHtmlMetadata(FIXTURE_MINIMAL, "https://vercel.com", "vercel.com");
    expect(parsed.name).toBe("Vercel");
    expect(parsed.faviconUrl).toBe("https://vercel.com/favicon.ico");
    expect(parsed.suggestedCategory).toBe("devtools");
  });

  it("keeps the shorter side when cleaning pipe-separated titles", () => {
    const html = `<!DOCTYPE html><html><head><title>Very Long Product Marketing Name | Short</title></head><body></body></html>`;
    const parsed = parseHtmlMetadata(html, "https://example.com", "example.com");
    expect(parsed.name).toBe("Short");
  });

  it("keeps the left side when it is shorter than the right", () => {
    const html = `<!DOCTYPE html><html><head><title>Short | Much longer marketing title</title></head><body></body></html>`;
    const parsed = parseHtmlMetadata(html, "https://example.com", "example.com");
    expect(parsed.name).toBe("Short");
  });

  it("uses alternate meta tag order and long descriptions", () => {
    const longDesc = "A".repeat(170);
    const html = `<!DOCTYPE html><html><head>
      <meta content="Alt OG Site" property="og:site_name" />
      <meta content="Alt OG Title" property="og:title" />
      <meta content="${longDesc}" property="og:description" />
      <meta content="Twitter Title" name="twitter:title" />
      <meta content="Twitter Desc" name="twitter:description" />
      <meta content="App Name" name="application-name" />
      <meta content="https://example.com/og.png" property="og:image" />
      <meta content="https://example.com/og.png" name="twitter:image" />
      <link rel="mask-icon" href="/mask.svg" sizes="32x32" />
      <link href="/skip.ico" />
      <title>Fallback title</title>
    </head><body></body></html>`;

    const parsed = parseHtmlMetadata(html, "https://example.com/page", "example.com");
    expect(parsed.name).toBe("Alt OG Site");
    expect(parsed.metadataSource.description).toBe("og:description");
    expect(parsed.description?.endsWith("...")).toBe(true);
    expect(parsed.metadataSource.name).toBe("og:site_name");
  });

  it("falls back through title sources and favicon-only logos", () => {
    const html = `<!DOCTYPE html><html><head>
      <meta content="Twitter Title" name="twitter:title" />
      <meta content="Twitter Desc" name="twitter:description" />
      <meta content="Fallback description" name="Description" />
      <link rel="icon" href="/small.ico" sizes="16x16" />
      <link rel="icon" href="/large.ico" sizes="64x64" />
      <title>Title Tag Only</title>
    </head><body></body></html>`;

    const parsed = parseHtmlMetadata(html, "https://example.com", "example.com");
    expect(parsed.name).toBe("Twitter Title");
    expect(parsed.metadataSource.name).toBe("twitter:title");
    expect(parsed.metadataSource.description).toBe("twitter:description");
    expect(parsed.metadataSource.logo).toBe("favicon");
    expect(parsed.faviconUrl).toBe("https://example.com/large.ico");
  });

  it("uses application-name and skips malformed icon links", () => {
    const html = `<!DOCTYPE html><html><head>
      <meta content="My App" name="application-name" />
      <meta content="Capitalized description" name="Description" />
      <link rel="" href="/skip-empty-rel.ico" />
      <link rel="icon" href="/icon.ico" sizes="invalid-size" />
      <link href="/missing-rel.ico" />
      <link rel="stylesheet" href="/ignore.css" />
      <link rel="icon" href="" />
      <link rel="icon">
      <title></title>
    </head><body></body></html>`;

    const parsed = parseHtmlMetadata(html, "https://example.com", "example.com");
    expect(parsed.metadataSource.name).toBe("application-name");
    expect(parsed.name).toBe("My App");
    expect(parsed.description).toBe("Capitalized description");
  });

  it("uses favicon logo source when apple touch icon is absent", () => {
    const html = `<!DOCTYPE html><html><head>
      <link rel="shortcut icon" href="/only-favicon.ico" />
      <title>Example</title>
    </head><body></body></html>`;

    const parsed = parseHtmlMetadata(html, "https://example.com", "example.com");
    expect(parsed.appleTouchIconUrl).toBeNull();
    expect(parsed.metadataSource.logo).toBe("favicon");
  });

  it("returns null from pickDisplayIcon when no icon sources exist", () => {
    expect(pickDisplayIcon({})).toBeNull();
  });
});

describe("pickDisplayIcon", () => {
  it("prefers iconUrl over domain fallback", () => {
    expect(
      pickDisplayIcon({
        iconUrl: "https://cdn.example.com/logo.png",
        domain: "example.com",
      }),
    ).toBe("https://cdn.example.com/logo.png");
  });

  it("falls back to domain favicon", () => {
    expect(pickDisplayIcon({ domain: "stripe.com" })).toBe(googleFaviconUrl("stripe.com"));
  });

  it("prefers apple-touch-icon over stored icon url", () => {
    expect(
      pickDisplayIcon({
        iconUrl: "https://github.com/favicon.ico",
        appleTouchIconUrl: "https://github.com/apple-touch-icon.png",
        domain: "github.com",
      }),
    ).toBe("https://github.com/apple-touch-icon.png");
  });

  it("uses a sharper google favicon instead of low-res .ico when domain is known", () => {
    expect(
      pickDisplayIcon({
        iconUrl: "https://github.com/favicon.ico",
        domain: "github.com",
      }),
    ).toBe(googleFaviconUrl("github.com"));
  });

  it("detects favicon-like malformed urls without throwing", () => {
    expect(
      pickDisplayIcon({
        iconUrl: ":::favicon.ico",
        domain: "example.com",
      }),
    ).toBe(googleFaviconUrl("example.com"));
  });
});
