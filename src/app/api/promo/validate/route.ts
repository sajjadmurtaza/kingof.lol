import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { normalizePromoCode } from "@/domains/promo/normalize-code";
import { ensureDefaultLaunchPromo } from "@/domains/promo/seed-default";
import { validateAndApplyPromo } from "@/domains/promo/validate-promo";

function isMissingPromoTableError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "42P01"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, email, paymentCents, context } = body;

    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "PROMO_INVALID" }, { status: 400 });
    }

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (typeof paymentCents !== "number" || paymentCents < 500) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const promoContext = context === "bid_increase" ? "bid_increase" : "new_listing";

    const db = getDb();
    await ensureDefaultLaunchPromo(db);

    const result = await validateAndApplyPromo({
      db,
      rawCode: code,
      email,
      paymentCents,
      context: promoContext,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      amountPaidCents: result.amountPaidCents,
      bidCreditCents: result.bidCreditCents,
      multiplier: result.multiplier,
      normalizedCode: normalizePromoCode(code),
    });
  } catch (err) {
    if (isMissingPromoTableError(err)) {
      return NextResponse.json({ error: "PROMO_SETUP_REQUIRED" }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
