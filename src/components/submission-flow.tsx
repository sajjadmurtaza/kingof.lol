"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ProductPreview } from "@/lib/metadata";
import { BidSelector } from "./bid-selector";
import { EmailStep } from "./email-step";
import { ExistingProductFlow } from "./existing-product-flow";
import { FallbackForm } from "./fallback-form";
import { ProductPreviewCard } from "./product-preview-card";
import { SuccessState } from "./success-state";
import { UrlInput } from "./url-input";

type Step =
  | "url"
  | "loading"
  | "preview"
  | "existing"
  | "fallback"
  | "bid"
  | "email"
  | "success";

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
  const [step, setStep] = useState<Step>("url");
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

  async function handleUrlSubmit(url: string) {
    setStep("loading");

    try {
      const res = await fetch("/api/products/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPreview({
          url,
          normalizedUrl: url,
          domain: extractDomain(url),
          name: extractDomain(url),
          description: "",
          icon: null,
          ogImage: null,
          suggestedCategory: null,
          categoryConfidence: "low",
          existing: null,
        });
        setCategory("saas");
        setStep("fallback");
        return;
      }

      const data: ProductPreview = await res.json();
      setPreview(data);
      setCategory(data.suggestedCategory ?? "saas");

      if (data.existing) {
        setStep("existing");
      } else if (!data.name || data.name === data.domain || data.name === "") {
        setStep("fallback");
      } else {
        if (!data.description) {
          data.description = data.name;
        }
        setStep("preview");
      }
    } catch {
      setPreview({
        url,
        normalizedUrl: url,
        domain: extractDomain(url),
        name: extractDomain(url),
        description: "",
        icon: null,
        ogImage: null,
        suggestedCategory: null,
        categoryConfidence: "low",
        existing: null,
      });
      setCategory("saas");
      setStep("fallback");
    }
  }

  function handlePreviewContinue() {
    setStep("bid");
  }

  function handleBid(cents: number) {
    setBidCents(cents);
    setStep("email");
  }

  function handleListFree() {
    setBidCents(0);
    setStep("email");
  }

  function handleFallbackComplete(data: {
    name: string;
    tagline: string;
    category: string;
  }) {
    setManualData(data);
    if (preview) {
      setPreview({ ...preview, name: data.name, description: data.tagline });
    }
    setCategory(data.category);
    setStep("bid");
  }

  async function handleEmailSubmit(email: string) {
    setSubmitting(true);

    try {
      const productName = manualData?.name ?? preview?.name ?? "Product";
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

      setStep("success");
    } catch {
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExistingBidIncrease(newTotalCents: number) {
    setBidCents(newTotalCents);
    setStep("email");
  }

  if (step === "url" || step === "loading") {
    return (
      <UrlInput
        onSubmit={handleUrlSubmit}
        loading={step === "loading"}
        autoFocus={autoFocus}
        compact={compact}
      />
    );
  }

  if (step === "existing" && preview?.existing) {
    return (
      <ExistingProductFlow preview={preview} onIncreaseBid={handleExistingBidIncrease} />
    );
  }

  if (step === "fallback" && preview) {
    return (
      <FallbackForm
        url={preview.url}
        domain={preview.domain}
        onComplete={handleFallbackComplete}
      />
    );
  }

  if (step === "preview" && preview) {
    return (
      <div className="space-y-6">
        <ProductPreviewCard
          preview={preview}
          selectedCategory={category}
          onEditCategory={setCategory}
        />
        <button
          onClick={handlePreviewContinue}
          className="w-full rounded-2xl bg-gold py-4 text-lg font-bold text-bg transition-colors hover:bg-accent-hover"
        >
          {t("looksGood")}
        </button>
        <p className="text-center text-xs text-text-dim">{t("editHint")}</p>
      </div>
    );
  }

  if (step === "bid") {
    return (
      <BidSelector
        categorySlug={category}
        onBid={handleBid}
        onListFree={handleListFree}
        currentBid={preview?.existing?.totalBid ?? 0}
      />
    );
  }

  if (step === "email") {
    return <EmailStep onSubmit={handleEmailSubmit} loading={submitting} />;
  }

  if (step === "success") {
    return (
      <SuccessState
        name={manualData?.name ?? preview?.name ?? "Your Product"}
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

  return null;
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
