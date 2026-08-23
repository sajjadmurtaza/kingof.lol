"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { promoErrorMessage } from "@/domains/promo/error-message";
import { formatBid } from "@/lib/format";

type PromoPreview = {
  bidCreditCents: number;
  amountPaidCents: number;
  multiplier: number;
};

export function EmailStep({
  onSubmit,
  loading,
  bidCents,
  promoCode,
  onPromoCodeChange,
  promoContext = "new_listing",
}: {
  onSubmit: (email: string) => void;
  loading: boolean;
  bidCents: number;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  promoContext?: "new_listing" | "bid_increase";
}) {
  const t = useTranslations("app.onboard");
  const [email, setEmail] = useState("");
  const [promoManuallyOpen, setPromoManuallyOpen] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoPreview, setPromoPreview] = useState<PromoPreview | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const showPromoSection = bidCents >= 500 && promoContext === "new_listing";
  const promoExpanded = promoManuallyOpen || Boolean(promoCode.trim());

  useEffect(() => {
    if (!showPromoSection || !promoExpanded) {
      const resetTimer = window.setTimeout(() => {
        setPromoPreview(null);
        setPromoError("");
        setPromoChecking(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const trimmedCode = promoCode.trim();
    const trimmedEmail = email.trim();

    if (!trimmedCode || !trimmedEmail) {
      const resetTimer = window.setTimeout(() => {
        setPromoPreview(null);
        setPromoError("");
        setPromoChecking(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = window.setTimeout(async () => {
      setPromoChecking(true);
      setPromoError("");
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: trimmedCode,
            email: trimmedEmail,
            paymentCents: bidCents,
            context: promoContext,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPromoPreview(null);
          setPromoError(promoErrorMessage(data.error, t));
          return;
        }
        setPromoPreview({
          bidCreditCents: data.bidCreditCents,
          amountPaidCents: data.amountPaidCents,
          multiplier: data.multiplier,
        });
      } catch {
        setPromoPreview(null);
        setPromoError(t("promoCheckFailed"));
      } finally {
        setPromoChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [promoCode, email, bidCents, promoContext, promoExpanded, showPromoSection, t]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (promoError) return;
    onSubmit(email.trim());
  }

  function closePromo() {
    setPromoManuallyOpen(false);
    onPromoCodeChange("");
    setPromoPreview(null);
    setPromoError("");
    setPromoChecking(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-muted">{t("almostThere")}</p>
      <p className="text-sm text-text-dim">{t("emailExplainer")}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border-2 border-border bg-bg-card py-4 px-5 text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
        />

        {showPromoSection && !promoExpanded ? (
          <button
            type="button"
            onClick={() => setPromoManuallyOpen(true)}
            className="text-sm font-medium text-gold transition-colors hover:text-accent-hover hover:underline"
          >
            {t("promoToggle")}
          </button>
        ) : null}

        {showPromoSection && promoExpanded ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm text-text-muted" htmlFor="promo-code">
                {t("promoLabel")}
              </label>
              <button
                type="button"
                onClick={closePromo}
                className="text-xs text-text-dim transition-colors hover:text-text-muted hover:underline"
              >
                {t("promoHide")}
              </button>
            </div>
            <input
              id="promo-code"
              type="text"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value)}
              placeholder={t("promoPlaceholder")}
              autoComplete="off"
              className="w-full rounded-xl border-2 border-border bg-bg-card py-3 px-5 text-text uppercase placeholder:normal-case placeholder:text-text-dim focus:border-gold focus:outline-none"
            />
            {promoChecking ? <p className="text-xs text-text-dim">{t("promoChecking")}</p> : null}
            {promoPreview && promoPreview.bidCreditCents > promoPreview.amountPaidCents ? (
              <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
                {t("promoApplied", {
                  pay: formatBid(promoPreview.amountPaidCents),
                  credit: formatBid(promoPreview.bidCreditCents),
                })}
              </p>
            ) : null}
            {promoError ? (
              <p className="text-sm text-red-400" role="alert">
                {promoError}
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !email.trim() || Boolean(promoError) || promoChecking}
          className="w-full rounded-xl bg-gold py-4 font-bold text-on-gold transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            t("continueBtn")
          )}
        </button>
      </form>
    </div>
  );
}
