import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard, ProductCardCompact } from "@/components/product-card";
import { ProductLogo } from "@/components/product-logo";
import { Section } from "@/components/section";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { getAllCategories, getCategoryProducts } from "@/domains/leaderboard/queries";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { formatBid } from "@/lib/format";
import { buildPageMetadata, breadcrumbJsonLd } from "@/domains/marketing/seo-metadata";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const cats = await getAllCategories();
    return cats.map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;

  let catName = category;
  try {
    const cats = await getAllCategories();
    const found = cats.find((c) => c.slug === category);
    if (found) catName = found.name;
  } catch {
    // fall back to slug
  }

  const t = await getTranslations({ locale, namespace: "app.meta" });

  return buildPageMetadata({
    title: t("categoryTitle", { category: catName }),
    description: t("categoryDesc", { category: catName }),
    path: `/${locale}/${category}`,
    hreflangPath: `/${category}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  const KNOWN_CATEGORIES: Record<string, { id: string; slug: string; name: string; emoji: string; sortOrder: number }> = {
    ai: { id: "ai", slug: "ai", name: "AI & Machine Learning", emoji: "🤖", sortOrder: 1 },
    fintech: { id: "fintech", slug: "fintech", name: "Fintech", emoji: "💳", sortOrder: 2 },
    devtools: { id: "devtools", slug: "devtools", name: "Developer Tools", emoji: "🛠️", sortOrder: 3 },
    design: { id: "design", slug: "design", name: "Design", emoji: "🎨", sortOrder: 4 },
    saas: { id: "saas", slug: "saas", name: "SaaS", emoji: "☁️", sortOrder: 5 },
    health: { id: "health", slug: "health", name: "Health & Wellness", emoji: "💚", sortOrder: 6 },
    education: { id: "education", slug: "education", name: "Education", emoji: "📚", sortOrder: 7 },
    ecommerce: { id: "ecommerce", slug: "ecommerce", name: "E-Commerce", emoji: "🛒", sortOrder: 8 },
    social: { id: "social", slug: "social", name: "Social", emoji: "💬", sortOrder: 9 },
    productivity: { id: "productivity", slug: "productivity", name: "Productivity", emoji: "⚡", sortOrder: 10 },
    marketing: { id: "marketing", slug: "marketing", name: "Marketing", emoji: "📣", sortOrder: 11 },
    analytics: { id: "analytics", slug: "analytics", name: "Analytics", emoji: "📊", sortOrder: 12 },
    security: { id: "security", slug: "security", name: "Security", emoji: "🔒", sortOrder: 13 },
    nocode: { id: "nocode", slug: "nocode", name: "No-Code / Low-Code", emoji: "🧩", sortOrder: 14 },
    gaming: { id: "gaming", slug: "gaming", name: "Gaming", emoji: "🎮", sortOrder: 15 },
  };

  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  try {
    categories = await getAllCategories();
  } catch {
    // DB unavailable — use known categories
  }

  let cat = categories.find((c) => c.slug === category);
  if (!cat) {
    const fallback = KNOWN_CATEGORIES[category];
    if (!fallback) notFound();
    cat = fallback;
  }

  let products: RankedProduct[] = [];
  try {
    products = await getCategoryProducts(category);
  } catch {
    // DB unavailable
  }
  const king = products[0];
  const runners = products.slice(1, 3);
  const rest = products.slice(3);

  const tUi = await getTranslations({ locale, namespace: "app.ui" });

  const breadcrumb = breadcrumbJsonLd([
    { name: tUi("siteName"), path: "/" },
    { name: tUi("categoriesLabel"), path: `/${locale}/categories` },
    { name: cat.name },
  ]);

  return (
    <div className="py-12 space-y-12">
      <JsonLd data={breadcrumb} />
      <div>
        <h1 className="text-3xl font-black">{cat.name}</h1>
        <CategoryProducts king={king} runners={runners} rest={rest} locale={locale} />
      </div>
    </div>
  );
}

function CategoryProducts({
  king,
  runners,
  rest,
  locale,
}: {
  king: RankedProduct | undefined;
  runners: RankedProduct[];
  rest: RankedProduct[];
  locale: string;
}) {
  const t = useTranslations("app");
  const tCat = useTranslations("app.categories");

  return (
    <>
      {king && (
        <div className="mt-8">
          <Section title={t("categories.king")}>
            <Link
              href={`/product/${king.slug}`}
              locale={locale}
              className="group block rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-6 shadow-[var(--shadow-gold)] transition-all hover:border-gold/50"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gold/70">{tCat("king")}</p>
              <div className="mt-3 flex items-center gap-4">
                <ProductLogo
                  name={king.name}
                  iconUrl={king.iconUrl}
                  ogImageUrl={king.ogImageUrl}
                  domain={king.normalizedDomain}
                  size={56}
                />
                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-gold">{king.name}</h2>
                  <p className="mt-1 text-text-muted">{king.tagline}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-6 text-sm">
                <span className="font-bold text-gold">{formatBid(king.totalBid)}</span>
                <span className="text-text-muted">
                  {t("sections.clicksLabel", { count: king.clickCount })}
                </span>
              </div>
            </Link>
          </Section>
        </div>
      )}

      {runners.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {runners.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider">
            {t("categories.viewAll")}
          </h3>
          {rest.map((p) => (
            <ProductCardCompact key={p.id} product={p} locale={locale} />
          ))}
        </div>
      )}

      {!king && (
        <div className="mt-8 rounded-xl border border-border bg-bg-card p-8 text-center">
          <p className="text-text-muted">{t("ui.noProductsInCategory")}</p>
          <Link
            href="/submit"
            locale={locale}
            className="mt-4 inline-block rounded-lg bg-gold px-6 py-2 text-sm font-bold text-on-gold"
          >
            {t("ui.beFirst")}
          </Link>
        </div>
      )}
    </>
  );
}
