import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductInfiniteList } from "@/components/product-infinite-list";
import { getProductsPaginated, type PaginatedProductsResult } from "@/domains/leaderboard/queries";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

const NEW_WITHIN_MINUTES = 5;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("newProductsTitle"),
    description: t("newProductsDesc", { minutes: NEW_WITHIN_MINUTES }),
    path: `/${locale}/new`,
    hreflangPath: "/new",
  });
}

export const revalidate = 60;

const emptyPage: PaginatedProductsResult = {
  products: [],
  total: 0,
  page: 1,
  pageSize: 10,
  hasMore: false,
};

export default async function NewProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  let initial = emptyPage;
  try {
    initial = await getProductsPaginated({
      sort: "new",
      page: 1,
      pageSize: 10,
      newWithinMinutes: NEW_WITHIN_MINUTES,
    });
  } catch {
    // DB unavailable
  }

  return (
    <div className="py-12">
      <NewProductsList initial={initial} locale={locale} />
    </div>
  );
}

function NewProductsList({
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
        <h1 className="page-title">{t("newListings")}</h1>
        <p className="mt-1 text-text-muted">
          {t("newListingsHint", { minutes: NEW_WITHIN_MINUTES })}
        </p>
      </div>

      <div className="mt-8">
        <ProductInfiniteList
          initial={initial}
          sort="new"
          locale={locale}
          newWithinMinutes={NEW_WITHIN_MINUTES}
        />
      </div>
    </>
  );
}
