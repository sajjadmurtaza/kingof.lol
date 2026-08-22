"use client";

import { useLocale, useTranslations } from "next-intl";
import { SubmissionFlow } from "@/components/submission-flow";

export default function SubmitPage() {
  const t = useTranslations("app.onboard");
  const locale = useLocale();

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-5xl">👑</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </div>

        <SubmissionFlow locale={locale} autoFocus />
      </div>
    </div>
  );
}
