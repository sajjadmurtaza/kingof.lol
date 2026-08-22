import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeAboveFold } from "@/components/home-above-fold";
import { SectionDivider } from "@/components/section-divider";
import {
  CategoryKingsSection,
  MostClickedSection,
  DiscoverSection,
  EmptyLeaderboard,
} from "@/components/home-sections";
import { JsonLd } from "@/components/json-ld";
import {
  buildPageMetadata,
  websiteJsonLd,
  organizationJsonLd,
} from "@/domains/marketing/seo-metadata";
import {
  getTopProducts,
  getCategoryKings,
  getMostClicked,
  getRandomPicks,
  getHiddenGems,
  getTodayClickCount,
  getProductCount,
  getCategoryCount,
  getHappeningNow,
  getProductsPaginated,
} from "@/domains/leaderboard/queries";
import { demoHappeningNow, emptyHappeningNow, shouldShowDemoActivity } from "@/lib/demo-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("homeTitle"),
    description: t("homeDesc"),
    path: `/${locale}`,
    hreflangPath: "",
    absoluteTitle: true,
  });
}

export const revalidate = 60;

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tMeta = await getTranslations({ locale, namespace: "app.meta" });

  const [
    top3,
    categoryKings,
    mostClicked,
    hiddenGems,
    random3,
    productCount,
    categoryCount,
    clicksToday,
    happeningNow,
    allProducts,
  ] = await Promise.all([
    safeQuery(() => getTopProducts(3), []),
    safeQuery(() => getCategoryKings(), []),
    safeQuery(() => getMostClicked(5), []),
    safeQuery(() => getHiddenGems(1), []),
    safeQuery(() => getRandomPicks(1), []),
    safeQuery(() => getProductCount(), 0),
    safeQuery(() => getCategoryCount(), 0),
    safeQuery(() => getTodayClickCount(), 0),
    safeQuery(() => getHappeningNow(5, 5), { trending: [], activity: [] }),
    safeQuery(
      () => getProductsPaginated({ sort: "bid", page: 1, pageSize: 10 }),
      { products: [], total: 0, page: 1, pageSize: 10, hasMore: false },
    ),
  ]);

  const liveFeed =
    happeningNow.trending.length > 0 || happeningNow.activity.length > 0
      ? happeningNow
      : shouldShowDemoActivity()
        ? demoHappeningNow(5, 5)
        : emptyHappeningNow();

  const hasAnyData =
    top3.length > 0 ||
    categoryKings.length > 0 ||
    mostClicked.length > 0 ||
    random3.length > 0 ||
    hiddenGems.length > 0;

  return (
    <>
      <JsonLd data={websiteJsonLd(tMeta("websiteDesc"))} />
      <JsonLd data={organizationJsonLd()} />

      <HomeAboveFold
        locale={locale}
        productCount={productCount}
        categoryCount={categoryCount}
        clicksToday={clicksToday}
        king={top3[0]}
        runners={top3.slice(1)}
        trending={liveFeed.trending}
        activity={liveFeed.activity}
      />

      <div className="w-full space-y-8 pb-16 sm:space-y-10">
        {hasAnyData ? (
          <>
            {categoryKings.length > 0 && (
              <>
                <SectionDivider />
                <CategoryKingsSection kings={categoryKings.slice(0, 6)} locale={locale} />
              </>
            )}
            {mostClicked.length > 0 && (
              <>
                <SectionDivider />
                <MostClickedSection products={mostClicked} locale={locale} />
              </>
            )}
            {(random3.length > 0 || hiddenGems.length > 0 || allProducts.total > 0) && (
              <>
                <SectionDivider />
                <DiscoverSection
                  random={random3[0]}
                  gem={hiddenGems[0]}
                  locale={locale}
                  allProducts={allProducts.total > 0 ? allProducts : undefined}
                />
              </>
            )}
          </>
        ) : (
          <EmptyLeaderboard locale={locale} />
        )}
      </div>
    </>
  );
}
