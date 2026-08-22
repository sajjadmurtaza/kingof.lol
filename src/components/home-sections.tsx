"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KingofBubble } from "@/components/kingof-bubble";
import { ProductLogo } from "@/components/product-logo";
import { RandomPick } from "@/components/random-pick";
import { ProductListSection } from "@/components/product-list-section";
import { DiscoverSidebar } from "@/components/discover-sidebar";
import { formatBid, formatClicks } from "@/lib/format";
import { discoverContentGrid } from "@/lib/discover-layout";
import type {
  RankedProduct,
  PaginatedProductsResult,
  PeriodTopProduct,
} from "@/domains/leaderboard/queries";
import type { getCategoryKings } from "@/domains/leaderboard/queries";

export function CategoryKingsSection({
  kings,
  locale,
}: {
  kings: Awaited<ReturnType<typeof getCategoryKings>>;
  locale: string;
}) {
  const t = useTranslations("app.sections");
  const tv = useTranslations("app.voice");
  const tu = useTranslations("app.ui");

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <KingofBubble message={tv("categoryKings")} variant="ivory" className="max-w-xs" />
        <Link
          href="/categories"
          locale={locale}
          className="text-sm text-text-muted transition-colors hover:text-text"
        >
          {t("viewAllCategories")}
        </Link>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {kings.map((ck) => (
          <Link
            key={ck.categorySlug}
            href={`/${ck.categorySlug}`}
            locale={locale}
            className="group space-y-2.5"
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-dim">
              {ck.categoryName}
            </h3>
            <div className="flex items-center gap-3">
              <ProductLogo
                name={ck.king.name}
                iconUrl={ck.king.iconUrl}
                ogImageUrl={ck.king.ogImageUrl}
                domain={ck.king.normalizedDomain}
                size={44}
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-text group-hover:text-gold">
                  {ck.king.name}
                </p>
                <p className="text-xs text-text-dim">
                  {tu("kingOfCategory", { category: ck.categoryName })}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium tabular-nums text-text-muted">
              {formatBid(ck.king.totalBid)}
            </p>
            <p className="text-sm text-text-dim transition-colors group-hover:text-text-muted">
              {t("seeLeaderboard", { category: ck.categoryName })}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function rankAccent(index: number): string {
  if (index === 0) return "text-gold";
  if (index === 1) return "text-silver";
  if (index === 2) return "text-bronze";
  return "text-text-dim";
}

export function MostClickedSection({
  products,
  locale,
}: {
  products: RankedProduct[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  const tv = useTranslations("app.voice");

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <KingofBubble message={tv("mostClicked")} variant="ivory" className="max-w-xs" />
          <p className="text-sm text-text-muted">{t("mostClickedHint")}</p>
        </div>
        <Link
          href="/most-clicked"
          locale={locale}
          className="text-sm font-medium text-gold transition-colors hover:text-accent-hover"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="divide-y divide-border/25">
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            locale={locale}
            className={`group flex items-center gap-4 transition-colors ${
              i === 0 ? "py-4" : "py-3"
            }`}
          >
            <span
              className={`w-9 shrink-0 text-sm font-bold tabular-nums ${rankAccent(i)} ${
                i === 0 ? "text-base" : ""
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <ProductLogo
              name={p.name}
              iconUrl={p.iconUrl}
              ogImageUrl={p.ogImageUrl}
              domain={p.normalizedDomain}
              size={i === 0 ? 36 : 32}
            />
            <span
              className={`min-w-0 flex-1 truncate font-medium text-text group-hover:text-gold ${
                i === 0 ? "text-lg" : "text-base"
              }`}
            >
              {p.name}
            </span>
            <span
              className={`shrink-0 tabular-nums ${
                i === 0 ? "text-base font-semibold text-gold" : "text-sm text-text-muted"
              }`}
            >
              {t("clicksLabel", { count: formatClicks(p.clickCount) })}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function DiscoverSection({
  random,
  gem,
  locale,
  allProducts,
  newProducts,
  weekTop,
  monthTop,
}: {
  random?: RankedProduct;
  gem?: RankedProduct;
  locale: string;
  allProducts?: PaginatedProductsResult;
  newProducts?: PaginatedProductsResult;
  weekTop?: PeriodTopProduct[];
  monthTop?: PeriodTopProduct[];
}) {
  const tv = useTranslations("app.voice");
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
    <section className="space-y-6">
      {(random || gem) && (
        <KingofBubble message={tv("discover")} variant="ivory" className="max-w-sm" />
      )}

      <div className={discoverContentGrid}>
        <div className="space-y-10">
          {random && (
            <RandomPick
              locale={locale}
              initial={{
                slug: random.slug,
                name: random.name,
                tagline: random.tagline,
                iconUrl: random.iconUrl,
                ogImageUrl: random.ogImageUrl,
                normalizedDomain: random.normalizedDomain,
                categoryName: random.categoryName,
              }}
            />
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
          gem={
            gem
              ? {
                  slug: gem.slug,
                  name: gem.name,
                  tagline: gem.tagline,
                  iconUrl: gem.iconUrl,
                  ogImageUrl: gem.ogImageUrl,
                  normalizedDomain: gem.normalizedDomain,
                  clickCount: gem.clickCount,
                }
              : undefined
          }
          locale={locale}
        />
      </div>
    </section>
  );
}

export function EmptyLeaderboard({ locale }: { locale: string }) {
  const t = useTranslations("app");
  const tv = useTranslations("app.voice");

  return (
    <section className="mx-auto max-w-md space-y-6 py-12 text-center">
      <p className="text-3xl" aria-hidden="true">
        👑
      </p>
      <KingofBubble message={tv("emptyBoard")} variant="ivory" tilt="left" className="mx-auto" />
      <Link
        href="/submit"
        locale={locale}
        className="inline-block text-sm font-bold uppercase tracking-wide text-gold transition-colors hover:text-accent-hover"
      >
        {t("sections.takeTheCrown")}
      </Link>
    </section>
  );
}
