import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", ["pending", "approved", "disabled"]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    url: text("url").notNull(),
    normalizedUrl: text("normalized_url").notNull(),
    normalizedDomain: text("normalized_domain").notNull(),
    iconUrl: text("icon_url"),
    ogImageUrl: text("og_image_url"),
    description: text("description"),
    xHandle: text("x_handle"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    email: text("email").notNull(),
    manageTokenHash: text("manage_token_hash").notNull(),
    totalBid: integer("total_bid").notNull().default(0),
    status: productStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_normalized_url_idx").on(table.normalizedUrl),
    index("products_normalized_domain_idx").on(table.normalizedDomain),
    index("products_status_total_bid_idx").on(table.status, table.totalBid),
  ],
);

export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    amount: integer("amount").notNull(),
    status: text("status").notNull().default("pending"),
    stripeSession: text("stripe_session"),
    stripeEventId: text("stripe_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("bids_product_id_status_idx").on(table.productId, table.status)],
);

export const clicks = pgTable(
  "clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    ipHash: text("ip_hash").notNull(),
    userAgent: text("user_agent"),
    countryCode: text("country_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("clicks_product_id_created_at_idx").on(table.productId, table.createdAt),
    index("clicks_country_code_created_at_idx").on(table.countryCode, table.createdAt),
  ],
);

export const randomPicks = pgTable("random_picks", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  categoryId: uuid("category_id").references(() => categories.id),
  pickedAt: timestamp("picked_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  amount: integer("amount").notNull(),
  stripeSession: text("stripe_session"),
});

export const rankingSnapshots = pgTable(
  "ranking_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    overallRank: integer("overall_rank").notNull(),
    categoryRank: integer("category_rank").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ranking_snapshots_product_id_recorded_at_idx").on(table.productId, table.recordedAt),
  ],
);

export const hiddenGemPicks = pgTable("hidden_gem_picks", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  pickedAt: timestamp("picked_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const metadataCache = pgTable("metadata_cache", {
  normalizedDomain: text("normalized_domain").primaryKey(),
  payload: text("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const freeListingClaims = pgTable(
  "free_listing_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ipHash: text("ip_hash").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("free_listing_claims_ip_hash_idx").on(table.ipHash)],
);

// --- Relations ---

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  bids: many(bids),
  clicks: many(clicks),
  rankingSnapshots: many(rankingSnapshots),
  hiddenGemPicks: many(hiddenGemPicks),
  freeListingClaim: one(freeListingClaims, {
    fields: [products.id],
    references: [freeListingClaims.productId],
  }),
}));

export const freeListingClaimsRelations = relations(freeListingClaims, ({ one }) => ({
  product: one(products, {
    fields: [freeListingClaims.productId],
    references: [products.id],
  }),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  product: one(products, {
    fields: [bids.productId],
    references: [products.id],
  }),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  product: one(products, {
    fields: [clicks.productId],
    references: [products.id],
  }),
}));

export const randomPicksRelations = relations(randomPicks, ({ one }) => ({
  product: one(products, {
    fields: [randomPicks.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [randomPicks.categoryId],
    references: [categories.id],
  }),
}));

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  product: one(products, {
    fields: [sponsors.productId],
    references: [products.id],
  }),
}));

export const rankingSnapshotsRelations = relations(rankingSnapshots, ({ one }) => ({
  product: one(products, {
    fields: [rankingSnapshots.productId],
    references: [products.id],
  }),
}));

export const hiddenGemPicksRelations = relations(hiddenGemPicks, ({ one }) => ({
  product: one(products, {
    fields: [hiddenGemPicks.productId],
    references: [products.id],
  }),
}));
