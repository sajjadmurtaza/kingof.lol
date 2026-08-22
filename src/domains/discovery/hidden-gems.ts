import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories, clicks } from "@/db/schema";

const GEMS_CACHE_KEY = "hidden-gems";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let gemsCache: { data: unknown[]; expiresAt: number } | null = null;

export async function getHiddenGems(limit = 3) {
  if (gemsCache && gemsCache.expiresAt > Date.now()) {
    return gemsCache.data;
  }

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const db = getDb();
  const gems = await db
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
      clickCount: sql<number>`(
        SELECT count(*) FROM clicks
        WHERE clicks.product_id = ${products.id}
        AND clicks.created_at >= ${sevenDaysAgo}
      )`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.status, "approved"),
        sql`${products.createdAt} <= ${seventyTwoHoursAgo}`,
      ),
    )
    .orderBy(
      sql`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo}) ASC`,
      sql`RANDOM()`,
    )
    .limit(limit);

  gemsCache = { data: gems, expiresAt: Date.now() + CACHE_TTL_MS };
  return gems;
}
