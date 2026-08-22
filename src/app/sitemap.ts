import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { getAllCategories, getTopProducts } from "@/domains/leaderboard/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingof.lol";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/categories", "/discover", "/most-clicked", "/how-it-works", "/rules", "/submit"];

  let categorySlugs: string[] = [];
  let productSlugs: string[] = [];

  try {
    const [cats, products] = await Promise.all([
      getAllCategories(),
      getTopProducts(500),
    ]);
    categorySlugs = cats.map((c) => c.slug);
    productSlugs = products.map((p) => p.slug);
  } catch {
    // DB unavailable during build — produce minimal sitemap
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const page of pages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.8,
      });
    }

    for (const cat of categorySlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/${cat}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }

    for (const slug of productSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/product/${slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return entries;
}
