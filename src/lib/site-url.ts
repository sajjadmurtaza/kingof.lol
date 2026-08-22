/** Canonical public URL (no trailing slash). Set via NEXT_PUBLIC_SITE_URL in Vercel. */
export function getSiteUrl(): string {
  const raw = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

  if (raw) {
    const url = raw.replace(/\/$/, "");
    // Guard against localhost baked in at build time on production hosts.
    if (process.env.VERCEL === "1" && /localhost|127\.0\.0\.1/i.test(url)) {
      return "https://kingof.lol";
    }
    return url;
  }

  return "https://kingof.lol";
}

/** @deprecated Prefer getSiteUrl() in server code so env is read at request time. */
export const SITE_URL = getSiteUrl();
