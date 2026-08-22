import { isIP } from "node:net";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "ttclid",
  "li_fat_id",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "s",
]);

export function normalizeUrl(raw: string): { normalized: string; domain: string } | null {
  let input = raw.trim();
  if (!input) return null;

  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  let host = url.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  if (!host || host.length < 3) return null;

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }

  const path = url.pathname.replace(/\/+$/, "") || "";
  const search = url.searchParams.toString();
  const normalized = `https://${host}${path}${search ? `?${search}` : ""}`;

  return { normalized, domain: host };
}

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^198\.1[89]\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
  /^ff[0-9a-f]{2}:/i,
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "[::1]",
]);

export function isPrivateOrBlocked(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(lower)) return true;

  if (isIP(lower)) {
    return PRIVATE_RANGES.some((r) => r.test(lower));
  }

  if (lower.endsWith(".local") || lower.endsWith(".internal") || lower.endsWith(".localhost")) {
    return true;
  }

  return false;
}

export function validateFetchUrl(raw: string): { url: URL; domain: string } | { error: string } {
  let input = raw.trim();
  if (!input) return { error: "URL is required" };

  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { error: "Invalid URL" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { error: "Only HTTP and HTTPS URLs are supported" };
  }

  if (url.username || url.password) {
    return { error: "URLs with credentials are not supported" };
  }

  const hostname = url.hostname.toLowerCase();

  if (isPrivateOrBlocked(hostname)) {
    return { error: "This URL cannot be accessed" };
  }

  let domain = hostname;
  if (domain.startsWith("www.")) domain = domain.slice(4);

  return { url, domain };
}

export function findExistingByNormalizedUrl(
  normalizedUrl: string,
  products: Array<{
    url: string;
    slug: string;
    name: string;
    totalBid: number;
    categorySlug: string;
  }>,
): (typeof products)[0] | null {
  const result = normalizeUrl(normalizedUrl);
  if (!result) return null;

  for (const p of products) {
    const pNorm = normalizeUrl(p.url);
    if (pNorm && pNorm.domain === result.domain) {
      return p;
    }
  }

  return null;
}
