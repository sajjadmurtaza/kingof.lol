"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { formatBid } from "@/lib/format";

type RankPreview = {
  overallRank: number;
  categoryRank: number;
  categoryName: string;
  categoryEmoji: string;
  totalProducts: number;
  milestones: { label: string; bid: number; rank: number }[];
};

export function BidSelector({
  categorySlug,
  onBid,
  onListFree,
  currentBid = 0,
}: {
  categorySlug: string;
  onBid: (bidCents: number) => void;
  onListFree: () => void;
  currentBid?: number;
}) {
  const t = useTranslations("app.onboard");
  const [bidDollars, setBidDollars] = useState(currentBid > 0 ? currentBid / 100 + 5 : 25);
  const [rankPreview, setRankPreview] = useState<RankPreview | null>(null);
  const [loading, setLoading] = useState(false);

  const bidCents = bidDollars * 100;

  const fetchRank = useCallback(async (cents: number, cat: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/products/rank-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidCents: cents, categorySlug: cat }),
      });
      if (res.ok) {
        setRankPreview(await res.json());
      }
    } catch {
      // Rank preview is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchRank(bidCents, categorySlug), 300);
    return () => clearTimeout(timer);
  }, [bidCents, categorySlug, fetchRank]);

  function adjustBid(delta: number) {
    setBidDollars((prev) => Math.max(5, prev + delta));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-text-muted">
          {t("readyToJoin")}
        </p>
      </div>

      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-6">
        <p className="text-sm font-medium uppercase tracking-wider text-text-muted">
          {t("howHigh")}
        </p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => adjustBid(-5)}
            disabled={bidDollars <= 5}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-xl font-bold text-text transition-colors hover:border-border-bright disabled:opacity-30"
          >
            −
          </button>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-bold text-gold">
              $
            </span>
            <input
              type="number"
              min={5}
              step={5}
              value={bidDollars}
              onChange={(e) => setBidDollars(Math.max(5, Number(e.target.value)))}
              className="w-32 rounded-xl border-2 border-gold/30 bg-bg py-3 pl-10 pr-4 text-center text-3xl font-black text-gold focus:border-gold focus:outline-none"
            />
          </div>

          <button
            onClick={() => adjustBid(5)}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface text-xl font-bold text-text transition-colors hover:border-border-bright"
          >
            +
          </button>
        </div>

        {rankPreview && !loading && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-text-dim">
              {t("putsYouAt")}
            </p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-text">#{rankPreview.overallRank}</p>
                <p className="text-xs text-text-dim">{t("overall")}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gold">#{rankPreview.categoryRank}</p>
                <p className="text-xs text-text-dim">
                  {rankPreview.categoryEmoji} {rankPreview.categoryName}
                </p>
              </div>
            </div>

            {rankPreview.milestones.length > 0 && (
              <div className="mt-4 space-y-2 rounded-xl bg-surface p-4">
                {rankPreview.milestones.slice(0, 3).map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setBidDollars(m.bid / 100)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-bg-elevated"
                  >
                    <span className="text-text-muted">{m.label}</span>
                    <span className="font-bold text-gold">{formatBid(m.bid)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex justify-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onBid(bidCents)}
          className="w-full rounded-2xl bg-gold py-4 text-lg font-bold text-on-gold transition-colors hover:bg-accent-hover"
        >
          👑 {t("compete")} — {formatBid(bidCents)}
        </button>

        <button
          onClick={onListFree}
          className="w-full rounded-2xl border border-border py-3 text-sm font-medium text-text-muted transition-colors hover:border-border-bright hover:text-text"
        >
          {t("listFree")}
        </button>
      </div>
    </div>
  );
}
