import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard, ProductCardCompact } from "@/components/product-card";
import { Section } from "@/components/section";
import { Link } from "@/i18n/navigation";
import {
  getHiddenGems,
  getMostClicked,
  getRandomPicks,
  getTopProducts,
} from "@/domains/leaderboard/queries";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

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

  let random3: Awaited<ReturnType<typeof getRandomPicks>> = [];
  let mostClicked: Awaited<ReturnType<typeof getMostClicked>> = [];
  let hiddenGems: Awaited<ReturnType<typeof getHiddenGems>> = [];
  let newKings: Awaited<ReturnType<typeof getTopProducts>> = [];

  try {
    [random3, mostClicked, hiddenGems, newKings] = await Promise.all([
      getRandomPicks(3),
      getMostClicked(6),
      getHiddenGems(),
      getTopProducts(3),
    ]);
  } catch {
    // DB unavailable
  }

  return (
    <div className="py-12 space-y-16">
      <DiscoverContent
        random3={random3}
        mostClicked={mostClicked}
        hiddenGems={hiddenGems}
        newKings={newKings}
        locale={locale}
      />
    </div>
  );
}

function DiscoverContent({
  random3,
  mostClicked,
  hiddenGems,
  newKings,
  locale,
}: {
  random3: Awaited<ReturnType<typeof getRandomPicks>>;
  mostClicked: Awaited<ReturnType<typeof getMostClicked>>;
  hiddenGems: Awaited<ReturnType<typeof getHiddenGems>>;
  newKings: Awaited<ReturnType<typeof getTopProducts>>;
  locale: string;
}) {
  const t = useTranslations("app");

  const hasData = random3.length > 0 || mostClicked.length > 0 || hiddenGems.length > 0 || newKings.length > 0;

  return (
    <>
      <div>
        <h1 className="text-3xl font-black">{t("discover.title")}</h1>
        <p className="mt-2 text-text-muted">{t("discover.subtitle")}</p>
      </div>

      {hasData ? (
        <>
          {random3.length > 0 && (
            <Section title={t("sections.random3")}>
              <div className="grid gap-4 sm:grid-cols-3">
                {random3.map((p) => (
                  <ProductCard key={p.id} product={p} showRank={false} showCategory locale={locale} />
                ))}
              </div>
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
                View all most clicked →
              </Link>
            </Section>
          )}

          {hiddenGems.length > 0 && (
            <Section title={t("sections.hiddenGems")}>
              <div className="grid gap-4 sm:grid-cols-3">
                {hiddenGems.map((p) => (
                  <ProductCard key={p.id} product={p} showRank={false} showCategory locale={locale} />
                ))}
              </div>
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
              <p className="mt-4 text-xs text-text-dim">
                Products will appear here once the leaderboard is active.
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
