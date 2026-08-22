import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { Link } from "@/i18n/navigation";
import { formatBid, formatClicks } from "@/lib/format";
import { ProductLogo } from "./product-logo";

export function ProductCard({
  product,
  showRank = true,
  showCategory = false,
  locale,
  flashTopBid = false,
}: {
  product: RankedProduct;
  showRank?: boolean;
  showCategory?: boolean;
  locale: string;
  flashTopBid?: boolean;
}) {
  const t = useTranslations("app.sections");
  const isKing = product.rank === 1;

  return (
    <Link
      href={`/product/${product.slug}`}
      locale={locale}
      className={`product-panel group relative flex items-start gap-3 rounded-xl border p-4 transition-all hover:border-border-bright ${
        isKing
          ? `border-gold/40 bg-gradient-to-br from-gold/10 to-transparent shadow-[var(--shadow-gold)]${flashTopBid ? " bid-leader-flash" : ""}`
          : "border-border bg-bg-card"
      }`}
    >
      {showRank && product.rank > 0 && (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isKing
              ? "bg-gold/15 text-gold"
              : product.rank === 2
                ? "bg-silver/10 text-silver"
                : product.rank === 3
                  ? "bg-bronze/10 text-bronze"
                  : "bg-surface text-text-muted"
          }`}
        >
          {isKing ? "👑" : `#${product.rank}`}
        </span>
      )}

      <ProductLogo
        name={product.name}
        iconUrl={product.iconUrl}
        ogImageUrl={product.ogImageUrl}
        domain={product.normalizedDomain}
        size={36}
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-text transition-colors group-hover:text-gold">
          {product.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-text-muted">{product.tagline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-dim">
          <span className="font-medium text-gold">{formatBid(product.totalBid)}</span>
          <span>{t("clicksLabel", { count: formatClicks(product.clickCount) })}</span>
          {showCategory && <span>{product.categoryName}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardCompact({
  product,
  locale,
}: {
  product: RankedProduct;
  locale: string;
}) {
  const t = useTranslations("app.sections");

  return (
    <Link
      href={`/product/${product.slug}`}
      locale={locale}
      className="product-panel group flex items-center gap-3 rounded-lg border border-border bg-bg-card p-3 transition-all hover:border-border-bright"
    >
      <ProductLogo
        name={product.name}
        iconUrl={product.iconUrl}
        ogImageUrl={product.ogImageUrl}
        domain={product.normalizedDomain}
        size={28}
        rounded="md"
      />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-text transition-colors group-hover:text-gold">
          {product.name}
        </h4>
        <p className="text-xs text-text-dim">{formatBid(product.totalBid)}</p>
      </div>
      <span className="text-xs text-text-muted">
        {t("clicksLabel", { count: formatClicks(product.clickCount) })}
      </span>
    </Link>
  );
}

/** Minimal row for dense leaderboards — rank + small logo + name + trailing stat */
export function ProductListRow({
  product,
  locale,
  index,
  trailing,
}: {
  product: RankedProduct;
  locale: string;
  index?: number;
  trailing?: ReactNode;
}) {
  const t = useTranslations("app.sections");

  return (
    <Link
      href={`/product/${product.slug}`}
      locale={locale}
      className="group flex items-center gap-3 py-3 transition-colors"
    >
      {index !== undefined && (
        <span className="w-7 shrink-0 text-right text-sm font-medium text-text-dim">
          {String(index).padStart(2, "0")}
        </span>
      )}
      <ProductLogo
        name={product.name}
        iconUrl={product.iconUrl}
        ogImageUrl={product.ogImageUrl}
        domain={product.normalizedDomain}
        size={28}
        rounded="md"
      />
      <span className="min-w-0 flex-1 truncate text-base font-medium text-text group-hover:text-gold">
        {product.name}
      </span>
      {trailing ?? (
        <span className="shrink-0 text-sm text-text-muted">
          {t("clicksLabel", { count: formatClicks(product.clickCount) })}
        </span>
      )}
    </Link>
  );
}
