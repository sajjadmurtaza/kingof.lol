import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { bids, products, webhookEvents } from "@/db/schema";
import { getStripe } from "@/domains/payments/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { logger } from "@/lib/logger";

export type ConfirmBidResult =
  | {
      ok: true;
      alreadyConfirmed: boolean;
      productSlug: string;
      productId: string;
      productName: string;
      bidAmountCents: number;
      totalBidCents: number;
    }
  | { ok: false; error: string };

function parseSessionMetadata(session: Stripe.Checkout.Session): {
  productId: string;
  bidId: string;
  bidAmountCents: number;
  productSlug: string;
} | null {
  const { productId, bidId, bidAmount, productSlug } = session.metadata ?? {};
  if (!productId || !bidId || !bidAmount) return null;

  const bidAmountCents = parseInt(bidAmount, 10);
  if (!Number.isFinite(bidAmountCents) || bidAmountCents < 1) return null;

  return {
    productId,
    bidId,
    bidAmountCents,
    productSlug: productSlug ?? "",
  };
}

export async function confirmBidFromCheckoutSessionId(
  sessionId: string,
): Promise<ConfirmBidResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return confirmBidFromCheckoutSession(session, `confirm:${sessionId}`);
}

export async function confirmBidFromCheckoutSession(
  session: Stripe.Checkout.Session,
  idempotencyKey: string,
): Promise<ConfirmBidResult> {
  if (session.payment_status !== "paid") {
    return { ok: false, error: "Payment not completed" };
  }

  const meta = parseSessionMetadata(session);
  if (!meta) {
    return { ok: false, error: "Missing checkout metadata" };
  }

  const db = getDb();

  const [existingEvent] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, idempotencyKey))
    .limit(1);

  const [bid] = await db
    .select({
      id: bids.id,
      status: bids.status,
      productId: bids.productId,
    })
    .from(bids)
    .where(eq(bids.id, meta.bidId))
    .limit(1);

  if (!bid) {
    return { ok: false, error: "Bid not found" };
  }

  const [product] = await db
    .select({
      slug: products.slug,
      name: products.name,
      totalBid: products.totalBid,
    })
    .from(products)
    .where(eq(products.id, meta.productId))
    .limit(1);

  if (!product) {
    return { ok: false, error: "Product not found" };
  }

  if (bid.status === "confirmed" || existingEvent) {
    return {
      ok: true,
      alreadyConfirmed: true,
      productSlug: product.slug,
      productId: meta.productId,
      productName: product.name,
      bidAmountCents: meta.bidAmountCents,
      totalBidCents: product.totalBid,
    };
  }

  await db
    .update(bids)
    .set({
      status: "confirmed",
      stripeSession: session.id,
      stripeEventId: idempotencyKey,
    })
    .where(eq(bids.id, meta.bidId));

  await db
    .update(products)
    .set({
      totalBid: sql`${products.totalBid} + ${meta.bidAmountCents}`,
      status: "approved",
      updatedAt: new Date(),
    })
    .where(eq(products.id, meta.productId));

  await db.insert(webhookEvents).values({
    stripeEventId: idempotencyKey,
    eventType: "checkout.session.completed",
  });

  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/categories", "page");
  revalidatePath("/[locale]/products", "page");

  const [updated] = await db
    .select({ totalBid: products.totalBid, name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.id, meta.productId))
    .limit(1);

  checkAndNotifyDethroned(meta.productId).catch((err) => {
    Sentry.captureException(err, {
      tags: { route: "payments/confirm-bid", failure: "email_send_failed" },
      extra: { productId: meta.productId },
    });
  });

  logger.info("Bid confirmed", {
    productId: meta.productId,
    bidId: meta.bidId,
    bidAmountCents: meta.bidAmountCents,
    idempotencyKey,
  });

  return {
    ok: true,
    alreadyConfirmed: false,
    productSlug: updated?.slug ?? product.slug,
    productId: meta.productId,
    productName: updated?.name ?? product.name,
    bidAmountCents: meta.bidAmountCents,
    totalBidCents: updated?.totalBid ?? product.totalBid + meta.bidAmountCents,
  };
}

async function checkAndNotifyDethroned(productId: string) {
  const db = getDb();

  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      totalBid: products.totalBid,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return;

  const { sendDethronedEmail } = await import("@/domains/email/resend");
  const { categories: categoriesTable } = await import("@/db/schema");

  const [category] = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, product.categoryId))
    .limit(1);

  if (!category) return;

  const previousKings = await db
    .select({
      id: products.id,
      email: products.email,
      name: products.name,
    })
    .from(products)
    .where(
      sql`${products.categoryId} = ${product.categoryId}
        AND ${products.id} != ${product.id}
        AND ${products.status} = 'approved'
        AND ${products.totalBid} < ${product.totalBid}
        AND ${products.totalBid} >= ${product.totalBid} - 10000`,
    )
    .limit(5);

  const siteUrl = getSiteUrl();

  for (const king of previousKings) {
    sendDethronedEmail({
      to: king.email,
      productName: king.name,
      categoryName: category.name,
      newKingName: product.name,
      newRequiredBid: product.totalBid + 500,
      manageUrl: `${siteUrl}/manage/reauth`,
    }).catch((err) => {
      Sentry.captureException(err, {
        tags: { route: "payments/confirm-bid", failure: "email_send_failed" },
        extra: { productId: king.id },
      });
    });
  }
}
