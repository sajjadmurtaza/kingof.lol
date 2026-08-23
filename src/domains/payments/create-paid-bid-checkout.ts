import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import type { getDb } from "@/db";
import { bids } from "@/db/schema";
import { createBidCheckoutSession, formatStripeError } from "@/domains/payments/stripe";
import type { DataFastAttribution } from "@/lib/datafast-attribution";

type Db = ReturnType<typeof getDb>;

export async function createPaidBidCheckout({
  db,
  product,
  paymentCents,
  bidCreditCents,
  email,
  locale,
  manageToken,
  promoCodeId,
  datafastAttribution,
}: {
  db: Db;
  product: { id: string; slug: string; name: string };
  paymentCents: number;
  bidCreditCents: number;
  email: string;
  locale: string;
  manageToken?: string;
  promoCodeId?: string;
  datafastAttribution?: DataFastAttribution | null;
}): Promise<{ checkoutUrl: string } | { error: string; reason?: string }> {
  const [pendingBid] = await db
    .insert(bids)
    .values({
      productId: product.id,
      amount: paymentCents,
      bidCreditCents,
      promoCodeId: promoCodeId ?? null,
      status: "pending",
    })
    .returning({ id: bids.id });

  try {
    const checkoutUrl = await createBidCheckoutSession({
      productName: product.name,
      paymentCents,
      bidCreditCents,
      productSlug: product.slug,
      productId: product.id,
      bidId: pendingBid.id,
      email,
      locale,
      manageToken,
      promoCodeId,
      datafastAttribution,
    });

    return { checkoutUrl };
  } catch (err) {
    try {
      await db.delete(bids).where(eq(bids.id, pendingBid.id));
    } catch (cleanupErr) {
      Sentry.captureException(cleanupErr, {
        tags: { route: "payments/create-paid-bid-checkout", failure: "bid_cleanup_failed" },
        extra: { productId: product.id, bidId: pendingBid.id },
      });
    }

    return { error: "Payment setup failed", reason: formatStripeError(err) };
  }
}
