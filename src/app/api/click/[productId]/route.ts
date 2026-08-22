import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { clicks, products } from "@/db/schema";
import { getClientIp, hashIp, isBot, isRateLimited } from "@/domains/clicks/tracking";
import { getRequestCountryCode } from "@/lib/request-country";

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

  if (await isRateLimited(ipHash, productId)) {
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

  const countryCode = getRequestCountryCode(request);

  try {
    await db.insert(clicks).values({
      productId,
      ipHash,
      userAgent,
      countryCode,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/click", failure: "click_redirect_failed" },
      extra: { productId },
    });
  }

  return NextResponse.redirect(product.url, 302);
}
