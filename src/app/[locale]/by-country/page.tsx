import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";
import { CountryLeaderboardClient } from "@/components/country-leaderboard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({
    title: "Top Products by Country",
    description:
      "See which products are trending in your country. Explore top-clicked products by region on KINGOF — auto-detected from your location.",
    path: `/${locale}/by-country`,
  });
}

export default async function ByCountryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-[1200px] px-5 py-10">
      <CountryLeaderboardClient locale={locale} />
    </main>
  );
}
