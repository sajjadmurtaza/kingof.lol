import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { confirmBidFromCheckoutSessionId } from "@/domains/payments/confirm-bid";
import { formatStripeError } from "@/domains/payments/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const result = await confirmBidFromCheckoutSessionId(sessionId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      confirmed: true,
      alreadyConfirmed: result.alreadyConfirmed,
      slug: result.productSlug,
      productName: result.productName,
      bidAmountCents: result.bidAmountCents,
      totalBidCents: result.totalBidCents,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/payments/confirm", failure: "confirm_failed" },
    });
    return NextResponse.json(
      { error: "Confirmation failed", reason: formatStripeError(err) },
      { status: 500 },
    );
  }
}
