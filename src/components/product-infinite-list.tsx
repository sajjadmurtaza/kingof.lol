"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  PaginatedProductsResult,
  ProductListSort,
} from "@/domains/leaderboard/queries";
import { ProductLeaderboardRow } from "@/components/product-leaderboard-row";

const DEFAULT_PAGE_SIZE = 10;

export function ProductInfiniteList({
  initial,
  sort,
  locale,
  newWithinMinutes = 5,
  pageSize,
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
  const resolvedPageSize = pageSize ?? initial.pageSize ?? DEFAULT_PAGE_SIZE;

  const [products, setProducts] = useState(initial.products);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollReadyRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    const nextPage = page + 1;
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
        return [...prev, ...fresh];
      });
      setPage(data.page);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, page, resolvedPageSize, sort, newWithinMinutes]);

  useEffect(() => {
    const markScrolled = () => {
      scrollReadyRef.current = true;
    };

    window.addEventListener("scroll", markScrolled, { passive: true });
    window.addEventListener("wheel", markScrolled, { passive: true });
    window.addEventListener("touchmove", markScrolled, { passive: true });

    return () => {
      window.removeEventListener("scroll", markScrolled);
      window.removeEventListener("wheel", markScrolled);
      window.removeEventListener("touchmove", markScrolled);
    };
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && scrollReadyRef.current) {
          void loadMore();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
        <p className="text-text-muted">
          {sort === "new"
            ? t("emptyNew", { minutes: newWithinMinutes })
            : t("emptyAll")}
        </p>
      </div>
    );
  }

  const rangeEnd = products.length;

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

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-xs text-text-dim sm:text-left">
          {loading
            ? t("loadingMore")
            : hasMore
              ? t("rangeCount", { start: 1, end: rangeEnd, total })
              : t("rangeCount", { start: 1, end: rangeEnd, total })}
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
