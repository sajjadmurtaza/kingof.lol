import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard, ProductCardCompact } from "@/components/product-card";
import { DiscoverPicks } from "@/components/discover-picks";
import { Section } from "@/components/section";
import { Link } from "@/i18n/navigation";
import {
  getHiddenGems,
  getMostClicked,
  getRandomPicks,
  getTopProducts,
  getProductsPaginated,
  getTopProductsByBidPeriod,
} from "@/domains/leaderboard/queries";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";
import { NEW_LISTINGS_WITHIN_MINUTES, PRODUCT_PAGE_SIZE } from "@/lib/product-pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("discoverTitle"),
    description: t("discoverDesc"),
    path: `/${locale}/discover`,
    hreflangPath: "/discover",
  });
}

export const revalidate = 60;

export default async function DiscoverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  let randomPick: Awaited<ReturnType<typeof getRandomPicks>>[number] | undefined;
  let hiddenGem: Awaited<ReturnType<typeof getHiddenGems>>[number] | undefined;
  let mostClicked: Awaited<ReturnType<typeof getMostClicked>> = [];
  let newKings: Awaited<ReturnType<typeof getTopProducts>> = [];
  let allProducts: Awaited<ReturnType<typeof getProductsPaginated>> = {
    products: [],
    total: 0,
    page: 1,
    pageSize: PRODUCT_PAGE_SIZE,
    hasMore: false,
  };
  let newProducts: Awaited<ReturnType<typeof getProductsPaginated>> = {
    products: [],
    total: 0,
    page: 1,
    pageSize: PRODUCT_PAGE_SIZE,
    hasMore: false,
  };
  let weekTop: Awaited<ReturnType<typeof getTopProductsByBidPeriod>> = [];
  let monthTop: Awaited<ReturnType<typeof getTopProductsByBidPeriod>> = [];

  try {
    const [random3, gems, clicked, kings, allPage, newPage, weekLeaders, monthLeaders] =
      await Promise.all([
        getRandomPicks(1),
        getHiddenGems(1),
        getMostClicked(6),
        getTopProducts(3),
        getProductsPaginated({ sort: "bid", page: 1, pageSize: PRODUCT_PAGE_SIZE }),
        getProductsPaginated({
          sort: "new",
          page: 1,
          pageSize: PRODUCT_PAGE_SIZE,
          newWithinMinutes: NEW_LISTINGS_WITHIN_MINUTES,
        }),
        getTopProductsByBidPeriod("week", 3),
        getTopProductsByBidPeriod("month", 3),
      ]);
    randomPick = random3[0];
    hiddenGem = gems[0];
    mostClicked = clicked;
    newKings = kings;
    allProducts = allPage;
    newProducts = newPage;
    weekTop = weekLeaders;
    monthTop = monthLeaders;
  } catch {
    // DB unavailable
  }

  return (
    <div className="py-12 space-y-16">
      <DiscoverContent
        randomPick={randomPick}
        hiddenGem={hiddenGem}
        mostClicked={mostClicked}
        newKings={newKings}
        allProducts={allProducts}
        newProducts={newProducts}
        weekTop={weekTop}
        monthTop={monthTop}
        locale={locale}
      />
    </div>
  );
}

function DiscoverContent({
  randomPick,
  hiddenGem,
  mostClicked,
  newKings,
  allProducts,
  newProducts,
  weekTop,
  monthTop,
  locale,
}: {
  randomPick?: Awaited<ReturnType<typeof getRandomPicks>>[number];
  hiddenGem?: Awaited<ReturnType<typeof getHiddenGems>>[number];
  mostClicked: Awaited<ReturnType<typeof getMostClicked>>;
  newKings: Awaited<ReturnType<typeof getTopProducts>>;
  allProducts: Awaited<ReturnType<typeof getProductsPaginated>>;
  newProducts: Awaited<ReturnType<typeof getProductsPaginated>>;
  weekTop: Awaited<ReturnType<typeof getTopProductsByBidPeriod>>;
  monthTop: Awaited<ReturnType<typeof getTopProductsByBidPeriod>>;
  locale: string;
}) {
  const t = useTranslations("app");

  const hasData =
    randomPick != null ||
    hiddenGem != null ||
    mostClicked.length > 0 ||
    newKings.length > 0 ||
    allProducts.total > 0 ||
    newProducts.total > 0 ||
    weekTop.length > 0 ||
    monthTop.length > 0;

  return (
    <>
      <div>
        <h1 className="page-title">{t("discover.title")}</h1>
        <p className="mt-2 text-text-muted">{t("discover.subtitle")}</p>
      </div>

      {hasData ? (
        <>
          {(randomPick ||
            hiddenGem ||
            allProducts.total > 0 ||
            newProducts.total > 0 ||
            weekTop.length > 0 ||
            monthTop.length > 0) && (
            <Section title={t("sections.discover")}>
              <DiscoverPicks
                locale={locale}
                weekTop={weekTop}
                monthTop={monthTop}
                random={
                  randomPick
                    ? {
                        slug: randomPick.slug,
                        name: randomPick.name,
                        tagline: randomPick.tagline,
                        iconUrl: randomPick.iconUrl,
                        ogImageUrl: randomPick.ogImageUrl,
                        normalizedDomain: randomPick.normalizedDomain,
                        categoryName: randomPick.categoryName,
                      }
                    : undefined
                }
                gem={
                  hiddenGem
                    ? {
                        slug: hiddenGem.slug,
                        name: hiddenGem.name,
                        tagline: hiddenGem.tagline,
                        iconUrl: hiddenGem.iconUrl,
                        ogImageUrl: hiddenGem.ogImageUrl,
                        normalizedDomain: hiddenGem.normalizedDomain,
                        clickCount: hiddenGem.clickCount,
                      }
                    : undefined
                }
                allProducts={allProducts.total > 0 ? allProducts : undefined}
                newProducts={newProducts.total > 0 ? newProducts : undefined}
              />
            </Section>
          )}

          {mostClicked.length > 0 && (
            <Section title={t("sections.mostClicked")}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mostClicked.map((p) => (
                  <ProductCard key={p.id} product={p} showCategory locale={locale} />
                ))}
              </div>
              <Link
                href="/most-clicked"
                locale={locale}
                className="mt-4 inline-block text-sm text-gold hover:text-accent-hover"
              >
                {t("discover.viewAllMostClicked")}
              </Link>
            </Section>
          )}

          {newKings.length > 0 && (
            <Section title={t("sections.newKings")}>
              <div className="space-y-3">
                {newKings.map((p) => (
                  <ProductCardCompact key={p.id} product={p} locale={locale} />
                ))}
              </div>
            </Section>
          )}
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: t("sections.random3"), desc: t("howItWorks.randomDesc"), icon: "🎲" },
            { title: t("sections.mostClicked"), desc: t("howItWorks.clicksDesc"), icon: "🖱️" },
            { title: t("sections.hiddenGems"), desc: t("howItWorks.gemsDesc"), icon: "💎" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-dashed border-border p-6 text-center"
            >
              <div className="text-3xl">{item.icon}</div>
              <h3 className="mt-3 font-bold text-text">{item.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
              <p className="mt-4 text-xs text-text-dim">{t("discover.emptyStateHint")}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
