"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type {
  PaginatedProductsResult,
  ProductListSort,
} from "@/domains/leaderboard/queries";
import { ProductInfiniteList } from "@/components/product-infinite-list";

export function ProductListSection({
  initial,
  sort,
  locale,
  viewAllHref,
  titleKey,
  hintKey,
  viewAllKey,
  flashTopBid = false,
}: {
  initial: PaginatedProductsResult;
  sort: ProductListSort;
  locale: string;
  viewAllHref: "/products";
  titleKey: "allProducts";
  hintKey: "allProductsHint";
  viewAllKey: "viewAllProducts";
  flashTopBid?: boolean;
}) {
  const t = useTranslations("app.productList");

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold text-text">{t(titleKey)}</h2>
          <p className="text-sm text-text-muted">{t(hintKey)}</p>
        </div>
        <Link
          href={viewAllHref}
          locale={locale}
          className="shrink-0 text-sm font-medium text-gold transition-colors hover:text-accent-hover"
        >
          {t(viewAllKey)}
        </Link>
      </div>

      <ProductInfiniteList
        initial={initial}
        sort={sort}
        locale={locale}
        highlightTop={flashTopBid}
      />
    </section>
  );
}
