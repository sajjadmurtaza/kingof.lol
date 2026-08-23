import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BUILD_DIR = resolve(process.cwd(), ".next/server/app");
const hasBuild = existsSync(resolve(BUILD_DIR, "en.html"));

function readBuiltPage(path: string): string {
  const file = resolve(BUILD_DIR, path);
  if (!existsSync(file)) return "";
  return readFileSync(file, "utf-8");
}

/** Origin baked into the build (localhost in dev, kingof.lol in production). */
function getBuiltSiteOrigin(): string {
  const sitemapPath = resolve(BUILD_DIR, "sitemap.xml.body");
  if (existsSync(sitemapPath)) {
    const loc = readFileSync(sitemapPath, "utf-8").match(/<loc>(https?:\/\/[^/]+)/)?.[1];
    if (loc) return loc;
  }

  const canonical = readBuiltPage("en.html").match(
    /rel="canonical"\s+href="(https?:\/\/[^/]+)/,
  )?.[1];
  if (canonical) return canonical;

  return "https://kingof.lol";
}

const siteOrigin = getBuiltSiteOrigin();

describe.skipIf(!hasBuild)("SEO rules — built HTML verification", () => {
  describe("Homepage (/en)", () => {
    const html = readBuiltPage("en.html");

    it("has exactly one <title> tag", () => {
      const titles = html.match(/<title[^>]*>[^<]+<\/title>/gi);
      expect(titles?.length).toBe(1);
    });

    it("title contains KINGOF brand", () => {
      expect(html).toContain("KINGOF");
    });

    it("title does not duplicate KINGOF", () => {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch?.[1] ?? "";
      const count = (title.match(/KINGOF/g) ?? []).length;
      expect(count).toBeLessThanOrEqual(1);
    });

    it("has meta description", () => {
      expect(html).toMatch(/name="description"\s+content="[^"]+"/);
    });

    it("has canonical URL using the built site origin", () => {
      expect(html).toMatch(
        new RegExp(`rel="canonical"\\s+href="${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      );
    });

    it("has Open Graph tags", () => {
      expect(html).toMatch(/property="og:title"/);
      expect(html).toMatch(/property="og:description"/);
      expect(html).toMatch(/property="og:url"/);
      expect(html).toMatch(/property="og:site_name"\s+content="KINGOF"/);
      expect(html).toMatch(/property="og:type"\s+content="website"/);
    });

    it("has Open Graph preview image for social shares", () => {
      expect(html).toMatch(/property="og:image"\s+content="[^"]+\/en\/opengraph-image/);
      expect(html).toMatch(/property="og:image:width"\s+content="1200"/);
      expect(html).toMatch(/property="og:image:height"\s+content="630"/);
    });

    it("has Twitter card metadata", () => {
      expect(html).toMatch(/name="twitter:card"\s+content="summary_large_image"/);
      expect(html).toMatch(/name="twitter:title"/);
      expect(html).toMatch(/name="twitter:description"/);
      expect(html).toMatch(/name="twitter:image"\s+content="[^"]+\/en\/twitter-image/);
    });

    it("has favicon link", () => {
      expect(html).toMatch(/rel="icon"/);
    });

    it("has apple-touch-icon link", () => {
      expect(html).toMatch(/rel="apple-touch-icon"/);
    });

    it("has JSON-LD WebSite schema", () => {
      expect(html).toContain('"@type":"WebSite"');
      expect(html).toContain('"name":"KINGOF"');
    });

    it("has JSON-LD Organization schema", () => {
      expect(html).toContain('"@type":"Organization"');
    });

    it("has exactly one H1", () => {
      const h1s = html.match(/<h1[^>]*>/gi);
      expect(h1s?.length).toBe(1);
    });

    it("has robots index follow", () => {
      expect(html).toMatch(/content="index, follow"/);
    });

    it("has lang attribute on html", () => {
      expect(html).toMatch(/<html[^>]+lang="en"/);
    });

    it("brand KINGOF appears as text", () => {
      expect(html).toContain(">KINGOF<");
    });
  });

  describe("Categories page (/en/categories)", () => {
    const html = readBuiltPage("en/categories.html");

    it("has title with KINGOF template", () => {
      expect(html).toContain("Product Categories");
      expect(html).toContain("KINGOF");
    });

    it("has BreadcrumbList JSON-LD", () => {
      expect(html).toContain('"@type":"BreadcrumbList"');
    });

    it("has canonical pointing to categories", () => {
      expect(html).toContain(`href="${siteOrigin}/en/categories"`);
    });
  });

  describe("Submit page (/en/submit)", () => {
    const html = readBuiltPage("en/submit.html");

    it("has title", () => {
      expect(html).toContain("Get on the Board");
    });

    it("is indexable", () => {
      expect(html).toMatch(/content="index, follow"/);
    });

    it("has correct canonical URL", () => {
      expect(html).toContain(`href="${siteOrigin}/en/submit"`);
    });

    it("has OG URL pointing to submit page", () => {
      expect(html).toMatch(
        new RegExp(`og:url.*${siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/en/submit`),
      );
    });
  });

  describe("How It Works page (/en/how-it-works)", () => {
    const html = readBuiltPage("en/how-it-works.html");

    it("has title", () => {
      expect(html).toContain("How It Works");
    });

    it("has exactly one H1", () => {
      const h1s = html.match(/<h1[^>]*>/gi);
      expect(h1s?.length).toBe(1);
    });
  });

  describe("Outbid Alternative page (/en/outbid-alternative)", () => {
    const html = readBuiltPage("en/outbid-alternative.html");

    it("has comparison title", () => {
      expect(html).toContain("KINGOF vs Outbid");
    });

    it("has exactly one H1", () => {
      const h1s = html.match(/<h1[^>]*>/gi);
      expect(h1s?.length).toBe(1);
    });

    it("has internal links to submit and home", () => {
      expect(html).toContain("/en/submit");
      expect(html).toContain("/en");
    });
  });
});

describe.skipIf(!hasBuild)("robots.txt verification", () => {
  const robotsPath = resolve(BUILD_DIR, "robots.txt.body");
  const hasRobots = existsSync(robotsPath);
  const content = hasRobots ? readFileSync(robotsPath, "utf-8") : "";

  it.skipIf(!hasRobots)("allows root", () => {
    expect(content).toContain("Allow: /");
  });

  it.skipIf(!hasRobots)("disallows /api/", () => {
    expect(content).toContain("Disallow: /api/");
  });

  it.skipIf(!hasRobots)("disallows /manage/", () => {
    expect(content).toContain("Disallow: /manage/");
  });

  it.skipIf(!hasRobots)("references sitemap", () => {
    expect(content).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`);
  });

  it.skipIf(!hasRobots)("references canonical host", () => {
    expect(content).toContain(siteOrigin);
  });
});

describe.skipIf(!hasBuild)("sitemap.xml verification", () => {
  const sitemapPath = resolve(BUILD_DIR, "sitemap.xml.body");
  const hasSitemap = existsSync(sitemapPath);
  const content = hasSitemap ? readFileSync(sitemapPath, "utf-8") : "";

  it.skipIf(!hasSitemap)("is valid XML", () => {
    expect(content).toMatch(/^<\?xml/);
    expect(content).toContain("<urlset");
  });

  it.skipIf(!hasSitemap)("contains homepage", () => {
    expect(content).toContain(`${siteOrigin}/en`);
  });

  it.skipIf(!hasSitemap)("contains categories page", () => {
    expect(content).toContain(`${siteOrigin}/en/categories`);
  });

  it.skipIf(!hasSitemap)("contains outbid-alternative", () => {
    expect(content).toContain(`${siteOrigin}/en/outbid-alternative`);
  });

  it.skipIf(!hasSitemap)("does NOT contain /manage/", () => {
    expect(content).not.toContain("/manage/");
  });

  it.skipIf(!hasSitemap)("does NOT contain /api/", () => {
    expect(content).not.toContain("/api/");
  });

  it.skipIf(!hasSitemap)("uses one consistent origin for all <loc> entries", () => {
    const locs = content.match(/<loc>([^<]+)<\/loc>/g) ?? [];
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      const url = loc.replace(/<\/?loc>/g, "");
      expect(url.startsWith(siteOrigin)).toBe(true);
    }
  });

  it.skipIf(!hasSitemap)("has lastmod dates", () => {
    expect(content).toMatch(/<lastmod>/);
  });

  it.skipIf(!hasSitemap)("has priority values", () => {
    expect(content).toMatch(/<priority>/);
  });
});

describe("security — no sensitive data leaks", () => {
  it("manage layout prevents indexing", async () => {
    const { generateMetadata } = await import("@/app/manage/layout");
    const metadata = await generateMetadata();
    const robots = metadata.robots as Record<string, boolean>;
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });
});
