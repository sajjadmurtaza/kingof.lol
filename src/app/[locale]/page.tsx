import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { ActivityFeed } from "@/components/activity-feed";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { formatBid, formatClicks } from "@/lib/format";
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
  getRecentActivity,
} from "@/domains/leaderboard/queries";
import type { RankedProduct } from "@/domains/leaderboard/queries";

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

  const [
    top3,
    categoryKings,
    mostClicked,
    hiddenGems,
    random3,
    productCount,
    categoryCount,
    clicksToday,
    activities,
  ] = await Promise.all([
    safeQuery(() => getTopProducts(3), []),
    safeQuery(() => getCategoryKings(), []),
    safeQuery(() => getMostClicked(5), []),
    safeQuery(() => getHiddenGems(1), []),
    safeQuery(() => getRandomPicks(1), []),
    safeQuery(() => getProductCount(), 0),
    safeQuery(() => getCategoryCount(), 0),
    safeQuery(() => getTodayClickCount(), 0),
    safeQuery(() => getRecentActivity(4), []),
  ]);

  const hasAnyData =
    top3.length > 0 ||
    categoryKings.length > 0 ||
    mostClicked.length > 0 ||
    random3.length > 0 ||
    hiddenGems.length > 0;

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />

      <Hero
        locale={locale}
        productCount={productCount}
        categoryCount={categoryCount}
        clicksToday={clicksToday}
      />

      <div className="space-y-16 pb-20 sm:space-y-20">
        {hasAnyData ? (
          <>
            {top3.length > 0 && <CrownSection products={top3} locale={locale} />}
            {activities.length > 0 && <ActivityFeed activities={activities} locale={locale} />}
            {categoryKings.length > 0 && (
              <CategoryKingsSection kings={categoryKings.slice(0, 6)} locale={locale} />
            )}
            {mostClicked.length > 0 && (
              <MostClickedSection products={mostClicked} locale={locale} />
            )}
            {(random3.length > 0 || hiddenGems.length > 0) && (
              <DiscoverSection random={random3[0]} gem={hiddenGems[0]} locale={locale} />
            )}
          </>
        ) : (
          <EmptyLeaderboard locale={locale} />
        )}
      </div>
    </>
  );
}

