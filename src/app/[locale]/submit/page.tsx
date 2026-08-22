"use client";

import { useLocale, useTranslations } from "next-intl";
import { SubmissionFlow } from "@/components/submission-flow";

// Metadata is defined at the layout level or via generateMetadata in a parent.
// Since this is a "use client" page, metadata is set in the nearest server layout.

export default function SubmitPage() {
  const t = useTranslations("app.onboard");
  const locale = useLocale();

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-text-muted">{t("subtitle")}</p>
        </div>

        <SubmissionFlow locale={locale} autoFocus />

        <p className="mt-4 text-center text-sm text-text-dim">
          {t("hint")}
        </p>
      </div>
    </div>
  );
}
