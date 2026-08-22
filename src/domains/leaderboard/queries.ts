import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  bids,
  categories,
  clicks,
  hiddenGemPicks,
  products,
  randomPicks,
} from "@/db/schema";

export type RankedProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  url: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  totalBid: number;
  status: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  clickCount: number;
  rank: number;
  createdAt: string;
};

export type RisingProduct = RankedProduct & { positionsUp: number };

export type CountryLeaderboard = {
  code: string;
  flag: string;
  name: string;
  top3: { name: string; slug: string; clicks: number }[];
};

const sevenDaysAgo = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const rankedProductFields = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  tagline: products.tagline,
  url: products.url,
  iconUrl: products.iconUrl,
  ogImageUrl: products.ogImageUrl,
  normalizedDomain: products.normalizedDomain,
  totalBid: products.totalBid,
  status: products.status,
  categoryId: categories.id,
  categorySlug: categories.slug,
  categoryName: categories.name,
  categoryEmoji: categories.emoji,
  createdAt: products.createdAt,
} as const;

type RankedQueryRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  url: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  totalBid: number;
  status: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  createdAt: Date | string;
  clickCount: number | string;
};

function asRankedProduct(row: RankedQueryRow, rank: number): RankedProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    url: row.url,
    iconUrl: row.iconUrl,
    ogImageUrl: row.ogImageUrl,
    normalizedDomain: row.normalizedDomain,
    totalBid: row.totalBid,
    status: row.status,
    categoryId: row.categoryId,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    categoryEmoji: row.categoryEmoji,
    clickCount: Number(row.clickCount),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    rank,
  };
}

const COUNTRY_FLAGS: Record<string, { flag: string; name: string }> = {
  US: { flag: "🇺🇸", name: "United States" },
  GB: { flag: "🇬🇧", name: "United Kingdom" },
  DE: { flag: "🇩🇪", name: "Germany" },
  JP: { flag: "🇯🇵", name: "Japan" },
  FR: { flag: "🇫🇷", name: "France" },
  BR: { flag: "🇧🇷", name: "Brazil" },
  IN: { flag: "🇮🇳", name: "India" },
  CA: { flag: "🇨🇦", name: "Canada" },
  AU: { flag: "🇦🇺", name: "Australia" },
  KR: { flag: "🇰🇷", name: "South Korea" },
  NL: { flag: "🇳🇱", name: "Netherlands" },
  SE: { flag: "🇸🇪", name: "Sweden" },
  ES: { flag: "🇪🇸", name: "Spain" },
  IT: { flag: "🇮🇹", name: "Italy" },
  MX: { flag: "🇲🇽", name: "Mexico" },
  SG: { flag: "🇸🇬", name: "Singapore" },
  PL: { flag: "🇵🇱", name: "Poland" },
  CH: { flag: "🇨🇭", name: "Switzerland" },
  AT: { flag: "🇦🇹", name: "Austria" },
  PT: { flag: "🇵🇹", name: "Portugal" },
  ID: { flag: "🇮🇩", name: "Indonesia" },
  TH: { flag: "🇹🇭", name: "Thailand" },
  PH: { flag: "🇵🇭", name: "Philippines" },
  TW: { flag: "🇹🇼", name: "Taiwan" },
  HK: { flag: "🇭🇰", name: "Hong Kong" },
  IL: { flag: "🇮🇱", name: "Israel" },
  AE: { flag: "🇦🇪", name: "United Arab Emirates" },
  SA: { flag: "🇸🇦", name: "Saudi Arabia" },
  TR: { flag: "🇹🇷", name: "Turkey" },
  ZA: { flag: "🇿🇦", name: "South Africa" },
  NG: { flag: "🇳🇬", name: "Nigeria" },
  AR: { flag: "🇦🇷", name: "Argentina" },
  CL: { flag: "🇨🇱", name: "Chile" },
  CO: { flag: "🇨🇴", name: "Colombia" },
  NO: { flag: "🇳🇴", name: "Norway" },
  DK: { flag: "🇩🇰", name: "Denmark" },
  FI: { flag: "🇫🇮", name: "Finland" },
  IE: { flag: "🇮🇪", name: "Ireland" },
  NZ: { flag: "🇳🇿", name: "New Zealand" },
  BE: { flag: "🇧🇪", name: "Belgium" },
  CZ: { flag: "🇨🇿", name: "Czech Republic" },
  RO: { flag: "🇷🇴", name: "Romania" },
  UA: { flag: "🇺🇦", name: "Ukraine" },
  VN: { flag: "🇻🇳", name: "Vietnam" },
  MY: { flag: "🇲🇾", name: "Malaysia" },
  CN: { flag: "🇨🇳", name: "China" },
  RU: { flag: "🇷🇺", name: "Russia" },
  EG: { flag: "🇪🇬", name: "Egypt" },
  KE: { flag: "🇰🇪", name: "Kenya" },
  PK: { flag: "🇵🇰", name: "Pakistan" },
  BD: { flag: "🇧🇩", name: "Bangladesh" },
};

