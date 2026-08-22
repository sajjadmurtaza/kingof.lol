import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { freeListingClaims } from "@/db/schema";

export const FREE_LISTING_LIMIT_ERROR = "FREE_LISTING_LIMIT";

export function shouldEnforceFreeListingLimit(clientIp: string): boolean {
  if (clientIp === "0.0.0.0" && process.env.NODE_ENV !== "production") {
    return false;
  }
  return true;
}

export async function hasFreeListingFromIp(ipHash: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: freeListingClaims.id })
    .from(freeListingClaims)
    .where(eq(freeListingClaims.ipHash, ipHash))
    .limit(1);

  return Boolean(row);
}

export async function recordFreeListingClaim(ipHash: string, productId: string): Promise<void> {
  const db = getDb();
  await db.insert(freeListingClaims).values({ ipHash, productId });
}
