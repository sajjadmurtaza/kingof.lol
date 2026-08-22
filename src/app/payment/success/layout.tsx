import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import enApp from "@/i18n/locales/en/app.json";
import enCommon from "@/i18n/locales/en/common.json";

export const metadata: Metadata = {
  title: "Payment successful — KINGOF",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={{ app: enApp, common: enCommon }}>
      {children}
    </NextIntlClientProvider>
  );
}
