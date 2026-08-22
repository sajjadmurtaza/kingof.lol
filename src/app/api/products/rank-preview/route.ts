import { eq, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bidCents, categorySlug } = body;

    if (typeof bidCents !== "number" || bidCents < 0) {
      return NextResponse.json({ error: "Invalid bid" }, { status: 400 });
    }

    const db = getDb();

    // Get all approved products sorted by bid
    const allSorted = await db
      .select({ id: products.id, totalBid: products.totalBid })
      .from(products)
      .where(eq(products.status, "approved"))
      .orderBy(desc(products.totalBid));

    const overallRank = allSorted.filter((p) => p.totalBid >= bidCents).length + 1;

    let categoryRank = 0;
    let categoryName = "";
    let categoryEmoji = "";
    const milestones: { label: string; bid: number; rank: number }[] = [];

    if (categorySlug) {
      const [cat] = await db
        .select({ id: categories.id, name: categories.name, emoji: categories.emoji })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (cat) {
        categoryName = cat.name;
        categoryEmoji = cat.emoji;

        const catProducts = await db
          .select({ id: products.id, totalBid: products.totalBid })
          .from(products)
          .where(and(eq(products.categoryId, cat.id), eq(products.status, "approved")))
          .orderBy(desc(products.totalBid));

        categoryRank = catProducts.filter((p) => p.totalBid >= bidCents).length + 1;

        if (catProducts[0]) {
          milestones.push({
            label: `👑 gets #1 in ${categoryName}`,
            bid: catProducts[0].totalBid + 500,
            rank: 1,
          });
        }
        if (catProducts[2]) {
          milestones.push({
            label: `Top 3 in ${categoryName}`,
            bid: catProducts[2].totalBid + 500,
            rank: 3,
          });
        }
        const fifthProduct = catProducts[4];
        if (fifthProduct && categoryRank > 5) {
          milestones.push({
            label: `Top 5 in ${categoryName}`,
            bid: fifthProduct.totalBid + 500,
            rank: 5,
          });
        }
      }
    }

    return NextResponse.json({
      overallRank,
      categoryRank,
      categoryName,
      categoryEmoji,
      totalProducts: allSorted.length,
      milestones: milestones.filter((m) => m.bid > bidCents).sort((a, b) => a.bid - b.bid),
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
