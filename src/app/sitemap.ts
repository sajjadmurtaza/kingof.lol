import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/categories", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/discover", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/most-clicked", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/products", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/how-it-works", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/rules", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/submit", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/by-country", changeFrequency: "daily" as const, priority: 0.7 },
    { path: "/outbid-alternative", changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  let categorySlugs: string[] = [];
  let productSlugs: string[] = [];

  try {
    const { getAllCategories, getTopProducts } = await import("@/domains/leaderboard/queries");
    const [cats, products] = await Promise.all([getAllCategories(), getTopProducts(1000)]);
    categorySlugs = cats.map((c) => c.slug);
    productSlugs = products.filter((p) => p.status === "approved").map((p) => p.slug);
  } catch {
    // DB unavailable during build
  }

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of SUPPORTED_LOCALES) {
    for (const page of staticPages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }

    for (const cat of categorySlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/${cat}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }

    for (const slug of productSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/product/${slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return entries;
}
