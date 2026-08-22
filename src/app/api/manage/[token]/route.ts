import { createHash } from "node:crypto";
import { eq, sql, and, desc, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, categories, clicks } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
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
      totalBid: products.totalBid,
      categoryId: products.categoryId,
      categoryName: categories.name,
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

  // Calculate category rank
  const ranked = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.categoryId, product.categoryId),
        eq(products.status, "approved"),
        gte(products.totalBid, product.totalBid),
      ),
    )
    .orderBy(desc(products.totalBid));

  const rank = ranked.findIndex((r) => r.id === product.id) + 1;

  return NextResponse.json({
    name: product.name,
    tagline: product.tagline,
    totalBid: product.totalBid,
    clickCount: Number(product.clickCount),
    rank: rank || 1,
    categoryName: product.categoryName,
    slug: product.slug,
  });
}
