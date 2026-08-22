import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, randomPicks, categories } from "@/db/schema";

const PICK_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function refreshRandomPicks(limit = 3, categoryId?: string) {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PICK_TTL_MS);

  const conditions = [eq(products.status, "approved"), gte(products.totalBid, 500)];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const eligible = await db
    .select({ id: products.id })
    .from(products)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  if (eligible.length === 0) return [];

  const picks = eligible.map((p) => ({
    productId: p.id,
    categoryId: categoryId ?? null,
    pickedAt: now,
    expiresAt,
  }));

  await db.insert(randomPicks).values(picks);

  return picks;
}

export async function getActiveRandomPicks(limit = 3, categoryId?: string) {
  const db = getDb();
  const now = new Date();

  const conditions = [
    gte(randomPicks.expiresAt, now),
    eq(products.status, "approved"),
  ];

  if (categoryId) {
    conditions.push(eq(randomPicks.categoryId, categoryId));
  }

  const picks = await db
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
    })
    .from(randomPicks)
    .innerJoin(products, eq(randomPicks.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .limit(limit);

  if (picks.length < limit) {
    await refreshRandomPicks(limit, categoryId);
    return getActiveRandomPicks(limit, categoryId);
  }

  return picks;
}