export async function getTopProducts(limit = 3): Promise<RankedProduct[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "approved"))
    .orderBy(desc(products.totalBid), desc(products.createdAt))
    .limit(limit);

  return rows.map((r, i) => asRankedProduct(r, i + 1));
}

export async function getCategoryKings(): Promise<
  { categorySlug: string; categoryName: string; categoryEmoji: string; king: RankedProduct }[]
> {
  const db = getDb();
  const cats = await db
    .select()
    .from(categories)
    .orderBy(categories.sortOrder);

  const result: {
    categorySlug: string;
    categoryName: string;
    categoryEmoji: string;
    king: RankedProduct;
  }[] = [];

  for (const cat of cats) {
    const [king] = await db
      .select({
        ...rankedProductFields,
        clickCount:
          sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
            "click_count",
          ),
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.categoryId, cat.id), eq(products.status, "approved")))
      .orderBy(desc(products.totalBid), desc(products.createdAt))
      .limit(1);

    if (king) {
      result.push({
        categorySlug: cat.slug,
        categoryName: cat.name,
        categoryEmoji: cat.emoji,
        king: asRankedProduct(king, 1),
      });
    }
  }

  return result;
}

export async function getCategoryProducts(
  categorySlug: string,
  limit = 50,
): Promise<RankedProduct[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(categories.slug, categorySlug), eq(products.status, "approved")))
    .orderBy(desc(products.totalBid), desc(products.createdAt))
    .limit(limit);

  return rows.map((r, i) => asRankedProduct(r, i + 1));
}

export async function getProductBySlug(slug: string): Promise<RankedProduct | null> {
  const db = getDb();
  const [row] = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "approved")))
    .limit(1);

  if (!row) return null;

  const rankRows = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        eq(products.categoryId, row.categoryId),
        eq(products.status, "approved"),
        gte(products.totalBid, row.totalBid),
      ),
    )
    .orderBy(desc(products.totalBid), desc(products.createdAt));

  const rank = rankRows.findIndex((r) => r.id === row.id) + 1;
  return asRankedProduct(row, rank);
}

export async function getMostClicked(limit = 10): Promise<RankedProduct[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...rankedProductFields,
      clickCount: count(clicks.id).as("click_count"),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(clicks, eq(clicks.productId, products.id))
    .where(
      and(eq(products.status, "approved"), gte(clicks.createdAt, sevenDaysAgo())),
    )
    .groupBy(
      products.id,
      categories.id,
    )
    .orderBy(desc(count(clicks.id)))
    .limit(limit);

  return rows.map((r, i) => asRankedProduct(r, i + 1));
}

export async function getRandomPicks(limit = 3): Promise<RankedProduct[]> {
  const db = getDb();
  const now = new Date();
  const picks = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(randomPicks)
    .innerJoin(products, eq(randomPicks.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(gte(randomPicks.expiresAt, now), eq(products.status, "approved")),
    )
    .limit(limit);

  if (picks.length > 0) {
    return picks.map((r) => asRankedProduct(r, 0));
  }

  const fallback = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "approved"))
    .orderBy(sql`RANDOM()`)
    .limit(limit);

  return fallback.map((r) => asRankedProduct(r, 0));
}

export async function getHiddenGems(limit = 3): Promise<RankedProduct[]> {
  const db = getDb();
  const now = new Date();

  const picks = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(hiddenGemPicks)
    .innerJoin(products, eq(hiddenGemPicks.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(gte(hiddenGemPicks.expiresAt, now), eq(products.status, "approved")))
    .limit(limit);

  if (picks.length > 0) {
    return picks.map((r) => asRankedProduct(r, 0));
  }

  const fallback = await db
    .select({
      ...rankedProductFields,
      clickCount:
        sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
          "click_count",
        ),
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "approved"))
    .orderBy(sql`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()}) ASC`, sql`RANDOM()`)
    .limit(limit);

  return fallback.map((r) => asRankedProduct(r, 0));
}

