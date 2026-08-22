import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllCategories, getCategoryProducts } from "@/domains/leaderboard/queries";

export const revalidate = 60;

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let categories: Awaited<ReturnType<typeof getAllCategories>> = [];
  try {
    categories = await getAllCategories();
  } catch {
    // DB unavailable
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

  return (
    <div className="py-12">
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
              {cat.name}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {t("products", { count: cat.productCount })}
            </p>
            {cat.king && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface p-2">
                <span className="text-sm text-gold">👑</span>
                <span className="text-sm font-medium text-text">{cat.king.name}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
