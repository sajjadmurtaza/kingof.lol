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
import { PRODUCT_CLEAR_TABLES } from "./clear-tables";
import { getDb } from "./index";

export function assertClearConfirmed(): void {
  if (process.env.CONFIRM_CLEAR !== "1") {
    console.error(
      "Refusing to clear database without CONFIRM_CLEAR=1.\n" +
        "Example: CONFIRM_CLEAR=1 npm run db:clear",
    );
    process.exit(1);
  }
}

export async function clearProductData() {
  const db = getDb();

  console.log("Clearing product-related tables…");

  const existing = await db.execute<{ tablename: string }>(sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (${sql.join(
        PRODUCT_CLEAR_TABLES.map((table) => sql`${table}`),
        sql`, `,
      )})
  `);

  const toTruncate = existing.rows
    .map((row) => row.tablename)
    .filter((table): table is (typeof PRODUCT_CLEAR_TABLES)[number] =>
      PRODUCT_CLEAR_TABLES.includes(table as (typeof PRODUCT_CLEAR_TABLES)[number]),
    );

  if (toTruncate.length === 0) {
    console.log("No product tables found to truncate.");
  } else {
    await db.execute(sql.raw(`TRUNCATE TABLE ${toTruncate.join(", ")} RESTART IDENTITY CASCADE`));
  }

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

export async function main() {
  assertClearConfirmed();
  await clearProductData();
}

if (!process.env.VITEST) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
