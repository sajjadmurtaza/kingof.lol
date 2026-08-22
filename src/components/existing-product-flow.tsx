"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ProductPreview } from "@/lib/metadata";
import { formatBid } from "@/lib/format";
import { ProductLogo } from "./product-logo";

export function ExistingProductFlow({
  preview,
  onIncreaseBid,
}: {
  preview: ProductPreview;
  onIncreaseBid: (incrementCents: number) => void;
}) {
  const t = useTranslations("app.onboard");
  const existing = preview.existing!;
  const [newTotal, setNewTotal] = useState(existing.totalBid / 100 + 25);
  const [rankPreview, setRankPreview] = useState<{
    overallRank: number;
    categoryRank: number;
  } | null>(null);

  const amountDue = Math.max(0, newTotal * 100 - existing.totalBid);

  const fetchRank = useCallback(
    async (cents: number) => {
      try {
        const res = await fetch("/api/products/rank-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bidCents: cents,
            categorySlug: existing.categorySlug,
          }),
        });
        if (res.ok) setRankPreview(await res.json());
      } catch {
        // Non-critical
      }
    },
    [existing.categorySlug],
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchRank(newTotal * 100), 300);
    return () => clearTimeout(timer);
  }, [newTotal, fetchRank]);

  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 text-lg font-bold text-gold">
        👑 {t("welcomeBack")}
      </p>

      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-6">
        <div className="flex items-start gap-4">
          <ProductLogo
            name={existing.name}
            iconUrl={preview.icon}
            logoUrl={preview.logoUrl}
            faviconUrl={preview.faviconUrl}
            appleTouchIconUrl={preview.appleTouchIconUrl}
            ogImageUrl={preview.ogImage}
            domain={preview.domain}
            size={48}
          />
          <div>
            <h3 className="text-xl font-bold text-text">{existing.name}</h3>
            <p className="text-sm text-text-dim">{preview.domain}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface p-3 text-center">
            <p className="text-xs text-text-dim">{t("currentPosition")}</p>
            <p className="text-lg font-bold text-text">
              #{existing.rank} {existing.categoryEmoji}
            </p>
          </div>
          <div className="rounded-lg bg-surface p-3 text-center">
            <p className="text-xs text-text-dim">{t("currentBidLabel")}</p>
            <p className="text-lg font-bold text-gold">
              {formatBid(existing.totalBid)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-6">
        <p className="text-sm font-medium text-text-muted">{t("increaseTo")}</p>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-text-muted">$</span>
          <input
            type="number"
            min={existing.totalBid / 100 + 5}
            step={5}
            value={newTotal}
            onChange={(e) => setNewTotal(Math.max(existing.totalBid / 100 + 5, Number(e.target.value)))}
            className="w-full rounded-xl border-2 border-border bg-bg py-3 px-4 text-2xl font-black text-text focus:border-gold focus:outline-none"
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-surface p-3">
          <span className="text-sm text-text-muted">{t("youPay")}</span>
          <span className="text-lg font-bold text-gold">+{formatBid(amountDue)}</span>
        </div>

        {rankPreview && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-surface p-3">
            <span className="text-sm text-text-muted">{t("estimatedRank")}</span>
            <span className="font-bold text-text">#{rankPreview.overallRank}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onIncreaseBid(amountDue)}
        disabled={amountDue < 500}
        className="w-full rounded-2xl bg-gold py-4 text-lg font-bold text-on-gold transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {t("climbTo", { total: formatBid(newTotal * 100), pay: formatBid(amountDue) })}
      </button>
    </div>
  );
}
