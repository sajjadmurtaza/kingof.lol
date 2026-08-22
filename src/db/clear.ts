/**
 * Wipe all listings and payment data. Keeps categories (run db:seed if missing).
 *
 * Usage (production Neon — paste URL from Vercel):
 *   DATABASE_URL="postgresql://..." CONFIRM_CLEAR=1 npm run db:clear
 *
 * Local:
 *   CONFIRM_CLEAR=1 npm run db:clear
 */
import { sql } from "drizzle-orm";
import { getDb } from "./index";

async function main() {
  if (process.env.CONFIRM_CLEAR !== "1") {
    console.error(
      "Refusing to clear database without CONFIRM_CLEAR=1.\n" +
        "Example: CONFIRM_CLEAR=1 npm run db:clear",
    );
    process.exit(1);
  }

  const db = getDb();

  console.log("Clearing product-related tables…");

  await db.execute(sql`
    TRUNCATE TABLE
      bids,
      clicks,
      random_picks,
      sponsors,
      ranking_snapshots,
      hidden_gem_picks,
      products
    RESTART IDENTITY CASCADE
  `);

  await db.execute(sql`DELETE FROM webhook_events`);
  await db.execute(sql`DELETE FROM metadata_cache`);

  const productCount = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM products`,
  );
  const bidCount = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM bids`,
  );
  const categoryCount = await db.execute<{ count: string }>(
    sql`SELECT count(*)::text AS count FROM categories`,
  );

  console.log("Done.");
  console.log(`  products:   ${productCount.rows[0]?.count ?? "0"}`);
  console.log(`  bids:       ${bidCount.rows[0]?.count ?? "0"}`);
  console.log(`  categories: ${categoryCount.rows[0]?.count ?? "0"} (kept)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
