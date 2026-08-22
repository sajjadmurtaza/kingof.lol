import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard, ProductCardCompact } from "@/components/product-card";
import { Section } from "@/components/section";
import { Link } from "@/i18n/navigation";
import { getAllCategories, getCategoryProducts } from "@/domains/leaderboard/queries";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { formatBid } from "@/lib/format";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const cats = await getAllCategories();
    return cats.map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  try {
    categories = await getAllCategories();
  } catch {
    notFound();
  }
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();

  let products: RankedProduct[] = [];
  try {
    products = await getCategoryProducts(category);
  } catch {
    // DB unavailable
  }
  const king = products[0];
  const runners = products.slice(1, 3);
  const rest = products.slice(3);

  return (
    <div className="py-12 space-y-12">
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
              <p className="text-xs font-bold uppercase tracking-widest text-gold/70">
                👑 King
              </p>
              <h2 className="mt-2 text-2xl font-black text-gold">{king.name}</h2>
              <p className="mt-1 text-text-muted">{king.tagline}</p>
              <div className="mt-4 flex gap-6 text-sm">
                <span className="font-bold text-gold">{formatBid(king.totalBid)}</span>
                <span className="text-text-muted">{king.clickCount} clicks</span>
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
          <p className="text-text-muted">No products in this category yet.</p>
          <Link
            href="/submit"
            locale={locale}
            className="mt-4 inline-block rounded-lg bg-gold px-6 py-2 text-sm font-bold text-bg"
          >
            Be the first →
          </Link>
        </div>
      )}
    </>
  );
}
