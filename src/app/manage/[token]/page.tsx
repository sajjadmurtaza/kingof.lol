"use client";

import { useTranslations } from "next-intl";
import { use, useState, useEffect } from "react";
import { formatBid } from "@/lib/format";

type ProductData = {
  name: string;
  tagline: string;
  totalBid: number;
  clickCount: number;
  rank: number;
  categoryName: string;
  slug: string;
} | null;

export default function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations("app.manage");
  const [bidIncrease, setBidIncrease] = useState(500);
  const [product, setProduct] = useState<ProductData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/manage/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setProduct)
      .catch(() => setError("Product not found or invalid management link."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-text">Invalid Link</p>
          <p className="mt-2 text-text-muted">
            {error || "This management link is not valid."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-black">{t("title")}</h1>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h2 className="text-xl font-bold text-text">{product.name}</h2>
          <p className="mt-1 text-text-muted">{product.tagline}</p>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">Rank</p>
              <p className="text-lg font-bold">#{product.rank}</p>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">{t("currentBid")}</p>
              <p className="text-lg font-bold text-gold">
                {formatBid(product.totalBid)}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">Clicks</p>
              <p className="text-lg font-bold">{product.clickCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h3 className="font-bold">{t("increaseBid")}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-muted">{t("bidIncrease")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  $
                </span>
                <input
                  type="number"
                  min={5}
                  step={1}
                  value={bidIncrease / 100}
                  onChange={(e) => setBidIncrease(Math.max(500, Number(e.target.value) * 100))}
                  className="w-full rounded-lg border border-border bg-bg py-3 pl-8 pr-4 text-text focus:border-gold focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/manage/${token}/increase-bid`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: bidIncrease }),
                  });
                  const data = await res.json();
                  if (data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                  }
                } catch (err) {
                  console.error("Bid increase failed:", err);
                }
              }}
              className="w-full rounded-lg bg-gold py-3 font-bold text-bg transition-colors hover:bg-accent-hover"
            >
              {t("payButton")} — {formatBid(bidIncrease)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
