import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = "https://kingof.lol";

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
    default: "KINGOF — Products Compete for the Crown",
    template: "%s | KINGOF",
  },
  description:
    "Discover and compete with products on KINGOF. Explore top products, category leaders, trending tools and rising startups.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
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
  return children;
}
