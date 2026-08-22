import { drizzle } from "drizzle-orm/node-postgres";
import { categories } from "./schema";

const CATEGORIES = [
  { slug: "ai", name: "AI & Machine Learning", emoji: "🤖", sortOrder: 1 },
  { slug: "fintech", name: "Fintech", emoji: "💰", sortOrder: 2 },
  { slug: "devtools", name: "Developer Tools", emoji: "🛠️", sortOrder: 3 },
  { slug: "design", name: "Design", emoji: "🎨", sortOrder: 4 },
  { slug: "saas", name: "SaaS", emoji: "☁️", sortOrder: 5 },
  { slug: "health", name: "Health & Wellness", emoji: "🏥", sortOrder: 6 },
  { slug: "education", name: "Education", emoji: "📚", sortOrder: 7 },
  { slug: "ecommerce", name: "E-Commerce", emoji: "🛒", sortOrder: 8 },
  { slug: "social", name: "Social", emoji: "💬", sortOrder: 9 },
  { slug: "productivity", name: "Productivity", emoji: "⚡", sortOrder: 10 },
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const db = drizzle({ connection: url });

  console.log("Seeding categories...");
  for (const cat of CATEGORIES) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: cat.name, emoji: cat.emoji, sortOrder: cat.sortOrder },
      });
    console.log(`  ✓ ${cat.name}`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
