import type { Viewport } from "next";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { LocaleHtmlAttributes } from "@/components/theme-provider";
import { htmlLang, localeDirection, parseLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale = parseLocale(raw);
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlAttributes lang={htmlLang(locale)} dir={localeDirection(locale)} />
      <Nav locale={locale} />
      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-5">{children}</main>
      <Footer locale={locale} />
      <Analytics />
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}
