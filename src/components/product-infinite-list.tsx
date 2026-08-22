"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PaginatedProductsResult, ProductListSort } from "@/domains/leaderboard/queries";
import { ProductLeaderboardRow } from "@/components/product-leaderboard-row";
import { NEW_LISTINGS_WITHIN_MINUTES, PRODUCT_PAGE_SIZE } from "@/lib/product-pagination";

/** Always expose at most one page on first paint, even if SSR sent a larger batch. */
function clampToPage(result: PaginatedProductsResult, pageSize: number): PaginatedProductsResult {
  const products = result.products.slice(0, pageSize);
  return {
    ...result,
    products,
    page: 1,
    pageSize,
    hasMore: products.length < result.total,
  };
}

export function ProductInfiniteList({
  initial,
  sort,
  locale,
  newWithinMinutes = NEW_LISTINGS_WITHIN_MINUTES,
  pageSize = PRODUCT_PAGE_SIZE,
  highlightTop = false,
}: {
  initial: PaginatedProductsResult;
  sort: ProductListSort;
  locale: string;
  newWithinMinutes?: number;
  pageSize?: number;
  highlightTop?: boolean;
}) {
  const t = useTranslations("app.productList");
  const resolvedPageSize = pageSize;

  const firstPage = clampToPage(initial, resolvedPageSize);

  const [products, setProducts] = useState(firstPage.products);
  const [total, setTotal] = useState(firstPage.total);
  const [loading, setLoading] = useState(false);

  const loadingRef = useRef(false);
  const pageRef = useRef(firstPage.page);
  const totalRef = useRef(firstPage.total);
  const productsCountRef = useRef(firstPage.products.length);

  const hasMore = products.length < total;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || productsCountRef.current >= totalRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    const nextPage = pageRef.current + 1;
    const params = new URLSearchParams({
      sort,
      page: String(nextPage),
      limit: String(resolvedPageSize),
    });
    if (sort === "new") {
      params.set("minutes", String(newWithinMinutes));
    }

    try {
      const res = await fetch(`/api/products/list?${params.toString()}`);
      if (!res.ok) return;

      const data: PaginatedProductsResult = await res.json();
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = data.products.filter((p) => !seen.has(p.id));
        const next = [...prev, ...fresh];
        productsCountRef.current = next.length;
        return next;
      });
      pageRef.current = data.page;
      totalRef.current = data.total;
      setTotal(data.total);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [sort, resolvedPageSize, newWithinMinutes]);

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
        <p className="text-text-muted">
          {sort === "new" ? t("emptyNew", { minutes: newWithinMinutes }) : t("emptyAll")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="leaderboard-panel overflow-hidden rounded-xl border border-border bg-bg-card p-1 sm:p-1.5">
        <div className="flex flex-col gap-1">
          {products.map((product) => (
            <ProductLeaderboardRow
              key={product.id}
              product={product}
              locale={locale}
              highlightTop={highlightTop}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-text-dim sm:text-left">
          {loading ? t("loadingMore") : t("rangeCount", { start: 1, end: products.length, total })}
        </p>

        {hasMore && (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text transition-colors hover:border-border-bright hover:bg-surface-hover disabled:opacity-50"
          >
            {loading ? t("loadingMore") : t("loadMore")}
          </button>
        )}
      </div>
    </div>
  );
}
