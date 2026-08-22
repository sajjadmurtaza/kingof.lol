import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/domains/marketing/seo-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.meta" });
  return buildPageMetadata({
    title: t("submitTitle"),
    description: t("submitDesc"),
    path: `/${locale}/submit`,
    hreflangPath: "/submit",
  });
}

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
