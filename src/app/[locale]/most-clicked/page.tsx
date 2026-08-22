import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/components/product-card";
import { getMostClicked } from "@/domains/leaderboard/queries";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("mostClickedTitle"),
    description: t("mostClickedDesc"),
    path: `/${locale}/most-clicked`,
    hreflangPath: "/most-clicked",
  });
}

export const revalidate = 60;

export default async function MostClickedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  let products: Awaited<ReturnType<typeof getMostClicked>> = [];
  try {
    products = await getMostClicked(25);
  } catch {
    // DB unavailable
  }

  return (
    <div className="py-12">
      <MostClickedList products={products} locale={locale} />
    </div>
  );
}

function MostClickedList({
  products,
  locale,
}: {
  products: Awaited<ReturnType<typeof getMostClicked>>;
  locale: string;
}) {
  const t = useTranslations("app.sections");

  return (
    <>
      <div>
        <h1 className="text-3xl font-black">{t("mostClicked")}</h1>
        <p className="mt-1 text-text-muted">Rolling 7-day window</p>
      </div>

      {products.length > 0 ? (
        <div className="mt-8 space-y-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} showCategory locale={locale} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-bg-card p-8 text-center">
          <p className="text-text-muted">
            No click data yet. Products will appear here once they start getting visits.
          </p>
        </div>
      )}
    </>
  );
}
