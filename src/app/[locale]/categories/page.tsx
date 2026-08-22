import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { getAllCategories, getCategoryProducts } from "@/domains/leaderboard/queries";
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

  const breadcrumb = breadcrumbJsonLd([{ name: "KINGOF", path: "/" }, { name: "Categories" }]);

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
    king: { name: string } | null;
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
            className="group rounded-xl border border-border bg-bg-card p-6 transition-all hover:border-gold/30 hover:shadow-[var(--shadow-gold)]"
          >
            <h2 className="text-xl font-bold text-text group-hover:text-gold transition-colors">
              {cat.emoji} {cat.name}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {cat.productCount > 0
                ? t("products", { count: cat.productCount })
                : "No products yet"}
            </p>
            {cat.king ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface p-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gold/60">
                  {t("king")}
                </span>
                <span className="text-sm font-medium text-text">{cat.king.name}</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                <span className="text-xs text-text-dim">No king yet — be the first</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
