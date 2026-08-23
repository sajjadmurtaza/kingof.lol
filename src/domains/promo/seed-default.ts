import { eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { promoCodes } from "@/db/schema";
import { normalizePromoCode } from "@/domains/promo/normalize-code";

type Db = ReturnType<typeof getDb>;

/** Product Hunt launch codes — 2× bid credit on first paid listing. */
export const DEFAULT_LAUNCH_PROMO_CODES = ["PH2X", "PH10OFF"] as const;
export const DEFAULT_LAUNCH_PROMO_MULTIPLIER = 200;

export async function ensureDefaultLaunchPromo(db: Db): Promise<void> {
  for (const rawCode of DEFAULT_LAUNCH_PROMO_CODES) {
    const code = normalizePromoCode(rawCode);

    const [existing] = await db
      .select({ id: promoCodes.id })
      .from(promoCodes)
      .where(eq(promoCodes.code, code))
      .limit(1);

    if (existing) continue;

    await db.insert(promoCodes).values({
      code,
      type: "bid_multiplier",
      multiplier: DEFAULT_LAUNCH_PROMO_MULTIPLIER,
      active: true,
    });
  }
}
