import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import enApp from "@/i18n/locales/en/app.json";
import enCommon from "@/i18n/locales/en/common.json";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: enApp.meta.manageTitle,
    description: enApp.meta.manageDesc,
    robots: { index: false, follow: false },
  };
}

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={{ app: enApp, common: enCommon }}>
      {children}
    </NextIntlClientProvider>
  );
}
