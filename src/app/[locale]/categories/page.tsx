import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { ProductLogo } from "@/components/product-logo";
import { getAllCategories, getCategoryProducts } from "@/domains/leaderboard/queries";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { buildPageMetadata, breadcrumbJsonLd } from "@/domains/marketing/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("categoriesTitle"),
    description: t("categoriesDesc"),
    path: `/${locale}/categories`,
    hreflangPath: "/categories",
  });
}

export const revalidate = 60;

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tCategories = await getTranslations({ locale, namespace: "app.categories" });

  const FALLBACK_CATEGORIES = [
    { id: "ai", slug: "ai", name: "AI & Machine Learning", emoji: "🤖", sortOrder: 1 },
    { id: "fintech", slug: "fintech", name: "Fintech", emoji: "💳", sortOrder: 2 },
    { id: "devtools", slug: "devtools", name: "Developer Tools", emoji: "🛠️", sortOrder: 3 },
    { id: "design", slug: "design", name: "Design", emoji: "🎨", sortOrder: 4 },
    { id: "saas", slug: "saas", name: "SaaS", emoji: "☁️", sortOrder: 5 },
    { id: "health", slug: "health", name: "Health & Wellness", emoji: "💚", sortOrder: 6 },
    { id: "education", slug: "education", name: "Education", emoji: "📚", sortOrder: 7 },
    { id: "ecommerce", slug: "ecommerce", name: "E-Commerce", emoji: "🛒", sortOrder: 8 },
    { id: "social", slug: "social", name: "Social", emoji: "💬", sortOrder: 9 },
    { id: "productivity", slug: "productivity", name: "Productivity", emoji: "⚡", sortOrder: 10 },
    { id: "marketing", slug: "marketing", name: "Marketing", emoji: "📣", sortOrder: 11 },
    { id: "analytics", slug: "analytics", name: "Analytics", emoji: "📊", sortOrder: 12 },
    { id: "security", slug: "security", name: "Security", emoji: "🔒", sortOrder: 13 },
    { id: "nocode", slug: "nocode", name: "No-Code / Low-Code", emoji: "🧩", sortOrder: 14 },
    { id: "gaming", slug: "gaming", name: "Gaming", emoji: "🎮", sortOrder: 15 },
  ];

  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  try {
    categories = await getAllCategories();
  } catch {
    // DB unavailable
  }

  if (categories.length === 0) {
    categories = FALLBACK_CATEGORIES;
  }

  const catsWithKings = await Promise.all(
    categories.map(async (cat) => {
      try {
        const products = await getCategoryProducts(cat.slug, 1);
        return { ...cat, productCount: products.length, king: products[0] ?? null };
      } catch {
        return { ...cat, productCount: 0, king: null };
      }
    }),
  );

  const breadcrumb = breadcrumbJsonLd([
    { name: "KINGOF", path: "/" },
    { name: tCategories("title") },
  ]);

  return (
    <div className="py-12">
      <JsonLd data={breadcrumb} />
      <CategoriesGrid categories={catsWithKings} locale={locale} />
    </div>
  );
}

function CategoriesGrid({
  categories,
  locale,
}: {
  categories: {
    slug: string;
    name: string;
    emoji: string;
    productCount: number;
    king: RankedProduct | null;
  }[];
  locale: string;
}) {
  const t = useTranslations("app.categories");

  return (
    <>
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${cat.slug}`}
            locale={locale}
            className="product-panel group rounded-xl border border-border bg-bg-card p-6 transition-all hover:border-gold/40 hover:shadow-[var(--shadow-gold)]"
          >
            <h2 className="text-xl font-bold text-text group-hover:text-gold transition-colors">
              {cat.emoji} {cat.name}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {cat.productCount > 0
                ? t("products", { count: cat.productCount })
                : t("noProductsYet")}
            </p>
            {cat.king ? (
              <div className="product-panel-inset mt-4 flex items-center gap-2 rounded-lg p-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  {t("king")}
                </span>
                <ProductLogo
                  name={cat.king.name}
                  iconUrl={cat.king.iconUrl}
                  ogImageUrl={cat.king.ogImageUrl}
                  domain={cat.king.normalizedDomain}
                  size={24}
                  rounded="md"
                />
                <span className="truncate text-sm font-medium text-text">{cat.king.name}</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border-bright bg-surface/50 px-3 py-2.5">
                <span className="text-xs text-text-dim">{t("noKingYet")}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
