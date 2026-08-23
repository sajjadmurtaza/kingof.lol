import Script from "next/script";
import { getSiteUrl } from "@/lib/site-url";

export function DataFastAnalytics() {
  const websiteId = process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID;
  if (!websiteId) return null;

  const domain = process.env.NEXT_PUBLIC_DATAFAST_DOMAIN?.trim() || new URL(getSiteUrl()).hostname;

  return (
    <Script
      id="datafast-analytics"
      src="https://datafa.st/js/script.cookieless.js"
      strategy="afterInteractive"
      defer
      data-website-id={websiteId}
      data-domain={domain}
    />
  );
}
