"use client";

import { useTranslations } from "next-intl";
import { SubmissionFlow } from "./submission-flow";

export function Hero({ locale }: { locale: string }) {
  const t = useTranslations("app.hero");

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-text sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base text-text-muted sm:text-lg">{t("subtitle")}</p>

        <div className="mx-auto mt-8 max-w-lg">
          <SubmissionFlow locale={locale} compact />
        </div>

        <p className="mt-3 text-sm text-text-dim">{t("heroHint")}</p>
      </div>
    </section>
  );
}
