import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { bids, products, webhookEvents } from "@/db/schema";
import { getStripe } from "@/domains/payments/stripe";
import { revalidatePath } from "next/cache";
import { notifySlack } from "@/lib/slack";
import { getSiteUrl } from "@/lib/site-url";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    Sentry.captureMessage("STRIPE_WEBHOOK_SECRET not configured", "fatal");
    notifySlack(
      "🔴 STRIPE_WEBHOOK_SECRET is not configured — all Stripe webhooks are being rejected",
    );
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/webhooks/stripe", failure: "stripe_webhook_failed" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  // Idempotency check
  const [alreadyProcessed] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.stripeEventId, event.id))
    .limit(1);

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { productId, bidId, bidAmount } = session.metadata ?? {};

      if (!productId || !bidId || !bidAmount) {
        Sentry.captureMessage("Missing metadata in checkout session", {
          level: "error",
          tags: { route: "api/webhooks/stripe", failure: "stripe_webhook_failed" },
          extra: { sessionId: session.id },
        });
        notifySlack(
          `🔴 Stripe checkout session ${session.id} is missing metadata — bid could not be applied`,
        );
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      const bidAmountCents = parseInt(bidAmount, 10);

      // 1. Mark bid as confirmed
      await db
        .update(bids)
        .set({
          status: "confirmed",
          stripeSession: session.id,
          stripeEventId: event.id,
        })
        .where(eq(bids.id, bidId));

      // 2. Update product total bid and activate
      await db
        .update(products)
        .set({
          totalBid: sql`${products.totalBid} + ${bidAmountCents}`,
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      // 3. Record webhook event for idempotency
      await db.insert(webhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
      });

      // 4. Revalidate affected pages
      revalidatePath("/[locale]", "page");
      revalidatePath("/[locale]/categories", "page");

      // 5. Check if someone was dethroned and send notification (async, non-blocking)
      checkAndNotifyDethroned(productId).catch((err) => {
        Sentry.captureException(err, {
          tags: { route: "api/webhooks/stripe", failure: "email_send_failed" },
          extra: { productId },
        });
      });

      logger.info("Bid confirmed", { productId, bidId, bidAmountCents });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // The customer has already paid at this point (Stripe confirmed the
    // checkout session) — a failure here means we took money but didn't
    // apply the bid. This is the worst-case failure mode, hence the alert.
    Sentry.captureException(err, {
      tags: { route: "api/webhooks/stripe", failure: "database_transaction_failed" },
      extra: { eventId: event.id, eventType: event.type },
    });
    notifySlack(
      `🔴 Stripe webhook processing failed for event ${event.id} (${event.type}) — payment may have succeeded without the bid being applied`,
    );
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function checkAndNotifyDethroned(productId: string) {
  const db = getDb();

  // Get the product that just got a bid increase
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

  // Find products in the same category that were previously ranked higher
  // but now rank lower (they've been dethroned)
  const { sendDethronedEmail } = await import("@/domains/email/resend");
  const { categories: categoriesTable } = await import("@/db/schema");

  const [category] = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, product.categoryId))
    .limit(1);

  if (!category) return;

  // Find the previous #1 in the category (if this product is now #1)
  const previousKings = await db
    .select({
      id: products.id,
      email: products.email,
      name: products.name,
      manageTokenHash: products.manageTokenHash,
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
        tags: { route: "api/webhooks/stripe", failure: "email_send_failed" },
        extra: { productId: king.id },
      });
    });
  }
}
