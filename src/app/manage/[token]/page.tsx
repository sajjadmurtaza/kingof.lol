"use client";

import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { useSearchParams } from "next/navigation";
import { use, useState, useEffect, useCallback } from "react";
import { formatBid } from "@/lib/format";
import { confirmPaymentSession } from "@/lib/payment-confirmation";
import { ProductLogo } from "@/components/product-logo";

type ProductData = {
  name: string;
  tagline: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  totalBid: number;
  clickCount: number;
  overallRank: number;
  categoryRank: number;
  categoryName: string;
  categorySlug: string;
  categoryEmoji: string;
  slug: string;
} | null;

type RankPreview = {
  overallRank: number;
  categoryRank: number;
  categoryName: string;
  categoryEmoji: string;
};

export default function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const t = useTranslations("app.manage");
  const tOnboard = useTranslations("app.onboard");
  const [bidIncrease, setBidIncrease] = useState(500);
  const [product, setProduct] = useState<ProductData>(null);
  const [displayBidCents, setDisplayBidCents] = useState<number | null>(null);
  const [rankPreview, setRankPreview] = useState<RankPreview | null>(null);
  const [rankPreviewLoading, setRankPreviewLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);

  const loadProduct = useCallback(() => {
    return fetch(`/api/manage/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: NonNullable<ProductData>) => {
        setProduct(data);
        setDisplayBidCents((current) => current ?? data.totalBid);
      });
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (sessionId) {
          const result = await confirmPaymentSession(sessionId);
          if (!cancelled && !("error" in result)) {
            setPaymentConfirmed(true);
            setDisplayBidCents(result.totalBidCents);
          }
        }

        await loadProduct();

        if (!cancelled && sessionId) {
          const refreshed = await fetch(`/api/manage/${token}`).then((r) => r.json());
          if (refreshed?.totalBid != null) {
            setDisplayBidCents(refreshed.totalBid);
          }
        }
      } catch {
        if (!cancelled) setError(t("notFoundError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [token, sessionId, loadProduct, t]);

  useEffect(() => {
    if (!product) return;

    const projectedBidCents = (displayBidCents ?? product.totalBid) + bidIncrease;
    const timer = setTimeout(async () => {
      setRankPreviewLoading(true);
      try {
        const res = await fetch("/api/products/rank-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bidCents: projectedBidCents,
            categorySlug: product.categorySlug,
          }),
        });
        if (res.ok) {
          setRankPreview(await res.json());
        }
      } catch {
        // Rank preview is non-critical
      } finally {
        setRankPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [product, bidIncrease, displayBidCents]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-muted">{t("loading")}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-text">{t("invalidLinkTitle")}</p>
          <p className="mt-2 text-text-muted">{error || t("invalidLinkDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-black">{t("title")}</h1>

      {paymentConfirmed ? (
        <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-medium text-gold">
          {t("paymentConfirmed", { amount: formatBid(displayBidCents ?? product.totalBid) })}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-start gap-4">
            <ProductLogo
              name={product.name}
              iconUrl={product.iconUrl}
              ogImageUrl={product.ogImageUrl}
              domain={product.normalizedDomain}
              size={48}
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-text">{product.name}</h2>
              <p className="mt-1 text-text-muted">{product.tagline}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">{t("rankLabel")}</p>
              <p className="text-lg font-bold">#{product.overallRank}</p>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">{t("categoryRankLabel")}</p>
              <p className="text-lg font-bold text-gold">#{product.categoryRank}</p>
              <p className="mt-0.5 truncate text-[10px] text-text-dim">
                {product.categoryEmoji} {product.categoryName}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">{t("currentBid")}</p>
              <p className="text-lg font-bold text-gold">
                {formatBid(displayBidCents ?? product.totalBid)}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-3 text-center">
              <p className="text-xs text-text-dim">{t("clicksLabel")}</p>
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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
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
            {rankPreview && !rankPreviewLoading ? (
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-text-dim">
                  {tOnboard("putsYouAt")}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {t("rankAtBid", {
                    amount: formatBid((displayBidCents ?? product.totalBid) + bidIncrease),
                  })}
                </p>
                <div className="mt-3 flex justify-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-black text-text">#{rankPreview.overallRank}</p>
                    <p className="text-xs text-text-dim">{tOnboard("overall")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gold">#{rankPreview.categoryRank}</p>
                    <p className="text-xs text-text-dim">
                      {rankPreview.categoryEmoji} {rankPreview.categoryName}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              disabled={paying}
              onClick={async () => {
                setPaymentError("");
                setPaying(true);
                try {
                  const res = await fetch(`/api/manage/${token}/increase-bid`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: bidIncrease }),
                  });
                  const data = await res.json();
                  if (res.ok && data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                    return;
                  }
                  setPaymentError(typeof data.error === "string" ? data.error : t("paymentFailed"));
                } catch (err) {
                  Sentry.captureException(err, {
                    tags: { route: "manage/increase-bid" },
                  });
                  setPaymentError(t("paymentFailed"));
                } finally {
                  setPaying(false);
                }
              }}
              className="w-full rounded-lg bg-gold py-3 font-bold text-on-gold transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {paying ? t("loading") : `${t("payButton")} — ${formatBid(bidIncrease)}`}
            </button>
            {paymentError ? (
              <p className="text-sm text-danger" role="alert">
                {paymentError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
