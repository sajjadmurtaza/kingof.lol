"use client";

import { HiddenGemCard, type HiddenGemProduct } from "@/components/hidden-gem-card";
import { RandomPick, type RandomPickProduct } from "@/components/random-pick";
import { ProductListSection } from "@/components/product-list-section";
import type { PaginatedProductsResult } from "@/domains/leaderboard/queries";
import { discoverContentGrid } from "@/lib/discover-layout";
import {
  DISCOVER_PAGE_COOLDOWN_MS,
  DISCOVER_PAGE_PICK_MS,
} from "@/lib/discovery-pacing";

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
}: {
  random?: RandomPickProduct;
  gem?: HiddenGemProduct;
  locale: string;
  allProducts?: PaginatedProductsResult;
  newProducts?: PaginatedProductsResult;
}) {
  if (!random && !gem && !allProducts && !newProducts) return null;

  return (
    <div className="space-y-10">
      <div className={discoverContentGrid}>
        <div className="space-y-10">
          {random && (
            <RandomPick locale={locale} initial={random} {...discoverPacing} />
          )}

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

          {newProducts && newProducts.total > 0 && (
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

        {gem && (
          <div className="lg:sticky lg:top-24">
            <HiddenGemCard locale={locale} initial={gem} {...discoverPacing} />
          </div>
        )}
      </div>
    </div>
  );
}
