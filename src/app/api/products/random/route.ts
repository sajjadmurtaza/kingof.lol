import { and, eq, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exclude = searchParams.get("exclude");

    const db = getDb();

    const conditions = [eq(products.status, "approved")];
    if (exclude) {
      conditions.push(ne(products.slug, exclude));
    }

    const [row] = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        tagline: products.tagline,
        url: products.url,
        iconUrl: products.iconUrl,
        ogImageUrl: products.ogImageUrl,
        normalizedDomain: products.normalizedDomain,
        categorySlug: categories.slug,
        categoryName: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "No products found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Failed to pick random product" }, { status: 500 });
  }
}
