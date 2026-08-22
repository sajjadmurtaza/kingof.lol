"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SubmissionFlow } from "@/components/submission-flow";
import { shouldShowSubmitPageHeader, type SubmissionFlowPhase } from "@/lib/submission-flow";

export default function SubmitPage() {
  const t = useTranslations("app.onboard");
  const locale = useLocale();
  const [flowPhase, setFlowPhase] = useState<SubmissionFlowPhase>("idle");
  const showHeader = shouldShowSubmitPageHeader(flowPhase);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        {showHeader ? (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 text-text-muted">{t("subtitle")}</p>
          </div>
        ) : null}

        <SubmissionFlow locale={locale} autoFocus onPhaseChange={setFlowPhase} />

        {showHeader ? <p className="mt-4 text-center text-sm text-text-dim">{t("hint")}</p> : null}
      </div>
    </div>
  );
}
