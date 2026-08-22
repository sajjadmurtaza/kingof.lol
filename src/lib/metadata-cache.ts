import { eq } from "drizzle-orm";
import type { ProductPreview } from "@/lib/metadata";
import { tryGetDb } from "@/db";
import { metadataCache } from "@/db/schema";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getCachedMetadata(domain: string): Promise<ProductPreview | null> {
  const db = tryGetDb();
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(metadataCache)
      .where(eq(metadataCache.normalizedDomain, domain))
      .limit(1);

    if (!row) return null;
    const age = Date.now() - row.fetchedAt.getTime();
    if (age > CACHE_TTL_MS) return null;

    return JSON.parse(row.payload) as ProductPreview;
  } catch {
    return null;
  }
}

export async function setCachedMetadata(domain: string, preview: ProductPreview): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  try {
    await db
      .insert(metadataCache)
      .values({
        normalizedDomain: domain,
        payload: JSON.stringify(preview),
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: metadataCache.normalizedDomain,
        set: {
          payload: JSON.stringify(preview),
          fetchedAt: new Date(),
        },
      });
  } catch {
    // Cache is best-effort
  }
}
