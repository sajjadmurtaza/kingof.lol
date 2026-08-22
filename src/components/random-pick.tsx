"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KingofBubble } from "@/components/kingof-bubble";
import { ProductLogo } from "./product-logo";
import { useDiscoveryPick } from "@/hooks/use-discovery-pick";

export type RandomPickProduct = {
  slug: string;
  name: string;
  tagline: string;
  iconUrl: string | null;
  ogImageUrl: string | null;
  normalizedDomain: string;
  categoryName?: string;
};

function PickSpinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-lavender-text border-t-transparent" />
  );
}

export function RandomPick({
  initial,
  locale,
  pickMs,
  cooldownMs,
}: {
  initial: RandomPickProduct;
  locale: string;
  pickMs?: number;
  cooldownMs?: number;
}) {
  const tv = useTranslations("app.voice");
  const t = useTranslations("app.sections");
  const { item, picking, pickSecondsLeft, cooldownSecondsLeft, canPickAgain, pickAnother } =
    useDiscoveryPick({
      initial,
      fetchUrl: (exclude) => `/api/products/random?exclude=${encodeURIComponent(exclude)}`,
      pickMs,
      cooldownMs,
    });

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-dim">
        🎲 {t("randomPick")}
      </p>

      {picking ? (
        <div className="lavender-planner-card flex min-h-[120px] flex-col items-center justify-center gap-2 py-6 text-center">
          <PickSpinner />
          <p className="text-sm font-medium text-lavender-text">{t("randomPicking")}</p>
          {pickSecondsLeft > 0 && (
            <p className="text-xs tabular-nums text-lavender-text/70">
              {t("randomPickingCountdown", { seconds: pickSecondsLeft })}
            </p>
          )}
        </div>
      ) : (
        <div className="lavender-planner-card space-y-4 p-4">
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

          <KingofBubble message={tv("random")} variant="lavender" className="!shadow-none" />

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/product/${item.slug}`}
              locale={locale}
              className="text-sm font-medium text-lavender-text transition-colors hover:text-text"
            >
              {t("discoverRandom")}
            </Link>
            <button
              type="button"
              onClick={pickAnother}
              disabled={!canPickAgain}
              className="text-sm text-text-muted transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              {cooldownSecondsLeft > 0
                ? t("discoverCooldown", { seconds: cooldownSecondsLeft })
                : `🎲 ${t("discoverAnother")}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
