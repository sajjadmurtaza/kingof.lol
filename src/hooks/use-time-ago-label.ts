"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { timeAgoParts } from "@/lib/format";

export function useTimeAgoLabel() {
  const t = useTranslations("app.sections");
  return useCallback(
    (occurredAt: string | Date) => {
      const parts = timeAgoParts(new Date(occurredAt));
      if (parts.unit === "now") return t("timeJustNow");
      if (parts.unit === "minutes") return t("timeMinutesAgo", { count: parts.count });
      if (parts.unit === "hours") return t("timeHoursAgo", { count: parts.count });
      return t("timeDaysAgo", { count: parts.count });
    },
    [t],
  );
}
