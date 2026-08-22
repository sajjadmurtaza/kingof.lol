import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, randomPicks } from "@/db/schema";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  const picks = await db
    .select({ id: products.id, categoryId: products.categoryId })
    .from(products)
    .where(eq(products.status, "approved"))
    .orderBy(sql`RANDOM()`)
    .limit(3);

  if (picks.length === 0) {
    return NextResponse.json({ success: true, count: 0 });
  }

  for (const pick of picks) {
    await db.insert(randomPicks).values({
      productId: pick.id,
      categoryId: pick.categoryId,
      expiresAt,
    });
  }

  console.log(`Random picks rotated: ${picks.length} products`);
  return NextResponse.json({ success: true, count: picks.length });
}
