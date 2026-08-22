"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function ListedWelcomeBanner() {
  const searchParams = useSearchParams();
  const t = useTranslations("app.onboard");

  if (searchParams.get("listed") !== "1") return null;

  return (
    <p className="mb-6 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent px-4 py-3 text-center text-lg font-bold text-gold">
      👑 {t("onKingof")}
    </p>
  );
}
