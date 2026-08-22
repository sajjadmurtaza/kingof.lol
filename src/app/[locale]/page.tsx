import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { LetterAvatar } from "@/components/letter-avatar";
import { Link } from "@/i18n/navigation";
import { formatBid, formatClicks } from "@/lib/format";
import {
  getTopProducts,
  getCategoryKings,
  getMostClicked,
  getRandomPicks,
  getHiddenGems,
  getRising,
  getCountryLeaderboards,
} from "@/domains/leaderboard/queries";
import type { RankedProduct, RisingProduct, CountryLeaderboard } from "@/domains/leaderboard/queries";

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

  const [top3, categoryKings, mostClicked, hiddenGems, rising, countries, random3] =
    await Promise.all([
      safeQuery(() => getTopProducts(3), []),
      safeQuery(() => getCategoryKings(), []),
      safeQuery(() => getMostClicked(5), []),
      safeQuery(() => getHiddenGems(), []),
      safeQuery(() => getRising(5), []),
      safeQuery(() => getCountryLeaderboards(6), []),
      safeQuery(() => getRandomPicks(3), []),
    ]);

  return (
    <>
      <Hero locale={locale} />

      <div className="space-y-12 pb-16 sm:space-y-14">
        {top3.length > 0 && <Top3Section products={top3} locale={locale} />}
        {categoryKings.length > 0 && (
          <CategoryKingsSection kings={categoryKings} locale={locale} />
        )}
        {mostClicked.length > 0 && (
          <MostClickedSection products={mostClicked} locale={locale} />
        )}
        {rising.length > 0 && <RisingSection products={rising} locale={locale} />}
        {countries.length > 0 && <CountrySection countries={countries} locale={locale} />}
        {(random3.length > 0 || hiddenGems.length > 0) && (
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
            {random3.length > 0 && <Random3Section products={random3} locale={locale} />}
            {hiddenGems.length > 0 && (
              <HiddenGemsSection products={hiddenGems} locale={locale} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Top3Section({
  products,
  locale,
}: {
  products: RankedProduct[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  const king = products[0];
  const runners = products.slice(1);

  return (
    <Section title={t("top3")}>
      {king && (
        <Link
          href={`/product/${king.slug}`}
          locale={locale}
          className="group block rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent p-6 shadow-[var(--shadow-gold)] transition-all hover:border-gold/50 sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-gold/70">
            👑 {t("kingOfKingof")}
          </p>
          <h3 className="mt-3 text-2xl font-black text-gold sm:text-3xl">{king.name}</h3>
          <p className="mt-1 text-text-muted">{king.tagline}</p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="font-bold text-gold">{formatBid(king.totalBid)}</span>
            <span className="text-text-dim">·</span>
            <span className="text-text-dim">{formatClicks(king.clickCount)} clicks</span>
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-text-dim">
            #1 Overall
          </p>
          <div className="mt-5 flex gap-3">
            <span className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors group-hover:border-border-bright">
              Visit ↗
            </span>
            <span className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-bg">
              {t("takeNumber1")}
            </span>
          </div>
        </Link>
      )}

      {runners.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {runners.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              locale={locale}
              className="group flex items-start gap-3 rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-border-bright"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  p.rank === 2
                    ? "bg-silver/10 text-silver"
                    : "bg-bronze/10 text-bronze"
                }`}
              >
                #{p.rank}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-text group-hover:text-gold transition-colors">
                  {p.name}
                </h4>
                <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{p.tagline}</p>
                <span className="mt-1.5 inline-block text-sm font-medium text-gold">
                  {formatBid(p.totalBid)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
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
    <Section title={t("categoryKings")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kings.map((ck) => (
          <Link
            key={ck.categorySlug}
            href={`/${ck.categorySlug}`}
            locale={locale}
            className="group rounded-xl border border-border bg-bg-card p-5 transition-all hover:border-gold/30 hover:shadow-[var(--shadow-gold)]"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {ck.categoryName}
            </h3>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gold">👑</span>
              <span className="font-bold text-text">{ck.king.name}</span>
            </div>
            <div className="mt-1 text-sm font-medium text-gold/70">
              {formatBid(ck.king.totalBid)}
            </div>
            <p className="mt-3 text-xs text-text-dim group-hover:text-gold/60 transition-colors">
              {t("seeLeaderboard", { category: ck.categoryName })}
            </p>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function MostClickedSection({
  products,
  locale,
}: {
  products: RankedProduct[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  return (
    <Section title={t("mostClicked")} subtitle="Most visited products this week">
      <div className="space-y-1.5">
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            locale={locale}
            className="group flex items-center gap-4 rounded-lg border border-border bg-bg-card px-4 py-3 transition-all hover:border-border-bright"
          >
            <span className="w-6 text-center text-sm font-bold text-text-dim">{i + 1}</span>
            <LetterAvatar name={p.name} size={28} />
            <span className="min-w-0 flex-1 truncate font-medium text-text group-hover:text-gold transition-colors">
              {p.name}
            </span>
            <span className="shrink-0 text-sm text-text-muted">
              {formatClicks(p.clickCount)} clicks
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function RisingSection({
  products,
  locale,
}: {
  products: RisingProduct[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  return (
    <Section title={t("rising")} subtitle="Biggest movers this week">
      <div className="space-y-1.5">
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            locale={locale}
            className="group flex items-center gap-4 rounded-lg border border-border bg-bg-card px-4 py-3 transition-all hover:border-border-bright"
          >
            <span className="w-6 text-center text-sm font-bold text-text-dim">{i + 1}</span>
            <LetterAvatar name={p.name} size={28} />
            <span className="min-w-0 flex-1 truncate font-medium text-text group-hover:text-gold transition-colors">
              {p.name}
            </span>
            <span className="shrink-0 text-sm font-medium text-success">
              ↑{p.positionsUp}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function CountrySection({
  countries,
  locale,
}: {
  countries: CountryLeaderboard[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  return (
    <Section title={t("aroundTheWorld")}>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
        {countries.map((c) => (
          <div
            key={c.code}
            className="min-w-[210px] shrink-0 rounded-xl border border-border bg-bg-card p-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="text-lg">{c.flag}</span>
              <span className="uppercase text-text">{c.name}</span>
            </div>
            <div className="mt-3 space-y-2">
              {c.top3.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  locale={locale}
                  className="flex items-center gap-2 text-sm hover:text-gold transition-colors"
                >
                  <span className="w-5 text-xs font-bold text-text-dim">
                    #{i + 1}
                  </span>
                  <span className="flex-1 truncate text-text">{p.name}</span>
                  <span className="text-xs text-text-dim">{p.clicks}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Random3Section({
  products,
  locale,
}: {
  products: RankedProduct[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  return (
    <Section title={t("random3")}>
      <div className="space-y-1.5">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            locale={locale}
            className="group flex items-center gap-3 rounded-lg border border-border bg-bg-card p-3 transition-all hover:border-border-bright"
          >
            <LetterAvatar name={p.name} size={28} />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-text group-hover:text-gold transition-colors">
                {p.name}
              </h4>
              <p className="text-xs text-text-dim line-clamp-1">{p.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function HiddenGemsSection({
  products,
  locale,
}: {
  products: RankedProduct[];
  locale: string;
}) {
  const t = useTranslations("app.sections");
  return (
    <Section title={t("hiddenGems")}>
      <div className="space-y-1.5">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            locale={locale}
            className="group flex items-center gap-3 rounded-lg border border-border bg-bg-card p-3 transition-all hover:border-border-bright"
          >
            <LetterAvatar name={p.name} size={28} />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-text group-hover:text-gold transition-colors">
                {p.name}
              </h4>
              <p className="text-xs text-text-dim line-clamp-1">{p.tagline}</p>
            </div>
            <span className="shrink-0 text-xs text-text-dim">
              {formatClicks(p.clickCount)} clicks
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
