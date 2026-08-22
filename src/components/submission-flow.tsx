"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { ProductPreview } from "@/lib/metadata";
import { BidSelector } from "./bid-selector";
import { EmailStep } from "./email-step";
import { ExistingProductFlow } from "./existing-product-flow";
import { FallbackForm } from "./fallback-form";
import { ProductPreviewCard } from "./product-preview-card";
import { SuccessState } from "./success-state";

type Phase = "idle" | "loading" | "preview" | "existing" | "fallback" | "bid" | "email" | "success";

function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 4) return false;
  if (/^https?:\/\/.+\..+/i.test(trimmed)) return true;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(trimmed)) return true;
  return false;
}

function extractDomain(url: string): string {
  try {
    let input = url.trim();
    if (!/^https?:\/\//i.test(input)) input = `https://${input}`;
    const u = new URL(input);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch {
    return url;
  }
}

function emptyPreview(input: string): ProductPreview {
  const domain = extractDomain(input);
  return {
    url: input,
    normalizedUrl: input,
    domain,
    name: domain,
    title: null,
    description: "",
    siteName: null,
    icon: null,
    faviconUrl: null,
    appleTouchIconUrl: null,
    logoUrl: null,
    ogImage: null,
    suggestedCategory: null,
    categoryConfidence: "low",
    existing: null,
  };
}

export function SubmissionFlow({
  locale,
  autoFocus = false,
  compact = false,
}: {
  locale: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("app.onboard");
  const tUi = useTranslations("app.ui");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [category, setCategory] = useState("");
  const [bidCents, setBidCents] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [manualData, setManualData] = useState<{
    name: string;
    tagline: string;
    category: string;
  } | null>(null);
  const [resultSlug, setResultSlug] = useState("");

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const fetchPreview = useCallback(async (input: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("loading");
    setPreview(null);

    try {
      const res = await fetch("/api/products/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!res.ok) {
        setPreview(emptyPreview(input));
        setCategory("saas");
        setPhase("fallback");
        return;
      }

      const data: ProductPreview = await res.json();
      if (controller.signal.aborted) return;

      setPreview(data);
      setCategory(data.suggestedCategory ?? "saas");

      if (data.existing) {
        setPhase("existing");
      } else if (!data.name || data.name === data.domain || data.name === "") {
        setPhase("fallback");
      } else {
        if (!data.description) data.description = data.name;
        setPhase("preview");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setPreview(emptyPreview(input));
      setCategory("saas");
      setPhase("fallback");
    }
  }, []);

  function handleUrlChange(value: string) {
    setUrl(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!looksLikeUrl(value)) {
      if (phase === "loading") {
        abortRef.current?.abort();
        setPhase("idle");
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchPreview(value.trim());
    }, 700);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = url.trim();
    if (!trimmed) return;
    fetchPreview(trimmed);
  }

  function handlePreviewContinue() {
    setPhase("bid");
  }

  function handleBid(cents: number) {
    setBidCents(cents);
    setPhase("email");
  }

  function handleListFree() {
    setBidCents(0);
    setPhase("email");
  }

  function handleFallbackComplete(data: { name: string; tagline: string; category: string }) {
    setManualData(data);
    if (preview) {
      setPreview({ ...preview, name: data.name, description: data.tagline });
    }
    setCategory(data.category);
    setPhase("bid");
  }

  async function handleEmailSubmit(email: string) {
    setSubmitting(true);
    try {
      const productName = manualData?.name ?? preview?.name ?? tUi("defaultProductName");
      const productUrl = preview?.normalizedUrl ?? preview?.url ?? "";
      const tagline = manualData?.tagline ?? preview?.description ?? "";

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          url: productUrl,
          tagline: tagline || productName,
          category,
          email,
          bid: bidCents,
          iconUrl: preview?.logoUrl ?? preview?.icon,
          ogImageUrl: preview?.ogImage,
          locale,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResultSlug(data.slug ?? productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        if (data.checkoutUrl && bidCents > 0) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }
      setPhase("success");
    } catch {
      setPhase("success");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExistingBidIncrease(newTotalCents: number) {
    setBidCents(newTotalCents);
    setPhase("email");
  }

  function handleBack() {
    if (phase === "email") {
      setPhase("bid");
    } else if (phase === "bid") {
      setPhase(preview?.existing ? "existing" : preview ? "preview" : "idle");
    } else {
      setUrl("");
      setPreview(null);
      setCategory("");
      setManualData(null);
      setPhase("idle");
    }
  }

  if (phase === "bid") {
    return (
      <div className="space-y-4">
        <BackButton onClick={handleBack} />
        <BidSelector
          categorySlug={category}
          onBid={handleBid}
          onListFree={handleListFree}
          currentBid={preview?.existing?.totalBid ?? 0}
        />
      </div>
    );
  }

  if (phase === "email") {
    return (
      <div className="space-y-4">
        <BackButton onClick={handleBack} />
        <EmailStep onSubmit={handleEmailSubmit} loading={submitting} />
      </div>
    );
  }

  if (phase === "success") {
    return (
      <SuccessState
        name={manualData?.name ?? preview?.name ?? tUi("defaultProductName")}
        slug={resultSlug}
        overallRank={26}
        categoryRank={7}
        categoryEmoji=""
        categoryName={category}
        icon={preview?.icon ?? null}
        locale={locale}
      />
    );
  }

  // URL input + inline preview/loading/existing/fallback
  const showUrlSection = phase === "idle" || phase === "loading" || phase === "preview" || phase === "existing" || phase === "fallback";

  if (!showUrlSection) return null;

  return (
    <div className="space-y-5">
      {/* URL input — always visible */}
      <form onSubmit={handleSubmit} className={compact ? "flex gap-2" : "space-y-3"}>
        <div className={`relative ${compact ? "flex-1" : ""}`}>
          <span
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-text-dim ${
              compact ? "left-3" : "left-5"
            }`}
            aria-hidden="true"
          >
            <GlobeIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={t("placeholder")}
            className={
              compact
                ? "w-full rounded-xl border border-border bg-bg-card py-2.5 pl-10 pr-3 text-sm text-text placeholder:text-text-dim focus:border-gold focus:outline-none"
                : "w-full rounded-2xl border-2 border-border bg-bg-card py-4 pl-14 pr-6 text-lg text-text placeholder:text-text-dim transition-colors focus:border-gold focus:outline-none"
            }
          />
        </div>
        {compact ? (
          <button
            type="submit"
            disabled={phase === "loading" || !url.trim()}
            className="shrink-0 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-on-gold transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {phase === "loading" ? <Spinner /> : "→"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={phase === "loading" || !url.trim()}
            className="w-full rounded-2xl bg-gold py-3.5 text-lg font-bold text-on-gold transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {phase === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                {t("finding")}
              </span>
            ) : (
              t("findCta")
            )}
          </button>
        )}
      </form>

      {/* Inline loading */}
      {phase === "loading" && compact && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Spinner /> {t("finding")}
        </p>
      )}

      {/* Inline preview */}
      {phase === "preview" && preview && (
        <div className="space-y-4">
          <ProductPreviewCard
            preview={preview}
            selectedCategory={category}
            onEditCategory={setCategory}
          />
          <button
            onClick={handlePreviewContinue}
            className="w-full rounded-2xl bg-gold py-4 text-lg font-bold text-on-gold transition-colors hover:bg-accent-hover"
          >
            {t("looksGood")}
          </button>
          <p className="text-center text-xs text-text-dim">{t("editHint")}</p>
        </div>
      )}

      {/* Inline existing product */}
      {phase === "existing" && preview?.existing && (
        <div className="space-y-4">
          <BackButton onClick={handleBack} />
          <ExistingProductFlow preview={preview} onIncreaseBid={handleExistingBidIncrease} />
        </div>
      )}

      {/* Inline fallback form */}
      {phase === "fallback" && preview && (
        <div className="space-y-4">
          <BackButton onClick={handleBack} />
          <FallbackForm
            url={preview.url}
            domain={preview.domain}
            onComplete={handleFallbackComplete}
          />
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.ui");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
    >
      ← {t("back")}
    </button>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function GlobeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9" />
      <path d="M12 3c-2.5 2.8-3.8 6-3.8 9s1.3 6.2 3.8 9" />
    </svg>
  );
}
