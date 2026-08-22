"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KingofBubble } from "@/components/kingof-bubble";
import { ProductLogo } from "@/components/product-logo";
import { formatBid } from "@/lib/format";
import type { RankedProduct } from "@/domains/leaderboard/queries";

function RunnerPodium({
  runners,
  kingBid,
  locale,
  prominent = false,
}: {
  runners: RankedProduct[];
  kingBid: number;
  locale: string;
  prominent?: boolean;
}) {
  const ts = useTranslations("app.sections");

  if (runners.length === 0) return null;

  return (
    <div className={`relative space-y-2.5 border-t border-gold/15 ${prominent ? "pt-5" : "pt-4"}`}>
      <p
        className={`font-bold uppercase tracking-[0.14em] text-text-dim ${
          prominent ? "text-[11px]" : "text-[10px]"
        }`}
      >
        {ts("chasingTheCrown")}
      </p>
      <div className="grid gap-2.5">
        {runners.map((p) => {
          const gap = kingBid - p.totalBid;
          const accent = p.rank === 2 ? "runner-podium-card--silver" : "runner-podium-card--bronze";
          const rankLive =
            p.rank === 2 ? "rank-live rank-live-silver" : "rank-live rank-live-bronze";
          const rankColor = p.rank === 2 ? "text-silver" : "text-bronze";

          return (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              locale={locale}
              className={`runner-podium-card group ${accent} ${rankLive} ${prominent ? "runner-podium-card--prominent" : ""}`}
            >
              <span
                className={`shrink-0 font-black tabular-nums ${rankColor} ${
                  prominent ? "flex w-8 items-center gap-1 text-sm" : "text-xs"
                }`}
              >
                {prominent ? (
                  <span
                    className={`rank-live-dot ${p.rank === 2 ? "rank-live-silver" : "rank-live-bronze"}`}
                    aria-hidden="true"
                  />
                ) : null}
                #{p.rank}
              </span>
              <ProductLogo
                name={p.name}
                iconUrl={p.iconUrl}
                ogImageUrl={p.ogImageUrl}
                domain={p.normalizedDomain}
                size={prominent ? 40 : 32}
                rounded="md"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-semibold text-text group-hover:text-gold ${
                    prominent ? "text-base" : "text-sm"
                  }`}
                >
                  {p.name}
                </p>
                {gap > 0 && (
                  <p className={`text-text-dim ${prominent ? "text-xs" : "text-[10px]"}`}>
                    {ts("behindKing", { amount: formatBid(gap) })}
                  </p>
                )}
              </div>
              <p
                className={`shrink-0 font-bold tabular-nums ${rankColor} ${
                  prominent ? "text-base" : "text-sm"
                }`}
              >
                {formatBid(p.totalBid)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function KingSpotlight({
  king,
  runners,
  locale,
  variant = "default",
}: {
  king: RankedProduct;
  runners: RankedProduct[];
  locale: string;
  variant?: "default" | "sidebar";
}) {
  const t = useTranslations("app.voice");
  const ts = useTranslations("app.sections");
  const tu = useTranslations("app.ui");

  if (variant === "sidebar") {
    return (
      <section className="king-throne-card rank-live rank-live-gold rank-nudge-once relative flex h-full w-full flex-col space-y-4 px-5 py-5 text-center sm:px-6">
        <p className="relative flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
          <span className="rank-live-dot rank-live-gold" aria-hidden="true" />
          <span aria-hidden="true">👑 </span>
          {ts("kingTitle")} · #1 {ts("overall")}
        </p>

        <Link
          href={`/product/${king.slug}`}
          locale={locale}
          className="relative mx-auto inline-block transition-transform hover:scale-[1.03]"
        >
          <div className="king-logo-ring">
            <ProductLogo
              name={king.name}
              iconUrl={king.iconUrl}
              ogImageUrl={king.ogImageUrl}
              domain={king.normalizedDomain}
              size={68}
              rounded="lg"
            />
          </div>
        </Link>

        <div className="relative space-y-1">
          <Link
            href={`/product/${king.slug}`}
            locale={locale}
            className="block text-[1.65rem] font-black leading-tight text-gold transition-colors hover:text-accent-hover sm:text-[1.75rem]"
          >
            {king.name}
          </Link>
          <p className="text-xs text-text-muted">
            {tu("kingOfCategory", { category: king.categoryName })}
          </p>
          <p className="text-sm font-medium tabular-nums text-text-dim">
            {formatBid(king.totalBid)}
          </p>
        </div>

        <div className="relative flex justify-center px-2 pt-1">
          <KingofBubble
            message={t("kingChallenge")}
            variant="ivory"
            tilt="left"
            className="!max-w-[18rem] !px-3.5 !py-2"
          />
        </div>

        <Link
          href="/submit"
          locale={locale}
          className="relative inline-block text-xs font-bold uppercase tracking-wide text-gold transition-colors hover:text-accent-hover"
        >
          {ts("takeTheCrown")}
        </Link>

        <RunnerPodium runners={runners} kingBid={king.totalBid} locale={locale} prominent />
      </section>
    );
  }

  return (
    <section className="king-throne-card relative mx-auto max-w-md space-y-4 text-center sm:space-y-5">
      <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
        <span aria-hidden="true">👑 </span>
        {ts("kingTitle")} · #1 {ts("overall")}
      </p>

      <Link
        href={`/product/${king.slug}`}
        locale={locale}
        className="relative inline-block transition-transform hover:scale-[1.03]"
      >
        <div className="king-logo-ring">
          <ProductLogo
            name={king.name}
            iconUrl={king.iconUrl}
            ogImageUrl={king.ogImageUrl}
            domain={king.normalizedDomain}
            size={56}
            rounded="lg"
          />
        </div>
      </Link>

      <div className="relative">
        <Link
          href={`/product/${king.slug}`}
          locale={locale}
          className="text-xl font-black text-gold transition-colors hover:text-accent-hover sm:text-2xl"
        >
          {king.name}
        </Link>
        <p className="mt-1 text-sm text-text-muted">
          {tu("kingOfCategory", { category: king.categoryName })}
        </p>
      </div>

      <div className="relative flex justify-center px-2">
        <KingofBubble message={t("kingChallenge")} variant="ivory" tilt="left" />
      </div>

      <p className="relative text-xl font-bold tabular-nums text-gold sm:text-2xl">
        {formatBid(king.totalBid)}
      </p>

      <Link
        href="/submit"
        locale={locale}
        className="relative inline-block text-sm font-bold uppercase tracking-wide text-gold transition-colors hover:text-accent-hover"
      >
        {ts("takeTheCrown")}
      </Link>

      <RunnerPodium runners={runners} kingBid={king.totalBid} locale={locale} />
    </section>
  );
}
