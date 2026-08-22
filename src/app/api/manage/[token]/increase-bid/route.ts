import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { products, bids } from "@/db/schema";
import { createBidCheckoutSession } from "@/domains/payments/stripe";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const body = await request.json();
  const amount = body.amount;
  const locale = typeof body.locale === "string" ? body.locale : "en";

  if (typeof amount !== "number" || amount < 500) {
    return NextResponse.json({ error: "Minimum increase is $5" }, { status: 400 });
  }

  const db = getDb();

  const [product] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
    })
    .from(products)
    .where(eq(products.manageTokenHash, tokenHash))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create pending bid
  const [pendingBid] = await db
    .insert(bids)
    .values({
      productId: product.id,
      amount,
      status: "pending",
    })
    .returning({ id: bids.id });

  try {
    const checkoutUrl = await createBidCheckoutSession({
      productName: product.name,
      bidAmountCents: amount,
      productSlug: product.slug,
      productId: product.id,
      bidId: pendingBid.id,
      manageToken: token,
      locale,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json({ error: "Payment setup failed" }, { status: 500 });
  }
}
