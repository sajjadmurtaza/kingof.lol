import type { getDb } from "@/db";
import { normalizePromoCode } from "@/domains/promo/normalize-code";
import { validateAndApplyPromo } from "@/domains/promo/validate-promo";

type Db = ReturnType<typeof getDb>;

export type ResolvedBidPayment =
  | {
      ok: true;
      paymentCents: number;
      bidCreditCents: number;
      promoCodeId?: string;
    }
  | { ok: false; error: string };

export async function resolveBidPayment({
  db,
  paymentCents,
  email,
  promoCode,
  context,
}: {
  db: Db;
  paymentCents: number;
  email: string;
  promoCode?: string | null;
  context: "new_listing" | "bid_increase";
}): Promise<ResolvedBidPayment> {
  const normalizedCode = promoCode ? normalizePromoCode(promoCode) : "";

  if (!normalizedCode) {
    return {
      ok: true,
      paymentCents,
      bidCreditCents: paymentCents,
    };
  }

  const promo = await validateAndApplyPromo({
    db,
    rawCode: normalizedCode,
    email,
    paymentCents,
    context,
  });

  if (!promo.ok) {
    return { ok: false, error: promo.error };
  }

  return {
    ok: true,
    paymentCents: promo.amountPaidCents,
    bidCreditCents: promo.bidCreditCents,
    promoCodeId: promo.promoCodeId,
  };
}
