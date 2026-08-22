import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/domains/leaderboard/queries";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { formatBid, formatClicks, rankLabel } from "@/lib/format";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let product: RankedProduct | null = null;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }
  if (!product) notFound();

  return (
    <div className="py-12">
      <ProductDetail product={product} locale={locale} />
    </div>
  );
}

function ProductDetail({
  product,
  locale,
}: {
  product: RankedProduct;
  locale: string;
}) {
  const t = useTranslations("app.product");
  const isKing = product.rank === 1;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/${product.categorySlug}`}
        locale={locale}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
      >
        <span>{product.categoryName}</span>
      </Link>

      <div
        className={`mt-4 rounded-2xl border p-8 ${
          isKing
            ? "border-gold/30 bg-gradient-to-br from-gold/10 to-transparent shadow-[var(--shadow-gold)]"
            : "border-border bg-bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-text">{product.name}</h1>
            <p className="mt-2 text-lg text-text-muted">{product.tagline}</p>
          </div>
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold ${
              isKing ? "bg-gold/15 text-gold" : "bg-surface text-text-muted"
            }`}
          >
            {rankLabel(product.rank)}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface p-4 text-center">
            <p className="text-xs text-text-dim uppercase">{t("rank")}</p>
            <p className="mt-1 text-2xl font-bold text-text">#{product.rank}</p>
          </div>
          <div className="rounded-lg bg-surface p-4 text-center">
            <p className="text-xs text-text-dim uppercase">{t("bid")}</p>
            <p className="mt-1 text-2xl font-bold text-gold">
              {formatBid(product.totalBid)}
            </p>
          </div>
          <div className="rounded-lg bg-surface p-4 text-center">
            <p className="text-xs text-text-dim uppercase">{t("clicks")}</p>
            <p className="mt-1 text-2xl font-bold text-text">
              {formatClicks(product.clickCount)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-border bg-surface py-3 text-center font-medium text-text transition-colors hover:border-border-bright"
          >
            {t("visit")} ↗
          </a>
          <Link
            href="/submit"
            locale={locale}
            className="flex-1 rounded-lg bg-gold py-3 text-center font-bold text-bg transition-colors hover:bg-accent-hover"
          >
            {t("challenge")}
          </Link>
        </div>
      </div>
    </div>
  );
}
