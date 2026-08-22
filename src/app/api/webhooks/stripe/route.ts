import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { confirmBidFromCheckoutSession } from "@/domains/payments/confirm-bid";
import { getStripe } from "@/domains/payments/stripe";
import { notifySlack } from "@/lib/slack";

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
      const result = await confirmBidFromCheckoutSession(session, event.id);

      if (!result.ok) {
        Sentry.captureMessage("Webhook checkout session could not be confirmed", {
          level: "error",
          tags: { route: "api/webhooks/stripe", failure: "stripe_webhook_failed" },
          extra: { sessionId: session.id, error: result.error },
        });
        notifySlack(
          `🔴 Stripe checkout session ${session.id} could not be confirmed: ${result.error}`,
        );
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
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