export async function getRising(limit = 5): Promise<RisingProduct[]> {
  const db = getDb();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const latest = await db.execute(sql`
    SELECT DISTINCT ON (product_id)
      product_id, overall_rank
    FROM ranking_snapshots
    WHERE recorded_at >= ${oneDayAgo}
    ORDER BY product_id, recorded_at DESC
  `);

  const previous = await db.execute(sql`
    SELECT DISTINCT ON (product_id)
      product_id, overall_rank
    FROM ranking_snapshots
    WHERE recorded_at >= ${twoDaysAgo} AND recorded_at < ${oneDayAgo}
    ORDER BY product_id, recorded_at DESC
  `);

  const prevMap = new Map<string, number>();
  for (const row of previous.rows as any[]) {
    prevMap.set(row.product_id, row.overall_rank);
  }

  const risers: { productId: string; positionsUp: number }[] = [];
  for (const row of latest.rows as any[]) {
    const prev = prevMap.get(row.product_id);
    if (prev && prev > row.overall_rank) {
      risers.push({ productId: row.product_id, positionsUp: prev - row.overall_rank });
    }
  }

  risers.sort((a, b) => b.positionsUp - a.positionsUp);
  const topRisers = risers.slice(0, limit);

  if (topRisers.length === 0) return [];

  const result: RisingProduct[] = [];
  for (const r of topRisers) {
    const [product] = await db
      .select({
        ...rankedProductFields,
        clickCount: sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as("click_count"),
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, r.productId))
      .limit(1);

    if (product) {
      result.push({
        ...asRankedProduct(product, result.length + 1),
        positionsUp: r.positionsUp,
      });
    }
  }

  return result;
}

export async function getCountryLeaderboards(limit = 6): Promise<CountryLeaderboard[]> {
  const db = getDb();

  const topCountries = await db.execute(sql`
    SELECT country_code, count(*) as click_count
    FROM clicks
    WHERE country_code IS NOT NULL
      AND created_at >= ${sevenDaysAgo()}
    GROUP BY country_code
    ORDER BY click_count DESC
    LIMIT ${limit}
  `);

  const result: CountryLeaderboard[] = [];

  for (const row of topCountries.rows as any[]) {
    const code = row.country_code as string;
    const meta = COUNTRY_FLAGS[code];
    if (!meta) continue;

    const top3 = await db.execute(sql`
      SELECT p.name, p.slug, count(*) as clicks
      FROM clicks c
      JOIN products p ON p.id = c.product_id
      WHERE c.country_code = ${code}
        AND c.created_at >= ${sevenDaysAgo()}
        AND p.status = 'approved'
      GROUP BY p.id, p.name, p.slug
      ORDER BY clicks DESC
      LIMIT 3
    `);

    result.push({
      code,
      flag: meta.flag,
      name: meta.name,
      top3: (top3.rows as any[]).map((r) => ({
        name: r.name,
        slug: r.slug,
        clicks: Number(r.clicks),
      })),
    });
  }

  return result;
}

export async function getTopProductsByCountry(
  countryCode: string,
  limit = 3,
): Promise<
  {
    name: string;
    slug: string;
    tagline: string;
    clicks: number;
    categoryName: string;
    categoryEmoji: string;
    iconUrl: string | null;
    ogImageUrl: string | null;
    normalizedDomain: string;
  }[]
> {
  const db = getDb();
  const rows = await db.execute(sql`
    SELECT p.name, p.slug, p.tagline, p.icon_url, p.og_image_url, p.normalized_domain,
           c.name as category_name, c.emoji as category_emoji, count(*) as clicks
    FROM clicks cl
    JOIN products p ON p.id = cl.product_id
    JOIN categories c ON c.id = p.category_id
    WHERE cl.country_code = ${countryCode}
      AND cl.created_at >= ${sevenDaysAgo()}
      AND p.status = 'approved'
    GROUP BY p.id, p.name, p.slug, p.tagline, p.icon_url, p.og_image_url, p.normalized_domain, c.name, c.emoji
    ORDER BY clicks DESC
    LIMIT ${limit}
  `);

  return (rows.rows as any[]).map((r) => ({
    name: r.name,
    slug: r.slug,
    tagline: r.tagline,
    clicks: Number(r.clicks),
    categoryName: r.category_name,
    categoryEmoji: r.category_emoji,
    iconUrl: r.icon_url ?? null,
    ogImageUrl: r.og_image_url ?? null,
    normalizedDomain: r.normalized_domain,
  }));
}

