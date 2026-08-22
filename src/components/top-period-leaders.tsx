"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductLogo } from "@/components/product-logo";
import type { BidPeriod, PeriodTopProduct } from "@/domains/leaderboard/queries";
import { formatBid } from "@/lib/format";

function rankAccent(index: number): string {
  if (index === 0) return "text-gold";
  if (index === 1) return "text-silver";
  if (index === 2) return "text-bronze";
  return "text-text-dim";
}

const titleKey: Record<BidPeriod, "topThisWeek" | "topThisMonth"> = {
  week: "topThisWeek",
  month: "topThisMonth",
};

const hintKey: Record<BidPeriod, "topThisWeekHint" | "topThisMonthHint"> = {
  week: "topThisWeekHint",
  month: "topThisMonthHint",
};

export function TopPeriodLeaders({
  period,
  products,
  locale,
}: {
  period: BidPeriod;
  products: PeriodTopProduct[];
  locale: string;
}) {
  const t = useTranslations("app.productList");

  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-bg-card">
      <div className="border-b border-border/60 px-4 py-3 sm:px-5">
        <h3 className="font-display text-base font-bold text-text">{t(titleKey[period])}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{t(hintKey[period])}</p>
      </div>

      <div className="divide-y divide-border/40">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            locale={locale}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover sm:px-5"
          >
            <span className={`w-7 shrink-0 text-sm font-bold tabular-nums ${rankAccent(index)}`}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <ProductLogo
              name={product.name}
              iconUrl={product.iconUrl}
              ogImageUrl={product.ogImageUrl}
              domain={product.normalizedDomain}
              size={32}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text group-hover:text-gold">
                {product.name}
              </p>
              <p className="truncate text-xs text-text-dim">{product.normalizedDomain}</p>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-gold">
              {formatBid(product.periodBid)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
