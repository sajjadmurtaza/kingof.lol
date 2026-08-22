import { and, count, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories, clicks } from "@/db/schema";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let mostClickedCache: { data: unknown[]; expiresAt: number } | null = null;

export async function getMostClickedProducts(limit = 10) {
  if (mostClickedCache && mostClickedCache.expiresAt > Date.now()) {
    return mostClickedCache.data;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const db = getDb();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      tagline: products.tagline,
      url: products.url,
      totalBid: products.totalBid,
      categoryId: categories.id,
      categorySlug: categories.slug,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      clickCount: count(clicks.id),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(clicks, eq(clicks.productId, products.id))
    .where(and(eq(products.status, "approved"), gte(clicks.createdAt, sevenDaysAgo)))
    .groupBy(products.id, categories.id)
    .orderBy(desc(count(clicks.id)))
    .limit(limit);

  mostClickedCache = { data: rows, expiresAt: Date.now() + CACHE_TTL_MS };
  return rows;
}
