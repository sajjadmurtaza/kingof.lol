"use client";

import { useTranslations } from "next-intl";
import { SubmissionFlow } from "./submission-flow";

export function Hero({
  locale,
  productCount = 0,
  categoryCount = 0,
  clicksToday = 0,
}: {
  locale: string;
  productCount?: number;
  categoryCount?: number;
  clicksToday?: number;
}) {
  const t = useTranslations("app.hero");
  const showStats = productCount > 0 || categoryCount > 0 || clicksToday > 0;

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="relative mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black uppercase tracking-tight text-text sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base text-text-muted sm:text-lg">{t("subtitle")}</p>

        <div className="mx-auto mt-8 max-w-lg text-left">
          <SubmissionFlow locale={locale} compact />
        </div>

        <p className="mt-3 text-sm text-text-dim">{t("heroHint")}</p>

        {showStats && (
          <p className="mt-6 text-sm text-text-dim">
            {t("stats", {
              products: productCount.toLocaleString(),
              categories: categoryCount,
              clicks: clicksToday.toLocaleString(),
            })}
          </p>
        )}
      </div>
    </section>
  );
}
