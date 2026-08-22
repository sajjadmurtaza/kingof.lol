import type { RankedProduct } from "@/domains/leaderboard/queries";
import { Link } from "@/i18n/navigation";
import { LetterAvatar } from "./letter-avatar";
import { formatBid, formatClicks } from "@/lib/format";

export function ProductCard({
  product,
  showRank = true,
  showCategory = false,
  locale,
}: {
  product: RankedProduct;
  showRank?: boolean;
  showCategory?: boolean;
  locale: string;
}) {
  const isKing = product.rank === 1;

  return (
    <Link
      href={`/product/${product.slug}`}
      locale={locale}
      className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all hover:border-border-bright ${
        isKing
          ? "border-gold/30 bg-gradient-to-br from-gold/5 to-transparent shadow-[var(--shadow-gold)]"
          : "border-border bg-bg-card"
      }`}
    >
      {showRank && product.rank > 0 && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
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

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-text group-hover:text-gold transition-colors">
            {product.name}
          </h3>
        </div>
        <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{product.tagline}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-dim">
          <span className="font-medium text-gold">{formatBid(product.totalBid)}</span>
          <span>{formatClicks(product.clickCount)} clicks</span>
          {showCategory && (
            <span>{product.categoryName}</span>
          )}
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
  return (
    <Link
      href={`/product/${product.slug}`}
      locale={locale}
      className="group flex items-center gap-3 rounded-lg border border-border bg-bg-card p-3 transition-all hover:border-border-bright"
    >
      <LetterAvatar name={product.name} size={28} />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-text group-hover:text-gold transition-colors">
          {product.name}
        </h4>
        <p className="text-xs text-text-dim">{formatBid(product.totalBid)}</p>
      </div>
      <span className="text-xs text-text-muted">{formatClicks(product.clickCount)} clicks</span>
    </Link>
  );
}
