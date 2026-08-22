"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductLogo } from "@/components/product-logo";
import { formatClicks } from "@/lib/format";
import { useDiscoveryPick } from "@/hooks/use-discovery-pick";

export type HiddenGemProduct = {
  slug: string;
  name: string;
  tagline: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  clickCount: number;
};

function PickSpinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gem-note-text border-t-transparent" />
  );
}

export function HiddenGemCard({
  initial,
  locale,
  pickMs,
  cooldownMs,
}: {
  initial: HiddenGemProduct;
  locale: string;
  pickMs?: number;
  cooldownMs?: number;
}) {
  const t = useTranslations("app.voice");
  const ts = useTranslations("app.sections");
  const { item, picking, pickSecondsLeft, cooldownSecondsLeft, canPickAgain, pickAnother } =
    useDiscoveryPick({
      initial,
      fetchUrl: (exclude) => `/api/products/hidden-gem?exclude=${encodeURIComponent(exclude)}`,
      pickMs,
      cooldownMs,
    });

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-dim">
        💎 {ts("hiddenGems")}
      </p>

      {picking ? (
        <div className="gem-sticky-note flex min-h-[140px] flex-col items-center justify-center gap-2 py-8 text-center !rotate-0">
          <PickSpinner />
          <p className="text-sm font-medium text-gem-note-text">{ts("gemPicking")}</p>
          {pickSecondsLeft > 0 && (
            <p className="text-xs tabular-nums text-gem-note-text/70">
              {ts("randomPickingCountdown", { seconds: pickSecondsLeft })}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <ProductLogo
              name={item.name}
              iconUrl={item.iconUrl}
              ogImageUrl={item.ogImageUrl}
              domain={item.normalizedDomain}
              size={36}
            />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-text">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-text-muted">{item.tagline}</p>
            </div>
          </div>

          <div className="gem-sticky-note space-y-3 text-left !rotate-0">
            <p className="text-sm leading-relaxed text-gem-note-text">
              {t("hiddenGem", { count: formatClicks(item.clickCount) })}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/product/${item.slug}`}
                locale={locale}
                className="text-sm font-medium text-gem-note-text/80 transition-colors hover:text-gem-note-text"
              >
                {ts("discoverGem")}
              </Link>
              <button
                type="button"
                onClick={pickAnother}
                disabled={!canPickAgain}
                className="text-sm text-gem-note-text/60 transition-colors hover:text-gem-note-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cooldownSecondsLeft > 0
                  ? ts("discoverCooldown", { seconds: cooldownSecondsLeft })
                  : `💎 ${ts("discoverGemAnother")}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
