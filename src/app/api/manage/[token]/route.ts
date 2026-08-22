import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";
import { getProductRanks } from "@/domains/leaderboard/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = getDb();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [product] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      tagline: products.tagline,
      iconUrl: products.iconUrl,
      ogImageUrl: products.ogImageUrl,
      normalizedDomain: products.normalizedDomain,
      totalBid: products.totalBid,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryEmoji: categories.emoji,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo})`.as(
          "click_count",
        ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.manageTokenHash, tokenHash))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ranks = await getProductRanks(product.id);
  if (!ranks) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: product.name,
    tagline: product.tagline,
    iconUrl: product.iconUrl,
    ogImageUrl: product.ogImageUrl,
    normalizedDomain: product.normalizedDomain,
    totalBid: product.totalBid,
    clickCount: Number(product.clickCount),
    overallRank: ranks.overallRank,
    categoryRank: ranks.categoryRank,
    categoryName: product.categoryName,
    categorySlug: product.categorySlug,
    categoryEmoji: product.categoryEmoji,
    slug: product.slug,
  });
}
