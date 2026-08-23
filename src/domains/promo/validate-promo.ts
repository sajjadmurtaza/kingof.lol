import { and, eq, sql } from "drizzle-orm";
import type { getDb } from "@/db";
import { bids, products, promoCodes, promoRedemptions } from "@/db/schema";
import { computeBidCreditCents } from "@/domains/promo/compute-bid-credit";
import {
  PROMO_ALREADY_USED,
  PROMO_EXPIRED,
  PROMO_INCREASE_NOT_ELIGIBLE,
  PROMO_INVALID,
  PROMO_MAX_REDEMPTIONS,
  PROMO_NOT_FIRST_PAID,
} from "@/domains/promo/errors";
import { normalizePromoCode } from "@/domains/promo/normalize-code";

type Db = ReturnType<typeof getDb>;

export type PromoContext = "new_listing" | "bid_increase";

export type PromoApplyResult =
  | {
      ok: true;
      promoCodeId: string;
      code: string;
      amountPaidCents: number;
      bidCreditCents: number;
      multiplier: number;
    }
  | { ok: false; error: string };

export async function emailHasConfirmedPaidBid(db: Db, email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select({ id: bids.id })
    .from(bids)
    .innerJoin(products, eq(bids.productId, products.id))
    .where(and(eq(products.email, normalizedEmail), eq(bids.status, "confirmed")))
    .limit(1);

  return Boolean(row);
}

export async function emailHasRedeemedPromo(
  db: Db,
  promoCodeId: string,
  email: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select({ id: promoRedemptions.id })
    .from(promoRedemptions)
    .where(
      and(
        eq(promoRedemptions.promoCodeId, promoCodeId),
        eq(promoRedemptions.email, normalizedEmail),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function validateAndApplyPromo({
  db,
  rawCode,
  email,
  paymentCents,
  context,
}: {
  db: Db;
  rawCode: string;
  email: string;
  paymentCents: number;
  context: PromoContext;
}): Promise<PromoApplyResult> {
  const code = normalizePromoCode(rawCode);
  if (!code) {
    return { ok: false, error: PROMO_INVALID };
  }

  if (context === "bid_increase") {
    return { ok: false, error: PROMO_INCREASE_NOT_ELIGIBLE };
  }

  if (paymentCents < 500) {
    return { ok: false, error: PROMO_INVALID };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const [promo] = await db
    .select({
      id: promoCodes.id,
      code: promoCodes.code,
      type: promoCodes.type,
      multiplier: promoCodes.multiplier,
      maxRedemptions: promoCodes.maxRedemptions,
      redeemedCount: promoCodes.redeemedCount,
      expiresAt: promoCodes.expiresAt,
      active: promoCodes.active,
    })
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);

  if (!promo || !promo.active) {
    return { ok: false, error: PROMO_INVALID };
  }

  if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: PROMO_EXPIRED };
  }

  if (promo.maxRedemptions != null && promo.redeemedCount >= promo.maxRedemptions) {
    return { ok: false, error: PROMO_MAX_REDEMPTIONS };
  }

  if (await emailHasRedeemedPromo(db, promo.id, normalizedEmail)) {
    return { ok: false, error: PROMO_ALREADY_USED };
  }

  if (await emailHasConfirmedPaidBid(db, normalizedEmail)) {
    return { ok: false, error: PROMO_NOT_FIRST_PAID };
  }

  if (promo.type !== "bid_multiplier") {
    return { ok: false, error: PROMO_INVALID };
  }

  const bidCreditCents = computeBidCreditCents(paymentCents, promo.multiplier);
  if (bidCreditCents < paymentCents) {
    return { ok: false, error: PROMO_INVALID };
  }

  return {
    ok: true,
    promoCodeId: promo.id,
    code: promo.code,
    amountPaidCents: paymentCents,
    bidCreditCents,
    multiplier: promo.multiplier,
  };
}

export async function resolveBidCreditOnConfirm({
  db,
  promoCodeId,
  email,
  amountPaidCents,
  metadataBidCreditCents,
}: {
  db: Db;
  promoCodeId: string | null;
  email: string;
  amountPaidCents: number;
  metadataBidCreditCents: number;
}): Promise<number> {
  if (!promoCodeId) {
    return metadataBidCreditCents;
  }

  const [promo] = await db
    .select({
      id: promoCodes.id,
      type: promoCodes.type,
      multiplier: promoCodes.multiplier,
      maxRedemptions: promoCodes.maxRedemptions,
      redeemedCount: promoCodes.redeemedCount,
      expiresAt: promoCodes.expiresAt,
      active: promoCodes.active,
    })
    .from(promoCodes)
    .where(eq(promoCodes.id, promoCodeId))
    .limit(1);

  if (!promo?.active) {
    return amountPaidCents;
  }

  if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) {
    return amountPaidCents;
  }

  if (promo.maxRedemptions != null && promo.redeemedCount >= promo.maxRedemptions) {
    return amountPaidCents;
  }

  if (await emailHasRedeemedPromo(db, promo.id, email)) {
    return amountPaidCents;
  }

  if (await emailHasConfirmedPaidBid(db, email)) {
    return amountPaidCents;
  }

  if (promo.type !== "bid_multiplier") {
    return amountPaidCents;
  }

  const expectedCredit = computeBidCreditCents(amountPaidCents, promo.multiplier);
  if (expectedCredit !== metadataBidCreditCents) {
    return amountPaidCents;
  }

  return metadataBidCreditCents;
}

export async function recordPromoRedemption({
  db,
  promoCodeId,
  email,
  productId,
  bidId,
  amountPaidCents,
  bidCreditCents,
}: {
  db: Db;
  promoCodeId: string;
  email: string;
  productId: string;
  bidId: string;
  amountPaidCents: number;
  bidCreditCents: number;
}): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  const [inserted] = await db
    .insert(promoRedemptions)
    .values({
      promoCodeId,
      email: normalizedEmail,
      productId,
      bidId,
      amountPaidCents,
      bidCreditCents,
    })
    .onConflictDoNothing()
    .returning({ id: promoRedemptions.id });

  if (!inserted) {
    return false;
  }

  await db
    .update(promoCodes)
    .set({ redeemedCount: sql`${promoCodes.redeemedCount} + 1` })
    .where(eq(promoCodes.id, promoCodeId));

  return true;
}