function CrownSection({ products, locale }: { products: RankedProduct[]; locale: string }) {
  const t = useTranslations("app.sections");
  const king = products[0];
  const runners = products.slice(1);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-text">{t("top3")}</h2>

      {king && (
        <div className="relative rounded-2xl bg-gradient-to-b from-[#1a1814] via-bg-card to-bg px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="text-4xl">👑</div>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gold/60">
            {t("kingOfKingof")}
          </p>
          <h3 className="mt-4 text-2xl font-black text-text sm:text-3xl">{king.name}</h3>
          <p className="mx-auto mt-2 max-w-md text-text-muted">{king.tagline}</p>
          <p className="mt-4 text-xl font-bold text-gold">{formatBid(king.totalBid)}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={`/product/${king.slug}`}
              locale={locale}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-border-bright"
            >
              {t("visitProduct")}
            </Link>
            <Link
              href="/submit"
              locale={locale}
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
            >
              {t("takeNumber1")}
            </Link>
          </div>
        </div>
      )}

      {runners.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {runners.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              locale={locale}
              className="group flex items-start gap-4 rounded-xl bg-bg-card p-5 transition-colors hover:bg-bg-elevated"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  p.rank === 2 ? "bg-silver/10 text-silver" : "bg-bronze/10 text-bronze"
                }`}
              >
                #{p.rank}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-lg font-semibold text-text">{p.name}</h4>
                <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{p.tagline}</p>
                <span className="mt-2 inline-block text-sm font-medium text-gold">
                  {formatBid(p.totalBid)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryKingsSection({
  kings,
  locale,
}: {
  kings: Awaited<ReturnType<typeof getCategoryKings>>;
  locale: string;
}) {
  const t = useTranslations("app.sections");
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-text">{t("categoryKings")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kings.map((ck) => (
          <Link
            key={ck.categorySlug}
            href={`/${ck.categorySlug}`}
            locale={locale}
            className="group rounded-xl bg-bg-card p-5 transition-colors hover:bg-bg-elevated"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{ck.categoryEmoji}</span>
              <h3 className="text-sm font-medium text-text-muted">{ck.categoryName}</h3>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm">👑</span>
              <span className="text-xl font-bold text-text">{ck.king.name}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-gold">
              {formatBid(ck.king.totalBid)}
            </p>
            <p className="mt-3 text-sm text-text-dim transition-colors group-hover:text-text-muted">
              {t("seeLeaderboard", { category: ck.categoryName })}
            </p>
          </Link>
        ))}
      </div>
      <Link
        href="/categories"
        locale={locale}
        className="inline-block text-sm text-text-muted transition-colors hover:text-text"
      >
        {t("viewAllCategories")}
      </Link>
    </section>
  );
}

function MostClickedSection({ products, locale }: { products: RankedProduct[]; locale: string }) {
  const t = useTranslations("app.sections");
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-text">{t("mostClicked")}</h2>
      <div className="space-y-1">
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            locale={locale}
            className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-bg-card"
          >
            <span className="w-7 text-right text-sm font-medium text-text-dim">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate text-base font-medium text-text">
              {p.name}
            </span>
            <span className="shrink-0 text-sm text-text-muted">
              {formatClicks(p.clickCount)} clicks
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DiscoverSection({
  random,
  gem,
  locale,
}: {
  random?: RankedProduct;
  gem?: RankedProduct;
  locale: string;
}) {
  const t = useTranslations("app.sections");

  if (!random && !gem) return null;

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold text-text">{t("discover")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {random && (
          <div className="rounded-xl bg-bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-text-dim">
              🎲 {t("random3")}
            </p>
            <h3 className="mt-3 text-xl font-bold text-text">{random.name}</h3>
            <p className="mt-1 text-sm text-text-muted line-clamp-2">{random.tagline}</p>
            <Link
              href={`/product/${random.slug}`}
              locale={locale}
              className="mt-4 inline-block text-sm font-medium text-gold transition-colors hover:text-accent-hover"
            >
              {t("discoverRandom")}
            </Link>
          </div>
        )}
        {gem && (
          <div className="rounded-xl bg-bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-text-dim">
              💎 {t("hiddenGems")}
            </p>
            <h3 className="mt-3 text-xl font-bold text-text">{gem.name}</h3>
            <p className="mt-1 text-sm text-text-muted line-clamp-2">{gem.tagline}</p>
            <Link
              href={`/product/${gem.slug}`}
              locale={locale}
              className="mt-4 inline-block text-sm font-medium text-text-muted transition-colors hover:text-text"
            >
              {t("discoverGem")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyLeaderboard({ locale }: { locale: string }) {
  const t = useTranslations("app");

  const categories = [
    { slug: "ai", emoji: "🤖", name: "AI" },
    { slug: "devtools", emoji: "🛠️", name: "Dev Tools" },
    { slug: "fintech", emoji: "💳", name: "Fintech" },
    { slug: "design", emoji: "🎨", name: "Design" },
    { slug: "saas", emoji: "☁️", name: "SaaS" },
    { slug: "productivity", emoji: "⚡", name: "Productivity" },
  ];

  return (
    <>
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-text">{t("sections.top3")}</h2>
        <div className="rounded-2xl border border-dashed border-border bg-bg-card p-8 text-center sm:p-12">
          <div className="mx-auto max-w-md">
            <div className="text-4xl">👑</div>
            <h3 className="mt-4 text-xl font-bold text-text">The throne is empty</h3>
            <p className="mt-2 text-text-muted">
              No products on the board yet. Be the first to claim the #1 spot.
            </p>
            <Link
              href="/submit"
              locale={locale}
              className="mt-6 inline-block rounded-lg bg-gold px-6 py-3 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
            >
              {t("sections.takeNumber1")}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-bold text-text">{t("sections.categoryKings")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              locale={locale}
              className="group rounded-xl bg-bg-card p-5 transition-colors hover:bg-bg-elevated"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{cat.emoji}</span>
                <h3 className="text-sm font-medium text-text-muted">{cat.name}</h3>
              </div>
              <div className="mt-4 rounded-lg border border-dashed border-border px-3 py-2">
                <span className="text-xs text-text-dim">No king yet — claim it</span>
              </div>
              <p className="mt-3 text-sm text-text-dim transition-colors group-hover:text-text-muted">
                {t("sections.seeLeaderboard", { category: cat.name })}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-bold text-text">{t("howItWorks.title")}</h2>
        <p className="text-sm text-text-dim">{t("howItWorks.subtitle")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: t("howItWorks.ranking"), desc: t("howItWorks.rankingDesc"), icon: "📊" },
            { title: t("howItWorks.bidding"), desc: t("howItWorks.biddingDesc"), icon: "💰" },
            { title: t("howItWorks.clicksTitle"), desc: t("howItWorks.clicksDesc"), icon: "🖱️" },
            { title: t("howItWorks.randomTitle"), desc: t("howItWorks.randomDesc"), icon: "🎲" },
            { title: t("howItWorks.gemsTitle"), desc: t("howItWorks.gemsDesc"), icon: "💎" },
            { title: t("howItWorks.dethronedTitle"), desc: t("howItWorks.dethronedDesc"), icon: "⚔️" },
          ].map((item) => (
            <div key={item.title} className="rounded-xl bg-bg-card p-5">
              <div className="text-xl">{item.icon}</div>
              <h3 className="mt-2 font-bold text-text">{item.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl bg-gradient-to-b from-[#1a1814] via-bg-card to-bg p-8 text-center sm:p-12">
        <h2 className="text-2xl font-black text-text sm:text-3xl">Ready to compete?</h2>
        <p className="mx-auto mt-2 max-w-md text-text-muted">
          Submit your product, pick a category, and start climbing the leaderboard. Free to list, compete from $5.
        </p>
        <Link
          href="/submit"
          locale={locale}
          className="mt-6 inline-block rounded-lg bg-gold px-8 py-3 text-sm font-bold text-bg transition-colors hover:bg-accent-hover"
        >
          {t("hero.cta")}
        </Link>
      </div>
    </>
  );
}
