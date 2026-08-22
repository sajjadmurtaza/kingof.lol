import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingof.lol";

export function buildMetadata(
  locale: string,
  page: string,
  overrides: Partial<Metadata> = {},
): Metadata {
  const canonical = `${SITE_URL}/${locale}${page ? `/${page}` : ""}`;

  return {
    metadataBase: new URL(SITE_URL),
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale,
      url: canonical,
      siteName: "KINGOF",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}
