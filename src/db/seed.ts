import { createHash, randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.local.example to .env.local and configure it.");
  process.exit(1);
}

const db = drizzle({ connection: DATABASE_URL, schema });

// ── Categories (canonical — same in dev and production) ─────────────
const CATEGORIES = [
  { slug: "ai", name: "AI & Machine Learning", emoji: "🤖", sortOrder: 1 },
  { slug: "fintech", name: "Fintech", emoji: "💳", sortOrder: 2 },
  { slug: "devtools", name: "Developer Tools", emoji: "🛠️", sortOrder: 3 },
  { slug: "design", name: "Design", emoji: "🎨", sortOrder: 4 },
  { slug: "saas", name: "SaaS", emoji: "☁️", sortOrder: 5 },
  { slug: "health", name: "Health & Wellness", emoji: "💚", sortOrder: 6 },
  { slug: "education", name: "Education", emoji: "📚", sortOrder: 7 },
  { slug: "ecommerce", name: "E-Commerce", emoji: "🛒", sortOrder: 8 },
  { slug: "social", name: "Social", emoji: "💬", sortOrder: 9 },
  { slug: "productivity", name: "Productivity", emoji: "⚡", sortOrder: 10 },
  { slug: "marketing", name: "Marketing", emoji: "📣", sortOrder: 11 },
  { slug: "analytics", name: "Analytics", emoji: "📊", sortOrder: 12 },
  { slug: "security", name: "Security", emoji: "🔒", sortOrder: 13 },
  { slug: "nocode", name: "No-Code / Low-Code", emoji: "🧩", sortOrder: 14 },
  { slug: "gaming", name: "Gaming", emoji: "🎮", sortOrder: 15 },
];

// ── Sample products (dev only — gives you something to look at locally) ──
const SAMPLE_PRODUCTS = [
  {
    slug: "chatgpt",
    name: "ChatGPT",
    tagline: "AI assistant for everything",
    url: "https://chat.openai.com",
    normalizedUrl: "chat.openai.com",
    normalizedDomain: "openai.com",
    categorySlug: "ai",
    totalBid: 15000,
    iconUrl: "https://chat.openai.com/favicon.ico",
  },
  {
    slug: "cursor",
    name: "Cursor",
    tagline: "The AI code editor",
    url: "https://cursor.com",
    normalizedUrl: "cursor.com",
    normalizedDomain: "cursor.com",
    categorySlug: "devtools",
    totalBid: 12000,
    iconUrl: "https://cursor.com/favicon.ico",
  },
  {
    slug: "linear",
    name: "Linear",
    tagline: "Streamlined issue tracking",
    url: "https://linear.app",
    normalizedUrl: "linear.app",
    normalizedDomain: "linear.app",
    categorySlug: "productivity",
    totalBid: 9500,
    iconUrl: "https://linear.app/favicon.ico",
  },
  {
    slug: "stripe",
    name: "Stripe",
    tagline: "Financial infrastructure for the internet",
    url: "https://stripe.com",
    normalizedUrl: "stripe.com",
    normalizedDomain: "stripe.com",
    categorySlug: "fintech",
    totalBid: 18000,
    iconUrl: "https://stripe.com/favicon.ico",
  },
  {
    slug: "figma",
    name: "Figma",
    tagline: "Collaborative design tool",
    url: "https://figma.com",
    normalizedUrl: "figma.com",
    normalizedDomain: "figma.com",
    categorySlug: "design",
    totalBid: 11000,
    iconUrl: "https://figma.com/favicon.ico",
  },
  {
    slug: "vercel",
    name: "Vercel",
    tagline: "Frontend cloud platform",
    url: "https://vercel.com",
    normalizedUrl: "vercel.com",
    normalizedDomain: "vercel.com",
    categorySlug: "devtools",
    totalBid: 8500,
    iconUrl: "https://vercel.com/favicon.ico",
  },
  {
    slug: "notion",
    name: "Notion",
    tagline: "All-in-one workspace",
    url: "https://notion.so",
    normalizedUrl: "notion.so",
    normalizedDomain: "notion.so",
    categorySlug: "productivity",
    totalBid: 7000,
    iconUrl: "https://notion.so/favicon.ico",
  },
  {
    slug: "shopify",
    name: "Shopify",
    tagline: "Commerce platform for everyone",
    url: "https://shopify.com",
    normalizedUrl: "shopify.com",
    normalizedDomain: "shopify.com",
    categorySlug: "ecommerce",
    totalBid: 14000,
    iconUrl: "https://shopify.com/favicon.ico",
  },
  {
    slug: "discord",
    name: "Discord",
    tagline: "Where communities gather",
    url: "https://discord.com",
    normalizedUrl: "discord.com",
    normalizedDomain: "discord.com",
    categorySlug: "social",
    totalBid: 6000,
    iconUrl: "https://discord.com/favicon.ico",
  },
  {
    slug: "resend",
    name: "Resend",
    tagline: "Email for developers",
    url: "https://resend.com",
    normalizedUrl: "resend.com",
    normalizedDomain: "resend.com",
    categorySlug: "devtools",
    totalBid: 5500,
    iconUrl: "https://resend.com/favicon.ico",
  },
  {
    slug: "midjourney",
    name: "Midjourney",
    tagline: "AI image generation",
    url: "https://midjourney.com",
    normalizedUrl: "midjourney.com",
    normalizedDomain: "midjourney.com",
    categorySlug: "ai",
    totalBid: 10000,
    iconUrl: "https://midjourney.com/favicon.ico",
  },
  {
    slug: "duolingo",
    name: "Duolingo",
    tagline: "Learn languages for free",
    url: "https://duolingo.com",
    normalizedUrl: "duolingo.com",
    normalizedDomain: "duolingo.com",
    categorySlug: "education",
    totalBid: 8000,
    iconUrl: "https://duolingo.com/favicon.ico",
  },
  {
    slug: "hubspot",
    name: "HubSpot",
    tagline: "CRM, marketing, and sales platform",
    url: "https://hubspot.com",
    normalizedUrl: "hubspot.com",
    normalizedDomain: "hubspot.com",
    categorySlug: "marketing",
    totalBid: 9000,
    iconUrl: "https://hubspot.com/favicon.ico",
  },
  {
    slug: "plausible",
    name: "Plausible",
    tagline: "Privacy-friendly web analytics",
    url: "https://plausible.io",
    normalizedUrl: "plausible.io",
    normalizedDomain: "plausible.io",
    categorySlug: "analytics",
    totalBid: 4500,
    iconUrl: "https://plausible.io/favicon.ico",
  },
  {
    slug: "1password",
    name: "1Password",
    tagline: "Password manager for teams",
    url: "https://1password.com",
    normalizedUrl: "1password.com",
    normalizedDomain: "1password.com",
    categorySlug: "security",
    totalBid: 7500,
    iconUrl: "https://1password.com/favicon.ico",
  },
];

function makeManageToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

async function seed() {
  console.log("Seeding database...\n");

  // 1. Push schema (creates tables if they don't exist)
  console.log("Creating tables from schema...");
  // Use drizzle-kit push via schema, but since we're running raw here,
  // we create the enum + tables manually via raw SQL if needed.
  // Better: use drizzle-kit push before seeding. We'll just insert data.

  // 2. Upsert categories (idempotent — safe to re-run)
  console.log(`Upserting ${CATEGORIES.length} categories...`);
  for (const cat of CATEGORIES) {
    await db
      .insert(schema.categories)
      .values(cat)
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: { name: cat.name, emoji: cat.emoji, sortOrder: cat.sortOrder },
      });
  }
  console.log("  ✓ Categories done\n");

  // 3. Resolve category slug → id map
  const allCats = await db.select().from(schema.categories);
  const catMap = new Map(allCats.map((c) => [c.slug, c.id]));

  // 4. Upsert sample products (idempotent by normalizedUrl)
  console.log(`Upserting ${SAMPLE_PRODUCTS.length} sample products...`);
  const managementLinks: { name: string; url: string }[] = [];

  for (const p of SAMPLE_PRODUCTS) {
    const categoryId = catMap.get(p.categorySlug);
    if (!categoryId) {
      console.warn(`  ⚠ Skipping "${p.name}" — unknown category "${p.categorySlug}"`);
      continue;
    }

    const { raw, hash } = makeManageToken();

    const [inserted] = await db
      .insert(schema.products)
      .values({
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        url: p.url,
        normalizedUrl: p.normalizedUrl,
        normalizedDomain: p.normalizedDomain,
        categoryId,
        email: "seed@kingof.lol",
        manageTokenHash: hash,
        totalBid: p.totalBid,
        status: "approved",
        iconUrl: p.iconUrl ?? null,
      })
      .onConflictDoUpdate({
        target: schema.products.slug,
        set: {
          name: p.name,
          tagline: p.tagline,
          totalBid: p.totalBid,
          iconUrl: p.iconUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.products.id, slug: schema.products.slug });

    if (inserted) {
      managementLinks.push({
        name: p.name,
        url: `http://localhost:3000/manage/${raw}`,
      });
    }
  }
  console.log("  ✓ Products done\n");

  // 5. Add confirmed bids for each product so totalBid is backed by bid records
  console.log("Creating bid records...");
  const allProducts = await db
    .select({ id: schema.products.id, totalBid: schema.products.totalBid })
    .from(schema.products);

  for (const prod of allProducts) {
    if (prod.totalBid <= 0) continue;

    const existingBids = await db
      .select({ id: schema.bids.id })
      .from(schema.bids)
      .where(sql`${schema.bids.productId} = ${prod.id} AND ${schema.bids.status} = 'confirmed'`)
      .limit(1);

    if (existingBids.length > 0) continue;

    await db.insert(schema.bids).values({
      productId: prod.id,
      amount: prod.totalBid,
      status: "confirmed",
      stripeSession: `seed_${prod.id}`,
    });
  }
  console.log("  ✓ Bids done\n");

  // 6. Print management links
  if (managementLinks.length > 0) {
    console.log("Management links (dev only):");
    console.log("─".repeat(60));
    for (const link of managementLinks) {
      console.log(`  ${link.name.padEnd(20)} ${link.url}`);
    }
    console.log("─".repeat(60));
  }

  console.log("\n✓ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
