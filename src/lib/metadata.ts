export type CategoryConfidence = "high" | "medium" | "low";

export type ProductPreview = {
  url: string;
  normalizedUrl: string;
  domain: string;
  name: string;
  title: string | null;
  description: string;
  siteName: string | null;
  icon: string | null;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  logoUrl: string | null;
  ogImage: string | null;
  suggestedCategory: string | null;
  categoryConfidence: CategoryConfidence;
  metadataSource?: {
    name: string;
    description: string;
    logo: string;
  };
  existing: {
    slug: string;
    name: string;
    totalBid: number;
    rank: number;
    categorySlug: string;
    categoryName: string;
    categoryEmoji: string;
  } | null;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ai: [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "deep learning",
    "neural",
    "gpt",
    "llm",
    "nlp",
    "computer vision",
    "generative",
    "chatbot",
    "copilot",
    "model",
    "training",
    "inference",
  ],
  fintech: [
    "fintech",
    "finance",
    "payment",
    "banking",
    "crypto",
    "blockchain",
    "trading",
    "investment",
    "wallet",
    "lending",
    "invoice",
    "accounting",
    "insurance",
  ],
  devtools: [
    "developer",
    "devtool",
    "api",
    "sdk",
    "cli",
    "terminal",
    "code",
    "git",
    "deploy",
    "ci/cd",
    "testing",
    "debug",
    "monitoring",
    "infrastructure",
    "database",
    "backend",
    "open source",
  ],
  design: [
    "design",
    "ui",
    "ux",
    "figma",
    "sketch",
    "mockup",
    "prototype",
    "illustration",
    "color",
    "font",
    "typography",
    "icon",
    "animation",
    "3d",
    "graphic",
  ],
  saas: [
    "saas",
    "platform",
    "project management",
    "collaboration",
    "productivity",
    "workflow",
    "automation",
    "crm",
    "erp",
    "helpdesk",
    "support",
    "analytics",
    "dashboard",
    "form",
    "survey",
    "scheduling",
    "email marketing",
    "no-code",
    "low-code",
  ],
  health: [
    "health",
    "wellness",
    "fitness",
    "meditation",
    "mental health",
    "therapy",
    "nutrition",
    "diet",
    "exercise",
    "sleep",
    "medical",
    "telehealth",
    "wearable",
  ],
};

const DOMAIN_CATEGORY_OVERRIDES: Record<string, string> = {
  "instagram.com": "social",
  "youtube.com": "social",
  "tiktok.com": "social",
  "twitter.com": "social",
  "x.com": "social",
  "facebook.com": "social",
  "linkedin.com": "social",
  "stripe.com": "fintech",
  "github.com": "devtools",
  "vercel.com": "devtools",
  "cursor.com": "devtools",
  "figma.com": "design",
  "shopify.com": "ecommerce",
  "duolingo.com": "education",
};

export function detectCategory(
  text: string,
  domain?: string,
): { slug: string; confidence: CategoryConfidence } {
  if (domain && DOMAIN_CATEGORY_OVERRIDES[domain]) {
    return { slug: DOMAIN_CATEGORY_OVERRIDES[domain], confidence: "high" };
  }

  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > 0) scores[cat] = score;
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return { slug: "saas", confidence: "low" };

  const [topSlug, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? 0;

  if (topScore >= 3 && topScore > secondScore * 1.5) {
    return { slug: topSlug, confidence: "high" };
  }
  if (topScore >= 2) {
    return { slug: topSlug, confidence: "medium" };
  }
  return { slug: topSlug, confidence: "low" };
}

export function extractNameFromDomain(domain: string): string {
  const parts = domain.split(".");
  const name = parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function resolveRelativeUrl(base: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("//")) {
    return path.startsWith("//") ? `https:${path}` : path;
  }
  try {
    return new URL(path, base).href;
  } catch {
    return "";
  }
}
