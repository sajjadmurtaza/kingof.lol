import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductInfiniteList } from "@/components/product-infinite-list";
import { getProductsPaginated, type PaginatedProductsResult } from "@/domains/leaderboard/queries";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";
import { PRODUCT_PAGE_SIZE } from "@/lib/product-pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("productsTitle"),
    description: t("productsDesc"),
    path: `/${locale}/products`,
    hreflangPath: "/products",
  });
}

export const revalidate = 60;

const emptyPage: PaginatedProductsResult = {
  products: [],
  total: 0,
  page: 1,
  pageSize: PRODUCT_PAGE_SIZE,
  hasMore: false,
};

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initial = emptyPage;
  try {
    initial = await getProductsPaginated({ sort: "bid", page: 1, pageSize: PRODUCT_PAGE_SIZE });
  } catch {
    // DB unavailable
  }

  return (
    <div className="py-12">
      <ProductsList initial={initial} locale={locale} />
    </div>
  );
}

function ProductsList({
  initial,
  locale,
}: {
  initial: Awaited<ReturnType<typeof getProductsPaginated>>;
  locale: string;
}) {
  const t = useTranslations("app.productList");

  return (
    <>
      <div>
        <h1 className="page-title">{t("allProducts")}</h1>
        <p className="mt-1 text-text-muted">{t("allProductsHint")}</p>
      </div>

      <div className="mt-8">
        <ProductInfiniteList
          key={`bid-${initial.total}-${initial.products[0]?.id ?? "empty"}`}
          initial={initial}
          sort="bid"
          locale={locale}
          pageSize={PRODUCT_PAGE_SIZE}
          highlightTop
        />
      </div>
    </>
  );
}
