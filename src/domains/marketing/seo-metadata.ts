import type { Metadata } from "next";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, htmlLang } from "@/i18n/config";
import { SITE_URL } from "@/lib/site-url";

/**
 * hreflangPath is the path WITHOUT a locale prefix (e.g. "/categories", "" for home).
 * When provided, we emit an <link rel="alternate" hreflang> entry per supported
 * locale plus x-default, so search engines treat the locale variants as
 * translations of one page instead of duplicate content.
 */
function buildLanguageAlternates(hreflangPath: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[htmlLang(locale)] = `${SITE_URL}/${locale}${hreflangPath}`;
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${hreflangPath}`;
  return languages;
}

export function buildPageMetadata({
  title,
  description,
  path = "",
  hreflangPath,
  ogTitle,
  ogDescription,
  noIndex = false,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path?: string;
  hreflangPath?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
  absoluteTitle?: boolean;
}): Metadata {
  const canonical = `${SITE_URL}${path}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      ...(hreflangPath !== undefined ? { languages: buildLanguageAlternates(hreflangPath) } : {}),
    },
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      url: canonical,
      type: "website",
      siteName: "KINGOF",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description: ogDescription ?? description,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export type JsonLdWebSite = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
};

export type JsonLdOrganization = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
};

export type JsonLdBreadcrumb = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
};

export function websiteJsonLd(
  description = "Product leaderboard and discovery platform. Products compete for the crown.",
): JsonLdWebSite {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KINGOF",
    url: SITE_URL,
    description,
  };
}

export function organizationJsonLd(): JsonLdOrganization {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KINGOF",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  };
}

export function breadcrumbJsonLd(items: { name: string; path?: string }[]): JsonLdBreadcrumb {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  };
}
