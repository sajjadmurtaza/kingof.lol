import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";
import { CountryLeaderboardClient } from "@/components/country-leaderboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });

  return buildPageMetadata({
    title: t("byCountryTitle"),
    description: t("byCountryDesc"),
    path: `/${locale}/by-country`,
    hreflangPath: "/by-country",
  });
}

export default async function ByCountryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10">
      <CountryLeaderboardClient locale={locale} />
    </main>
  );
}
