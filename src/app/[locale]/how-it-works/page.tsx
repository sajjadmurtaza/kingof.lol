import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("howItWorksTitle"),
    description: t("howItWorksDesc"),
    path: `/${locale}/how-it-works`,
    hreflangPath: "/how-it-works",
  });
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="py-12">
      <HowItWorksContent />
    </div>
  );
}

function HowItWorksContent() {
  const t = useTranslations("app.howItWorks");

  const mechanisms = [
    { icon: "📊", title: t("ranking"), desc: t("rankingDesc") },
    { icon: "💰", title: t("bidding"), desc: t("biddingDesc") },
    { icon: "🎲", title: t("randomTitle"), desc: t("randomDesc") },
    { icon: "🔥", title: t("clicksTitle"), desc: t("clicksDesc") },
    { icon: "💎", title: t("gemsTitle"), desc: t("gemsDesc") },
    { icon: "⚔️", title: t("dethronedTitle"), desc: t("dethronedDesc") },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <p className="mt-2 text-lg text-text-muted">{t("subtitle")}</p>

      <div className="mt-12 space-y-8">
        {mechanisms.map((m, i) => (
          <div key={i} className="flex gap-5 rounded-xl border border-border bg-bg-card p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-2xl">
              {m.icon}
            </span>
            <div>
              <h2 className="text-lg font-bold">{m.title}</h2>
              <p className="mt-1 text-text-muted leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
