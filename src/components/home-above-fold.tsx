"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { Hero } from "@/components/hero";
import { KingSpotlight } from "@/components/king-spotlight";
import { ProductLogo } from "@/components/product-logo";
import { heroContentGrid } from "@/lib/discover-layout";
import type { ActivityItem, RankedProduct, TrendingItem } from "@/domains/leaderboard/queries";

function TrendingStrip({ trending, locale }: { trending: TrendingItem[]; locale: string }) {
  const t = useTranslations("app.sections");

  if (trending.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-4">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-dim">
        🔥 {t("trendingNow")}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {trending.slice(0, 4).map((item) => (
          <Link
            key={item.slug}
            href={`/product/${item.slug}`}
            locale={locale}
            className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-bg-card/40 px-3 py-2.5 transition-colors hover:border-border-bright"
          >
            <ProductLogo
              name={item.name}
              iconUrl={item.iconUrl}
              ogImageUrl={item.ogImageUrl}
              domain={item.normalizedDomain}
              size={32}
              rounded="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{item.name}</p>
              <p className="text-[11px] tabular-nums text-text-dim">
                {t("clicksPerHour", { count: item.clicksPerHour })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HomeAboveFold({
  locale,
  productCount,
  categoryCount,
  clicksToday,
  king,
  runners,
  trending,
  activity,
}: {
  locale: string;
  productCount: number;
  categoryCount: number;
  clicksToday: number;
  king?: RankedProduct;
  runners: RankedProduct[];
  trending: TrendingItem[];
  activity: ActivityItem[];
}) {
  const showActivity = activity.length > 0;

  return (
    <div className="w-full pt-4 pb-5 sm:pt-5 sm:pb-6">
      <div className={`flex flex-col gap-6 ${king ? heroContentGrid : ""}`}>
        {/* Mobile: 1st — Desktop: left column, top */}
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          <Hero
            locale={locale}
            productCount={productCount}
            categoryCount={categoryCount}
            clicksToday={clicksToday}
            embedded
          />
          <TrendingStrip trending={trending} locale={locale} />
        </div>

        {/* Mobile: 2nd (after hero, before activity) — Desktop: right column */}
        {king && (
          <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-stretch">
            <KingSpotlight king={king} runners={runners} locale={locale} variant="sidebar" />
          </div>
        )}

        {/* Mobile: 3rd (after king, before category kings) — Desktop: left column, bottom */}
        {showActivity && (
          <div className="order-3 lg:col-start-1 lg:row-start-2">
            <ActivityFeed
              variant="embedded"
              initialTrending={[]}
              initialActivity={activity.slice(0, 5)}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  );
}
