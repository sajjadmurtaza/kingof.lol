import { describe, it, expect } from "vitest";
import { parseHtmlMetadata, pickDisplayIcon } from "./metadata-parser";

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
    const parsed = parseHtmlMetadata(
      FIXTURE_INSTAGRAM,
      "https://instagram.com",
      "instagram.com",
    );
    expect(parsed.name).toBe("Instagram");
    expect(parsed.description).toContain("Create an account");
    expect(parsed.faviconUrl).toBe("https://static.cdninstagram.com/favicon.ico");
    expect(parsed.suggestedCategory).toBe("social");
    expect(parsed.categoryConfidence).toBe("high");
  });

  it("resolves relative icon and og image URLs", () => {
    const parsed = parseHtmlMetadata(
      FIXTURE_RELATIVE,
      "https://example.com/page",
      "example.com",
    );
    expect(parsed.faviconUrl).toBe("https://example.com/assets/favicon.png");
    expect(parsed.ogImageUrl).toBe("https://example.com/images/og.jpg");
  });

  it("falls back to domain name and favicon for minimal HTML", () => {
    const parsed = parseHtmlMetadata(FIXTURE_MINIMAL, "https://vercel.com", "vercel.com");
    expect(parsed.name).toBe("Vercel");
    expect(parsed.faviconUrl).toBe("https://vercel.com/favicon.ico");
    expect(parsed.suggestedCategory).toBe("devtools");
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
    expect(pickDisplayIcon({ domain: "stripe.com" })).toBe("https://stripe.com/favicon.ico");
  });
});
