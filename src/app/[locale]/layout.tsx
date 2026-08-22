import type { Viewport } from "next";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { htmlLang, localeDirection, parseLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

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
    <html
      lang={htmlLang(locale)}
      dir={localeDirection(locale)}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-text">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Nav locale={locale} />
          <main className="mx-auto max-w-[1200px] px-5">{children}</main>
          <Footer locale={locale} />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
