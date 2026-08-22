/** Country code from CDN / edge headers (Vercel, Netlify, Cloudflare). */
export function getRequestCountryCode(request: Request): string | null {
  const code =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-country") ||
    request.headers.get("cf-ipcountry");

  return code?.toUpperCase() ?? null;
}