export function getCountryMeta(code: string): { flag: string; name: string } | undefined {
  return COUNTRY_FLAGS[code];
}

export function getAllCountries(): { code: string; flag: string; name: string }[] {
  return Object.entries(COUNTRY_FLAGS)
    .map(([code, meta]) => ({ code, ...meta }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getTodayClickCount(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [result] = await db
    .select({ count: count(clicks.id) })
    .from(clicks)
    .where(gte(clicks.createdAt, today));
  return Number(result?.count ?? 0);
}

export async function getProductCount(): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ count: count(products.id) })
    .from(products)
    .where(eq(products.status, "approved"));
  return Number(result?.count ?? 0);
}

export async function getCategoryCount(): Promise<number> {
  const db = getDb();
  const [result] = await db.select({ count: count(categories.id) }).from(categories);
  return Number(result?.count ?? 0);
}

export type TrendingItem = {
  slug: string;
  name: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  clicksPerHour: number;
};

export type ActivityItem = {
  type: "bid" | "joined";
  slug: string;
  name: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  totalBid: number;
  rank: number;
  categoryName: string;
  occurredAt: string;
};

const oneHourAgo = () => new Date(Date.now() - 60 * 60 * 1000);
const oneDayAgo = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

const globalRankSql = sql<number>`(
  SELECT count(*)::int + 1 FROM products p2
  WHERE p2.status = 'approved' AND p2.total_bid > ${products.totalBid}
)`.as("global_rank");

async function queryTrendingSince(
  since: Date,
  limit: number,
): Promise<TrendingItem[]> {
  const db = getDb();
  const hours = Math.max(1, (Date.now() - since.getTime()) / 3_600_000);

  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      iconUrl: products.iconUrl,
      ogImageUrl: products.ogImageUrl,
      normalizedDomain: products.normalizedDomain,
      clicks: count(clicks.id).as("clicks"),
    })
    .from(clicks)
    .innerJoin(products, eq(clicks.productId, products.id))
    .where(and(eq(products.status, "approved"), gte(clicks.createdAt, since)))
    .groupBy(
      products.id,
      products.slug,
      products.name,
      products.iconUrl,
      products.ogImageUrl,
      products.normalizedDomain,
    )
    .orderBy(desc(count(clicks.id)))
    .limit(limit);

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    iconUrl: r.iconUrl,
    ogImageUrl: r.ogImageUrl,
    normalizedDomain: r.normalizedDomain,
    clicksPerHour: Math.max(1, Math.round(Number(r.clicks) / hours)),
  }));
}

export async function getTrendingNow(limit = 5): Promise<TrendingItem[]> {
  let items = await queryTrendingSince(oneHourAgo(), limit);
  if (items.length === 0) {
    items = await queryTrendingSince(oneDayAgo(), limit);
  }
  if (items.length === 0) {
    const top = await getMostClicked(limit);
    return top.map((p) => ({
      slug: p.slug,
      name: p.name,
      iconUrl: p.iconUrl,
      ogImageUrl: p.ogImageUrl,
      normalizedDomain: p.normalizedDomain,
      clicksPerHour: Math.max(1, Math.round(p.clickCount / (7 * 24))),
    }));
  }
  return items;
}

function toActivityItem(row: {
  type: "bid" | "joined";
  slug: string;
  name: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  totalBid: number;
  rank: number;
  categoryName: string;
  at: Date;
}): ActivityItem {
  return {
    type: row.type,
    slug: row.slug,
    name: row.name,
    iconUrl: row.iconUrl,
    ogImageUrl: row.ogImageUrl,
    normalizedDomain: row.normalizedDomain,
    totalBid: row.totalBid,
    rank: row.rank,
    categoryName: row.categoryName,
    occurredAt: row.at.toISOString(),
  };
}

