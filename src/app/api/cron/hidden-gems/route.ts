import { eq, sql, and, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, hiddenGemPicks } from "@/db/schema";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const now = new Date();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const gems = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.status, "approved"),
        lte(products.createdAt, seventyTwoHoursAgo),
      ),
    )
    .orderBy(
      sql`(SELECT count(*) FROM clicks WHERE clicks.product_id = products.id AND clicks.created_at >= now() - interval '7 days') ASC`,
      sql`RANDOM()`,
    )
    .limit(3);

  for (const gem of gems) {
    await db.insert(hiddenGemPicks).values({
      productId: gem.id,
      expiresAt,
    });
  }

  console.log(`Hidden gems selected: ${gems.length} products`);
  return NextResponse.json({ success: true, count: gems.length });
}
