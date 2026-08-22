import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, rankingSnapshots } from "@/db/schema";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  const allProducts = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      totalBid: products.totalBid,
    })
    .from(products)
    .where(eq(products.status, "approved"))
    .orderBy(desc(products.totalBid));

  const overallRanks = new Map<string, number>();
  allProducts.forEach((p, i) => overallRanks.set(p.id, i + 1));

  const byCategory = new Map<string, typeof allProducts>();
  for (const p of allProducts) {
    const existing = byCategory.get(p.categoryId) ?? [];
    existing.push(p);
    byCategory.set(p.categoryId, existing);
  }

  const categoryRanks = new Map<string, number>();
  for (const [, catProducts] of byCategory) {
    catProducts
      .sort((a, b) => b.totalBid - a.totalBid)
      .forEach((p, i) => categoryRanks.set(p.id, i + 1));
  }

  let count = 0;
  for (const p of allProducts) {
    await db.insert(rankingSnapshots).values({
      productId: p.id,
      overallRank: overallRanks.get(p.id) ?? 999,
      categoryRank: categoryRanks.get(p.id) ?? 999,
    });
    count++;
  }

  console.log(`Ranking snapshots recorded: ${count} products`);
  return NextResponse.json({ success: true, count });
}
