import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { getProductBySlug } from "@/domains/leaderboard/queries";
import type { RankedProduct } from "@/domains/leaderboard/queries";
import { formatBid, formatClicks, rankLabel } from "@/lib/format";
import { buildPageMetadata, breadcrumbJsonLd } from "@/domains/marketing/seo-metadata";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  let product: RankedProduct | null = null;
  try {
    product = await getProductBySlug(slug);
  } catch {
    return buildPageMetadata({
      title: "Product Not Found",
      description: "This product could not be found on KINGOF.",
      path: `/${locale}/product/${slug}`,
      noIndex: true,
    });
  }

  if (!product) {
    return buildPageMetadata({
      title: "Product Not Found",
      description: "This product could not be found on KINGOF.",
      path: `/${locale}/product/${slug}`,
      noIndex: true,
    });
  }

  const title = `${product.name} — #${product.rank} ${product.categoryName}`;
  const description = product.tagline
    ? `${product.tagline} — Ranked #${product.rank} in ${product.categoryName} on KINGOF.`
    : `${product.name} is ranked #${product.rank} in ${product.categoryName} on KINGOF.`;

  return buildPageMetadata({
    title,
    description,
    path: `/${locale}/product/${slug}`,
    hreflangPath: `/product/${slug}`,
    ogTitle: `${product.name} — #${product.rank} ${product.categoryName} on KINGOF`,
    ogDescription: description,
  });
}

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

  const breadcrumb = breadcrumbJsonLd([
    { name: "KINGOF", path: "/" },
    { name: product.categoryName, path: `/${locale}/${product.categorySlug}` },
    { name: product.name },
  ]);

  return (
    <div className="py-12">
      <JsonLd data={breadcrumb} />
      <ProductDetail product={product} locale={locale} />
    </div>
  );
}

function ProductDetail({ product, locale }: { product: RankedProduct; locale: string }) {
  const t = useTranslations("app.product");
  const isKing = product.rank === 1;

  return (
    <article className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-text-muted">
          <li>
            <Link href="/" locale={locale} className="hover:text-text">
              KINGOF
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${product.categorySlug}`} locale={locale} className="hover:text-text">
              {product.categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-text">{product.name}</li>
        </ol>
      </nav>

      <div
        className={`rounded-2xl border p-8 ${
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
            <p className="mt-1 text-2xl font-bold text-gold">{formatBid(product.totalBid)}</p>
          </div>
          <div className="rounded-lg bg-surface p-4 text-center">
            <p className="text-xs text-text-dim uppercase">{t("clicks")}</p>
            <p className="mt-1 text-2xl font-bold text-text">{formatClicks(product.clickCount)}</p>
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
    </article>
  );
}
