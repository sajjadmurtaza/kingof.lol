"use client";

import { RandomPick, type RandomPickProduct } from "@/components/random-pick";
import { ProductListSection } from "@/components/product-list-section";
import { DiscoverSidebar } from "@/components/discover-sidebar";
import type { HiddenGemProduct } from "@/components/hidden-gem-card";
import type { PaginatedProductsResult, PeriodTopProduct } from "@/domains/leaderboard/queries";
import { discoverContentGrid } from "@/lib/discover-layout";
import { DISCOVER_PAGE_COOLDOWN_MS, DISCOVER_PAGE_PICK_MS } from "@/lib/discovery-pacing";

const discoverPacing = {
  pickMs: DISCOVER_PAGE_PICK_MS,
  cooldownMs: DISCOVER_PAGE_COOLDOWN_MS,
};

export function DiscoverPicks({
  random,
  gem,
  locale,
  allProducts,
  newProducts,
  weekTop,
  monthTop,
}: {
  random?: RandomPickProduct;
  gem?: HiddenGemProduct;
  locale: string;
  allProducts?: PaginatedProductsResult;
  newProducts?: PaginatedProductsResult;
  weekTop?: PeriodTopProduct[];
  monthTop?: PeriodTopProduct[];
}) {
  const resolvedWeekTop = weekTop ?? [];
  const resolvedMonthTop = monthTop ?? [];

  if (
    !random &&
    !gem &&
    !allProducts &&
    !newProducts &&
    resolvedWeekTop.length === 0 &&
    resolvedMonthTop.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-10">
      <div className={discoverContentGrid}>
        <div className="space-y-10">
          {random && <RandomPick locale={locale} initial={random} {...discoverPacing} />}

          {allProducts && (
            <ProductListSection
              initial={allProducts}
              sort="bid"
              locale={locale}
              viewAllHref="/products"
              titleKey="allProducts"
              hintKey="allProductsHint"
              viewAllKey="viewAllProducts"
              flashTopBid
            />
          )}

          {newProducts && (
            <ProductListSection
              initial={newProducts}
              sort="new"
              locale={locale}
              viewAllHref="/new"
              titleKey="newListings"
              hintKey="newListingsHint"
              viewAllKey="viewNewListings"
            />
          )}
        </div>

        <DiscoverSidebar
          weekTop={resolvedWeekTop}
          monthTop={resolvedMonthTop}
          gem={gem}
          locale={locale}
          gemPacing
        />
      </div>
    </div>
  );
}
