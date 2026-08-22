/** Canonical public URL (no trailing slash). Set via NEXT_PUBLIC_SITE_URL in Vercel. */
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const SITE_URL = rawSiteUrl ? rawSiteUrl.replace(/\/$/, "") : "https://kingof.lol";
