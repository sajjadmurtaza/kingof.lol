"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  PaginatedProductsResult,
  ProductListSort,
} from "@/domains/leaderboard/queries";
import { ProductLeaderboardRow } from "@/components/product-leaderboard-row";

const DEFAULT_PAGE_SIZE = 10;
const SCROLL_ROOT_MARGIN_PX = 120;

function isNearViewport(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  return rect.top <= window.innerHeight + SCROLL_ROOT_MARGIN_PX;
}

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
  const pageRef = useRef(initial.page);
  const hasMoreRef = useRef(initial.hasMore);
  const sentinelRef = useRef<HTMLDivElement>(null);
  /** Blocks auto-load on mount when the sentinel is already on screen. */
  const autoLoadEnabledRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

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
        return [...prev, ...fresh];
      });
      pageRef.current = data.page;
      hasMoreRef.current = data.hasMore;
      setPage(data.page);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [sort, resolvedPageSize, newWithinMinutes]);

  const maybeAutoLoad = useCallback(() => {
    if (!autoLoadEnabledRef.current || !hasMoreRef.current || loadingRef.current) return;

    const node = sentinelRef.current;
    if (node && isNearViewport(node)) {
      void loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (node && !isNearViewport(node)) {
      autoLoadEnabledRef.current = true;
    }
  }, []);

  useEffect(() => {
    const engage = () => {
      autoLoadEnabledRef.current = true;
      maybeAutoLoad();
    };

    window.addEventListener("scroll", engage, { passive: true });
    window.addEventListener("wheel", engage, { passive: true });
    window.addEventListener("touchmove", engage, { passive: true });

    return () => {
      window.removeEventListener("scroll", engage);
      window.removeEventListener("wheel", engage);
      window.removeEventListener("touchmove", engage);
    };
  }, [maybeAutoLoad]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          maybeAutoLoad();
        }
      },
      { rootMargin: `${SCROLL_ROOT_MARGIN_PX}px` },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, maybeAutoLoad]);

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
