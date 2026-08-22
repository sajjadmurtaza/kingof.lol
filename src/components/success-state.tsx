"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LetterAvatar } from "./letter-avatar";

export function SuccessState({
  name,
  slug,
  overallRank,
  categoryRank,
  categoryEmoji,
  categoryName,
  icon,
  locale,
}: {
  name: string;
  slug: string;
  overallRank: number;
  categoryRank: number;
  categoryEmoji: string;
  categoryName: string;
  icon: string | null;
  locale: string;
}) {
  const t = useTranslations("app.onboard");

  return (
    <div className="space-y-6 text-center">
      <p className="text-lg font-bold text-gold">👑 {t("onKingof")}</p>

      <div className="mx-auto flex flex-col items-center gap-3 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-8">
        {icon ? (
          <img
            src={icon}
            alt=""
            className="h-16 w-16 rounded-xl bg-surface object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <LetterAvatar name={name} size={64} />
        )}
        <h2 className="text-2xl font-black text-text">{name}</h2>

        <div className="mt-2 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-text">#{overallRank}</p>
            <p className="text-xs text-text-dim">{t("overall")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">#{categoryRank}</p>
            <p className="text-xs text-text-dim">
              {categoryEmoji} {categoryName}
            </p>
          </div>
        </div>
      </div>

      <Link
        href={`/product/${slug}`}
        locale={locale}
        className="inline-block rounded-xl bg-gold px-8 py-3 font-bold text-bg transition-colors hover:bg-accent-hover"
      >
        {t("viewListing")}
      </Link>

      <p className="text-sm text-text-dim">{t("editLater")}</p>
    </div>
  );
}
