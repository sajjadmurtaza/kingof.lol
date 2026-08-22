import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { products, rankingSnapshots } from "@/db/schema";
import { notifySlack } from "@/lib/slack";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await recordSnapshots();
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/cron/snapshots", failure: "cron_snapshots_failed" },
    });
    notifySlack("🟠 Ranking snapshots cron failed");
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

async function recordSnapshots() {
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

  logger.info("Ranking snapshots recorded", { count });
  return NextResponse.json({ success: true, count });
}
