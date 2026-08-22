"use client";

import { HiddenGemCard, type HiddenGemProduct } from "@/components/hidden-gem-card";
import { TopPeriodLeaders } from "@/components/top-period-leaders";
import type { PeriodTopProduct } from "@/domains/leaderboard/queries";
import { DISCOVER_PAGE_COOLDOWN_MS, DISCOVER_PAGE_PICK_MS } from "@/lib/discovery-pacing";

export function DiscoverSidebar({
  weekTop,
  monthTop,
  gem,
  locale,
  gemPacing = false,
}: {
  weekTop: PeriodTopProduct[];
  monthTop: PeriodTopProduct[];
  gem?: HiddenGemProduct;
  locale: string;
  /** Apply discover-page cooldown pacing to the hidden gem card. */
  gemPacing?: boolean;
}) {
  const hasSidebar = weekTop.length > 0 || monthTop.length > 0 || gem != null;
  if (!hasSidebar) return null;

  const pacing = gemPacing
    ? { pickMs: DISCOVER_PAGE_PICK_MS, cooldownMs: DISCOVER_PAGE_COOLDOWN_MS }
    : {};

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      {weekTop.length > 0 && <TopPeriodLeaders period="week" products={weekTop} locale={locale} />}
      {monthTop.length > 0 && (
        <TopPeriodLeaders period="month" products={monthTop} locale={locale} />
      )}
      {gem && <HiddenGemCard locale={locale} initial={gem} {...pacing} />}
    </div>
  );
}
