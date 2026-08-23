import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { DataFastAnalytics } from "@/components/datafast-analytics";
import { GoogleAnalytics } from "@/components/google-analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/lib/theme";
import enApp from "@/i18n/locales/en/app.json";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

import { SITE_URL } from "@/lib/site-url";

const verification: Record<string, string> = {};
if (process.env.GOOGLE_SITE_VERIFICATION) {
  verification["google-site-verification"] = process.env.GOOGLE_SITE_VERIFICATION;
}
if (process.env.BING_SITE_VERIFICATION) {
  verification["msvalidate.01"] = process.env.BING_SITE_VERIFICATION;
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: enApp.meta.rootTitle,
    template: "%s | KINGOF",
  },
  description: enApp.meta.rootDesc,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "KINGOF",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@kingof_lol",
    site: "@kingof_lol",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
  ...(Object.keys(verification).length > 0 ? { other: verification } : {}),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={DEFAULT_THEME}
      className={`${inter.variable} ${display.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-bg font-sans text-text">
        <GoogleAnalytics />
        <DataFastAnalytics />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