export async function getRecentActivity(limit = 5): Promise<ActivityItem[]> {
  const db = getDb();
  const activities: {
    type: "bid" | "joined";
    slug: string;
    name: string;
    iconUrl: string | null;
    ogImageUrl: string | null;
    normalizedDomain: string;
    totalBid: number;
    rank: number;
    categoryName: string;
    at: Date;
  }[] = [];

  const recentBids = await db
    .select({
      slug: products.slug,
      name: products.name,
      iconUrl: products.iconUrl,
      ogImageUrl: products.ogImageUrl,
      normalizedDomain: products.normalizedDomain,
      totalBid: products.totalBid,
      rank: globalRankSql,
      categoryName: categories.name,
      createdAt: bids.createdAt,
    })
    .from(bids)
    .innerJoin(products, eq(bids.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(bids.status, "confirmed"), eq(products.status, "approved")))
    .orderBy(desc(bids.createdAt))
    .limit(limit);

  for (const bid of recentBids) {
    activities.push({
      type: "bid",
      slug: bid.slug,
      name: bid.name,
      iconUrl: bid.iconUrl,
      ogImageUrl: bid.ogImageUrl,
      normalizedDomain: bid.normalizedDomain,
      totalBid: bid.totalBid,
      rank: Number(bid.rank),
      categoryName: bid.categoryName,
      at: bid.createdAt,
    });
  }

  const recentProducts = await db
    .select({
      slug: products.slug,
      name: products.name,
      iconUrl: products.iconUrl,
      ogImageUrl: products.ogImageUrl,
      normalizedDomain: products.normalizedDomain,
      totalBid: products.totalBid,
      rank: globalRankSql,
      categoryName: categories.name,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "approved"))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  for (const p of recentProducts) {
    activities.push({
      type: "joined",
      slug: p.slug,
      name: p.name,
      iconUrl: p.iconUrl,
      ogImageUrl: p.ogImageUrl,
      normalizedDomain: p.normalizedDomain,
      totalBid: p.totalBid,
      rank: Number(p.rank),
      categoryName: p.categoryName,
      at: p.createdAt,
    });
  }

  activities.sort((a, b) => b.at.getTime() - a.at.getTime());

  return activities.slice(0, limit).map((a) => toActivityItem(a));
}

export type HappeningNowData = {
  trending: TrendingItem[];
  activity: ActivityItem[];
};

export async function getHappeningNow(
  trendingLimit = 5,
  activityLimit = 5,
): Promise<HappeningNowData> {
  const [trending, activity] = await Promise.all([
    getTrendingNow(trendingLimit),
    getRecentActivity(activityLimit),
  ]);
  return { trending, activity };
}

export type ProductListSort = "bid" | "new";

export type PaginatedProductsResult = {
  products: RankedProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function mapRankedRows(rows: RankedQueryRow[], rankOffset = 0): RankedProduct[] {
  return rows.map((r, i) => asRankedProduct(r, rankOffset + i + 1));
}

export async function getProductsPaginated({
  sort = "bid",
  page = 1,
  pageSize = 10,
  newWithinMinutes = 5,
}: {
  sort?: ProductListSort;
  page?: number;
  pageSize?: number;
  newWithinMinutes?: number;
}): Promise<PaginatedProductsResult> {
  const db = getDb();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  const clickCountSql =
    sql<number>`(SELECT count(*) FROM clicks WHERE clicks.product_id = ${products.id} AND clicks.created_at >= ${sevenDaysAgo()})`.as(
      "click_count",
    );

  if (sort === "new") {
    const since = new Date(Date.now() - newWithinMinutes * 60 * 1000);
    const whereClause = and(eq(products.status, "approved"), gte(products.createdAt, since));

    const [totalRow] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);

    const total = Number(totalRow?.total ?? 0);

    const rows = await db
      .select({
        ...rankedProductFields,
        clickCount: clickCountSql,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .offset(offset)
      .limit(safePageSize);

    const mapped = mapRankedRows(rows, offset);
    return {
      products: mapped,
      total,
      page: safePage,
      pageSize: safePageSize,
      hasMore: offset + mapped.length < total,
    };
  }

  const whereClause = eq(products.status, "approved");

  const [totalRow] = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause);

  const total = Number(totalRow?.total ?? 0);

  const rows = await db
    .select({
      ...rankedProductFields,
      clickCount: clickCountSql,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(products.totalBid), desc(products.createdAt))
    .offset(offset)
    .limit(safePageSize);

  const mapped = mapRankedRows(rows, offset);
  return {
    products: mapped,
    total,
    page: safePage,
    pageSize: safePageSize,
    hasMore: offset + mapped.length < total,
  };
}
