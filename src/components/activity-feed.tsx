"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KingofBubble } from "@/components/kingof-bubble";
import { ProductLogo } from "@/components/product-logo";
import { formatBid } from "@/lib/format";
import type { ActivityItem, TrendingItem } from "@/domains/leaderboard/queries";
import { useTimeAgoLabel } from "@/hooks/use-time-ago-label";

const REFRESH_MS = 45_000;

type HappeningNowPayload = {
  trending: TrendingItem[];
  activity: ActivityItem[];
};

export function ActivityFeed({
  initialTrending,
  initialActivity,
  locale,
  variant = "default",
}: {
  initialTrending: TrendingItem[];
  initialActivity: ActivityItem[];
  locale: string;
  variant?: "default" | "embedded";
}) {
  const t = useTranslations("app.sections");
  const tv = useTranslations("app.voice");
  const timeAgoLabel = useTimeAgoLabel();
  const [trending, setTrending] = useState(initialTrending);
  const [activity, setActivity] = useState(initialActivity);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (silent = true) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) return;
      const data = (await res.json()) as HappeningNowPayload;
      setTrending(data.trending);
      setActivity(data.activity);
    } catch {
      // Keep current data on failure
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => refresh(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  if (trending.length === 0 && activity.length === 0) return null;

  const showTrendingColumn = trending.length > 0 && variant === "default";

  const activityBlock =
    activity.length > 0 ? (
      <div className="activity-float">
        <h3 className="activity-float-title">
          <span className="activity-live-dot" aria-hidden="true" />
          {t("latestActivity")}
        </h3>
        <ul className="activity-list">
          {activity.map((item) => (
            <li key={`${item.slug}-${item.occurredAt}`}>
              <Link
                href={`/product/${item.slug}`}
                locale={locale}
                className="activity-row group"
              >
                <ProductLogo
                  name={item.name}
                  iconUrl={item.iconUrl}
                  ogImageUrl={item.ogImageUrl}
                  domain={item.normalizedDomain}
                  size={variant === "embedded" ? 32 : 28}
                  rounded="md"
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium text-text group-hover:text-gold">
                    {item.name}
                  </span>
                  <span className="text-text-muted">
                    {" "}
                    {t("activityAt", {
                      rank: item.rank,
                      bid: formatBid(item.totalBid),
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-text-dim">
                  {timeAgoLabel(item.occurredAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  if (variant === "embedded") {
    return (
      <div className="flex flex-1 flex-col border-t border-border/30 pt-4">
        {refreshing && (
          <span className="mb-2 text-xs text-text-dim" aria-live="polite">
            {t("updating")}
          </span>
        )}
        {activityBlock}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <KingofBubble message={tv("happeningNow")} variant="ivory" className="max-w-xs" />
        {refreshing && (
          <span className="text-xs text-text-dim" aria-live="polite">
            {t("updating")}
          </span>
        )}
      </div>

      <div className={`grid gap-8 ${showTrendingColumn ? "sm:grid-cols-2" : ""}`}>
        {showTrendingColumn && (
          <div className="activity-float">
            <h3 className="activity-float-title">
              <span aria-hidden="true">🔥</span> {t("trendingNow")}
            </h3>
            <ul className="activity-list">
              {trending.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/product/${item.slug}`}
                    locale={locale}
                    className="activity-row group"
                  >
                    <ProductLogo
                      name={item.name}
                      iconUrl={item.iconUrl}
                      ogImageUrl={item.ogImageUrl}
                      domain={item.normalizedDomain}
                      size={28}
                      rounded="md"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-text group-hover:text-gold">
                      {item.normalizedDomain}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-text-muted">
                      {t("clicksPerHour", { count: item.clicksPerHour.toLocaleString() })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activity.length > 0 && activityBlock}
      </div>

      <Link
        href="/discover"
        locale={locale}
        className="inline-block text-sm text-text-muted transition-colors hover:text-text"
      >
        {t("viewActivity")}
      </Link>
    </section>
  );
}
