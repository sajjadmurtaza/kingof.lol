"use client";

import { useTranslations } from "next-intl";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { useTimeAgoLabel } from "@/hooks/use-time-ago-label";
import { Link } from "@/i18n/navigation";
import { formatBid, formatClicks } from "@/lib/format";
import { ProductLogo } from "./product-logo";

function rankClass(rank: number, isKing: boolean): string {
  if (isKing) return "text-gold";
  if (rank === 2) return "text-silver";
  if (rank === 3) return "text-bronze";
  return "text-text-dim";
}

function rowAccentClass(rank: number, highlightTop: boolean): string {
  if (!highlightTop || rank > 3) return "";
  if (rank === 1) return "leaderboard-row--gold rank-row-live";
  if (rank === 2) return "leaderboard-row--silver rank-row-live";
  if (rank === 3) return "leaderboard-row--bronze rank-row-live";
  return "";
}

export function ProductLeaderboardRow({
  product,
  locale,
  highlightTop = false,
}: {
  product: RankedProduct;
  locale: string;
  highlightTop?: boolean;
}) {
  const t = useTranslations("app.sections");
  const tp = useTranslations("app.productList");
  const timeAgo = useTimeAgoLabel();
  const isKing = product.rank === 1;
  const listedAt = product.createdAt ? timeAgo(product.createdAt) : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      locale={locale}
      className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover sm:gap-4 sm:px-4 sm:py-3 ${rowAccentClass(product.rank, highlightTop)}`}
    >
      <span
        className={`flex w-9 shrink-0 items-center justify-end gap-1 pt-1 text-right text-sm font-semibold tabular-nums ${rankClass(product.rank, isKing)}`}
      >
        {highlightTop && product.rank <= 3 ? (
          <span
            className={`rank-live-dot ${
              product.rank === 1
                ? "rank-live-gold"
                : product.rank === 2
                  ? "rank-live-silver"
                  : "rank-live-bronze"
            }`}
            aria-hidden="true"
          />
        ) : null}
        {isKing ? "👑" : `#${product.rank}`}
      </span>

      <ProductLogo
        name={product.name}
        iconUrl={product.iconUrl}
        ogImageUrl={product.ogImageUrl}
        domain={product.normalizedDomain}
        size={32}
        rounded="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="truncate font-semibold text-text transition-colors group-hover:text-gold">
            {product.name}
          </span>
          <span className="truncate text-xs text-text-dim">{product.normalizedDomain}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-text-muted sm:line-clamp-1">
          {product.tagline}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-dim">
          <span>{t("clicksLabel", { count: formatClicks(product.clickCount) })}</span>
          <span aria-hidden="true">·</span>
          <span>{product.categoryName}</span>
          {listedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>{listedAt}</span>
            </>
          )}
        </p>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-0.5 pt-0.5 text-right sm:flex">
        <span className="text-base font-bold tabular-nums text-gold">
          {formatBid(product.totalBid)}
        </span>
        <span className="text-[11px] text-text-dim transition-colors group-hover:text-text-muted">
          {tp("viewProduct")}
        </span>
      </div>

      <span className="shrink-0 pt-1 text-sm font-semibold tabular-nums text-gold sm:hidden">
        {formatBid(product.totalBid)}
      </span>
    </Link>
  );
}
