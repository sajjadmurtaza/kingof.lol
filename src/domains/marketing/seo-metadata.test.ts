import { describe, it, expect } from "vitest";
import {
  buildPageMetadata,
  websiteJsonLd,
  organizationJsonLd,
  breadcrumbJsonLd,
} from "./seo-metadata";

describe("buildPageMetadata", () => {
  it("creates metadata with correct title and description", () => {
    const meta = buildPageMetadata({
      title: "Test Page",
      description: "A test description",
    });
    expect(meta.title).toBe("Test Page");
    expect(meta.description).toBe("A test description");
  });

  it("sets canonical URL from path", () => {
    const meta = buildPageMetadata({
      title: "Test",
      description: "Test",
      path: "/en/categories",
    });
    expect(meta.alternates?.canonical).toBe("https://www.kingof.lol/en/categories");
  });

  it("defaults to root URL when no path", () => {
    const meta = buildPageMetadata({ title: "Test", description: "Test" });
    expect(meta.alternates?.canonical).toBe("https://www.kingof.lol");
  });

  it("sets OG metadata", () => {
    const meta = buildPageMetadata({
      title: "Test Page",
      description: "A test",
      path: "/en",
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe("Test Page");
    expect(og.description).toBe("A test");
    expect(og.url).toBe("https://www.kingof.lol/en");
    expect(og.siteName).toBe("KINGOF");
    expect(og.type).toBe("website");
  });

  it("allows custom OG title/description", () => {
    const meta = buildPageMetadata({
      title: "Page Title",
      description: "Page desc",
      ogTitle: "OG Title",
      ogDescription: "OG desc",
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe("OG Title");
    expect(og.description).toBe("OG desc");
  });

  it("sets Twitter card metadata", () => {
    const meta = buildPageMetadata({
      title: "Test",
      description: "Test desc",
    });
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.title).toBe("Test");
    expect(twitter.description).toBe("Test desc");
  });

  it("sets index/follow by default", () => {
    const meta = buildPageMetadata({ title: "Test", description: "Test" });
    const robots = meta.robots as Record<string, boolean>;
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });

  it("sets noindex when requested", () => {
    const meta = buildPageMetadata({
      title: "Private",
      description: "Private page",
      noIndex: true,
    });
    const robots = meta.robots as Record<string, boolean>;
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it("uses absolute title when requested", () => {
    const meta = buildPageMetadata({
      title: "KINGOF — Full Title",
      description: "Test",
      absoluteTitle: true,
    });
    expect(meta.title).toEqual({ absolute: "KINGOF — Full Title" });
  });

  it("uses regular title by default (for template)", () => {
    const meta = buildPageMetadata({
      title: "Categories",
      description: "Test",
    });
    expect(meta.title).toBe("Categories");
  });

  it("emits hreflang alternates when hreflangPath is provided", () => {
    const meta = buildPageMetadata({
      title: "Categories",
      description: "Test",
      path: "/en/categories",
      hreflangPath: "/categories",
    });
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages.en).toBe("https://www.kingof.lol/en/categories");
    expect(languages["x-default"]).toBe("https://www.kingof.lol/en/categories");
  });
});

describe("websiteJsonLd", () => {
  it("returns valid WebSite schema", () => {
    const data = websiteJsonLd();
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("WebSite");
    expect(data.name).toBe("KINGOF");
    expect(data.url).toBe("https://www.kingof.lol");
    expect(data.description).toBeTruthy();
  });

  it("parses as valid JSON", () => {
    const json = JSON.stringify(websiteJsonLd());
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("organizationJsonLd", () => {
  it("returns valid Organization schema", () => {
    const data = organizationJsonLd();
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("KINGOF");
    expect(data.url).toBe("https://www.kingof.lol");
    expect(data.logo).toBe("https://www.kingof.lol/icon.svg");
  });
});

describe("breadcrumbJsonLd", () => {
  it("creates breadcrumb with correct positions", () => {
    const data = breadcrumbJsonLd([
      { name: "KINGOF", path: "/" },
      { name: "Categories", path: "/en/categories" },
      { name: "AI" },
    ]);

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(3);

    expect(data.itemListElement[0].position).toBe(1);
    expect(data.itemListElement[0].name).toBe("KINGOF");
    expect(data.itemListElement[0].item).toBe("https://www.kingof.lol/");

    expect(data.itemListElement[1].position).toBe(2);
    expect(data.itemListElement[1].name).toBe("Categories");
    expect(data.itemListElement[1].item).toBe("https://www.kingof.lol/en/categories");

    expect(data.itemListElement[2].position).toBe(3);
    expect(data.itemListElement[2].name).toBe("AI");
    expect(data.itemListElement[2].item).toBeUndefined();
  });

  it("parses as valid JSON", () => {
    const data = breadcrumbJsonLd([{ name: "Test", path: "/" }]);
    const json = JSON.stringify(data);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("handles empty breadcrumb", () => {
    const data = breadcrumbJsonLd([]);
    expect(data.itemListElement).toHaveLength(0);
  });
});
