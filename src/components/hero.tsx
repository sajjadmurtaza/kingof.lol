"use client";

import { useTranslations } from "next-intl";
import { SubmissionFlow } from "./submission-flow";

export function Hero({
  locale,
  productCount = 0,
  categoryCount = 0,
  clicksToday = 0,
  embedded = false,
}: {
  locale: string;
  productCount?: number;
  categoryCount?: number;
  clicksToday?: number;
  embedded?: boolean;
}) {
  const t = useTranslations("app.hero");
  const showStats = productCount > 0 || categoryCount > 0 || clicksToday > 0;

  return (
    <section
      className={embedded ? "text-left" : "relative overflow-hidden py-8 text-center sm:py-12"}
    >
      <div className={embedded ? "max-w-xl" : "relative mx-auto max-w-2xl"}>
        {!embedded && <p className="text-sm font-bold tracking-[0.18em] text-gold">KINGOF 👑</p>}

        <h1
          className={`font-display font-extrabold uppercase tracking-tight text-text ${
            embedded ? "text-2xl sm:text-3xl" : "mt-3 text-3xl sm:text-4xl"
          }`}
        >
          {t("title")}
        </h1>

        <p
          className={`text-text-muted ${
            embedded ? "mt-2 text-sm leading-snug sm:text-[15px]" : "mt-3 text-base sm:text-lg"
          }`}
        >
          {t("subtitle")}
        </p>

        <div className={`max-w-lg ${embedded ? "mt-4" : "mx-auto mt-6 text-left"}`}>
          <SubmissionFlow locale={locale} compact />
        </div>

        <div
          className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-dim ${
            embedded ? "mt-2" : "mt-3 justify-center"
          }`}
        >
          <span>{t("heroHint")}</span>
          {showStats && (
            <>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span>
                {t("stats", {
                  products: productCount.toLocaleString(),
                  categories: categoryCount,
                  clicks: clicksToday.toLocaleString(),
                })}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
