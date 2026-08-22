import { and, eq, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";

const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exclude = searchParams.get("exclude");

    const db = getDb();
    const since = sevenDaysAgo();

    const conditions = [eq(products.status, "approved")];
    if (exclude) {
      conditions.push(ne(products.slug, exclude));
    }

    const [row] = await db
      .select({
        slug: products.slug,
        name: products.name,
        tagline: products.tagline,
        iconUrl: products.iconUrl,
        ogImageUrl: products.ogImageUrl,
        normalizedDomain: products.normalizedDomain,
        clickCount:
          sql<number>`(SELECT count(*)::int FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${since})`.as(
            "click_count",
          ),
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(
        sql`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${since}) ASC`,
        sql`RANDOM()`,
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "No products found" }, { status: 404 });
    }

    return NextResponse.json({
      ...row,
      clickCount: Number(row.clickCount),
    });
  } catch {
    return NextResponse.json({ error: "Failed to pick hidden gem" }, { status: 500 });
  }
}
