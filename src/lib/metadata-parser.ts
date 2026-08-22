import {
  detectCategory,
  extractNameFromDomain,
  resolveRelativeUrl,
  type CategoryConfidence,
} from "./metadata";

export type ParsedMetadata = {
  name: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  logoUrl: string | null;
  ogImageUrl: string | null;
  suggestedCategory: string;
  categoryConfidence: CategoryConfidence;
  metadataSource: {
    name: string;
    description: string;
    logo: string;
  };
};

type IconLink = {
  href: string;
  rel: string;
  sizes: number;
};

const DOMAIN_CATEGORY_OVERRIDES: Record<string, string> = {
  "instagram.com": "social",
  "youtube.com": "social",
  "tiktok.com": "social",
  "twitter.com": "social",
  "x.com": "social",
  "facebook.com": "social",
  "linkedin.com": "social",
  "reddit.com": "social",
  "discord.com": "social",
  "stripe.com": "fintech",
  "paypal.com": "fintech",
  "plaid.com": "fintech",
  "github.com": "devtools",
  "gitlab.com": "devtools",
  "vercel.com": "devtools",
  "netlify.com": "devtools",
  "cursor.com": "devtools",
  "figma.com": "design",
  "canva.com": "design",
  "shopify.com": "ecommerce",
  "amazon.com": "ecommerce",
  "duolingo.com": "education",
  "coursera.org": "education",
  "notion.so": "productivity",
  "linear.app": "productivity",
  "1password.com": "security",
  "plausible.io": "analytics",
  "hubspot.com": "marketing",
};

export function parseHtmlMetadata(html: string, pageUrl: string, domain: string): ParsedMetadata {
  const ogSiteName = extractMeta(html, "og:site_name");
  const ogTitle = extractMeta(html, "og:title");
  const twitterTitle = extractMetaName(html, "twitter:title");
  const appName = extractMetaName(html, "application-name");
  const titleTag = extractTitle(html);

  const ogDesc = extractMeta(html, "og:description");
  const twitterDesc = extractMetaName(html, "twitter:description");
  const metaDesc = extractMetaName(html, "description");

  const ogImage =
    extractMeta(html, "og:image:secure_url") ||
    extractMeta(html, "og:image") ||
    extractMetaName(html, "twitter:image") ||
    extractMetaName(html, "twitter:image:src");

  const icons = extractIconLinks(html);
  const appleTouchIconUrl = pickBestIcon(icons, pageUrl, (link) =>
    link.rel.includes("apple-touch-icon"),
  );
  const faviconUrl =
    pickBestIcon(icons, pageUrl, (link) => /(^|\s)(icon|shortcut icon)(\s|$)/i.test(link.rel)) ||
    resolveRelativeUrl(pageUrl, "/favicon.ico");

  const logoUrl = appleTouchIconUrl || faviconUrl;

  let nameSource = "domain";
  let name =
    cleanProductName(ogSiteName) ||
    cleanProductName(appName) ||
    cleanProductName(ogTitle) ||
    cleanProductName(twitterTitle) ||
    cleanProductName(titleTag) ||
    extractNameFromDomain(domain);

  if (ogSiteName) nameSource = "og:site_name";
  else if (appName) nameSource = "application-name";
  else if (ogTitle) nameSource = "og:title";
  else if (twitterTitle) nameSource = "twitter:title";
  else if (titleTag) nameSource = "title";

  let descriptionSource = "none";
  let description = normalizeDescription(ogDesc || twitterDesc || metaDesc || "");
  if (ogDesc) descriptionSource = "og:description";
  else if (twitterDesc) descriptionSource = "twitter:description";
  else if (metaDesc) descriptionSource = "meta:description";

  const logoSource = appleTouchIconUrl ? "apple-touch-icon" : "favicon";

  const overrideCategory = DOMAIN_CATEGORY_OVERRIDES[domain];
  const combinedText = `${name} ${description} ${domain}`;
  const detected = detectCategory(combinedText, domain);
  const suggestedCategory = overrideCategory ?? detected.slug;
  const categoryConfidence: CategoryConfidence = overrideCategory ? "high" : detected.confidence;

  return {
    name,
    title: titleTag || ogTitle || null,
    description: description || null,
    siteName: ogSiteName || appName || null,
    faviconUrl,
    appleTouchIconUrl,
    logoUrl,
    ogImageUrl: ogImage ? resolveRelativeUrl(pageUrl, ogImage) : null,
    suggestedCategory,
    categoryConfidence,
    metadataSource: {
      name: nameSource,
      description: descriptionSource,
      logo: logoSource,
    },
  };
}

export function pickDisplayIcon(input: {
  iconUrl?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  appleTouchIconUrl?: string | null;
  ogImageUrl?: string | null;
  domain?: string | null;
}): string | null {
  return (
    input.iconUrl ||
    input.logoUrl ||
    input.appleTouchIconUrl ||
    input.faviconUrl ||
    (input.domain ? `https://${input.domain}/favicon.ico` : null) ||
    input.ogImageUrl ||
    null
  );
}

function cleanProductName(raw: string): string {
  if (!raw) return "";
  let name = decodeEntities(raw.trim());
  const separators = [" • ", " · ", " | ", " — ", " - ", " – "];
  for (const sep of separators) {
    if (name.includes(sep)) {
      const [left, right] = name.split(sep);
      if (left.length <= right.length) {
        name = left.trim();
      } else {
        name = right.trim();
      }
    }
  }
  return name.trim();
}

function normalizeDescription(raw: string): string {
  const text = decodeEntities(raw.replace(/\s+/g, " ").trim());
  if (!text) return "";
  if (text.length > 160) return `${text.slice(0, 157)}...`;
  return text;
}

function extractIconLinks(html: string): IconLink[] {
  const links: IconLink[] = [];
  const regex = /<link\b([^>]*?)>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const attrs = match[1];
    const rel = readAttr(attrs, "rel");
    const href = readAttr(attrs, "href");
    if (!rel || !href) continue;
    if (!/icon|apple-touch-icon|mask-icon|shortcut/i.test(rel)) continue;
    links.push({
      href,
      rel: rel.toLowerCase(),
      sizes: parseSizes(readAttr(attrs, "sizes")),
    });
  }
  return links;
}

function pickBestIcon(
  links: IconLink[],
  pageUrl: string,
  predicate: (link: IconLink) => boolean,
): string | null {
  const candidates = links.filter(predicate).sort((a, b) => b.sizes - a.sizes);
  const href = candidates[0]?.href;
  return href ? resolveRelativeUrl(pageUrl, href) : null;
}

function parseSizes(raw: string): number {
  if (!raw) return 0;
  const match = raw.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return 0;
  return Number(match[1]) * Number(match[2]);
}

function readAttr(attrs: string, name: string): string {
  const regex = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  const match = attrs.match(regex);
  return match ? match[1] : "";
}

function extractMeta(html: string, property: string): string {
  const regex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(regex);
  if (match) return decodeEntities(match[1]);

  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i",
  );
  const altMatch = html.match(alt);
  return altMatch ? decodeEntities(altMatch[1]) : "";
}

function extractMetaName(html: string, name: string): string {
  const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const match = html.match(regex);
  if (match) return decodeEntities(match[1]);

  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i");
  const altMatch = html.match(alt);
  return altMatch ? decodeEntities(altMatch[1]) : "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : "";
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
