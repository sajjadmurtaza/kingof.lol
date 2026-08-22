import type { ProductPreview } from "@/lib/metadata";

export type SubmitOutcome =
  | { type: "redirect_checkout"; url: string }
  | { type: "redirect_product"; slug: string }
  | { type: "error"; message: string };

export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 4) return false;
  if (/^https?:\/\/.+\..+/i.test(trimmed)) return true;
  if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(trimmed)) return true;
  return false;
}

export function extractDomain(url: string): string {
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

export function emptyPreview(input: string): ProductPreview {
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

export function slugFromProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Decide post-submit navigation — never show inline success for free listings. */
export function resolveSubmitOutcome(
  response: { ok: boolean; data: { error?: string; slug?: string; checkoutUrl?: string } },
  opts: { bidCents: number; productName: string; fallbackError: string },
): SubmitOutcome {
  if (!response.ok) {
    return {
      type: "error",
      message: typeof response.data.error === "string" ? response.data.error : opts.fallbackError,
    };
  }

  if (response.data.checkoutUrl && opts.bidCents > 0) {
    return { type: "redirect_checkout", url: response.data.checkoutUrl };
  }

  const slug = response.data.slug || slugFromProductName(opts.productName);
  if (slug) {
    return { type: "redirect_product", slug };
  }

  return { type: "error", message: opts.fallbackError };
}

export type PreviewPhase = "idle" | "preview" | "existing" | "fallback";

export type SubmissionFlowPhase = PreviewPhase | "loading" | "bid" | "email";

export function resolvePreviewPhase(preview: ProductPreview): PreviewPhase {
  if (preview.existing) return "existing";
  if (!preview.name || preview.name === preview.domain || preview.name === "") {
    return "fallback";
  }
  return "preview";
}

/** Phases where the submit page marketing header should stay visible. */
export function shouldShowSubmitPageHeader(phase: SubmissionFlowPhase): boolean {
  return phase === "idle" || phase === "loading" || phase === "preview" || phase === "fallback";
}
