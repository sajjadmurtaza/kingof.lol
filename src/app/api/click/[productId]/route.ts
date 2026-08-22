import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { clicks, products } from "@/db/schema";
import { getClientIp, hashIp, isBot, isRateLimited } from "@/domains/clicks/tracking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const userAgent = request.headers.get("user-agent");

  if (isBot(userAgent)) {
    return NextResponse.json({ error: "Bot detected" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  if (isRateLimited(ipHash, productId)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const db = getDb();

  const [product] = await db
    .select({ url: products.url })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const countryCode = request.headers.get("x-vercel-ip-country") || null;

  try {
    await db.insert(clicks).values({
      productId,
      ipHash,
      userAgent,
      countryCode,
    });
  } catch (err) {
    console.error("Click insert failed:", err);
  }

  return NextResponse.redirect(product.url, 302);
}
