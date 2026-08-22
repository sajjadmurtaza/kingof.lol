import type { RankedProduct } from "@/domains/leaderboard/queries";
import type { ActivityItem, TrendingItem } from "@/domains/leaderboard/queries";

const DEMO_CATEGORIES = [
  { id: "cat-ai", slug: "ai", name: "AI & Machine Learning", emoji: "🤖", sortOrder: 1 },
  { id: "cat-fintech", slug: "fintech", name: "Fintech", emoji: "💰", sortOrder: 2 },
  { id: "cat-devtools", slug: "devtools", name: "Developer Tools", emoji: "🛠️", sortOrder: 3 },
  { id: "cat-design", slug: "design", name: "Design", emoji: "🎨", sortOrder: 4 },
  { id: "cat-saas", slug: "saas", name: "SaaS", emoji: "☁️", sortOrder: 5 },
  { id: "cat-health", slug: "health", name: "Health & Wellness", emoji: "🏥", sortOrder: 6 },
];

const ALL_PRODUCTS_RAW = [
  { id: "p1", slug: "neuralforge", name: "NeuralForge", tagline: "Train models in minutes, not months", url: "https://neuralforge.ai", totalBid: 15000, status: "approved", categoryId: "cat-ai", categorySlug: "ai", categoryName: "AI & Machine Learning", categoryEmoji: "🤖", clickCount: 42, rank: 1 },
  { id: "p2", slug: "promptpilot", name: "PromptPilot", tagline: "Your AI copilot for prompt engineering", url: "https://promptpilot.dev", totalBid: 12000, status: "approved", categoryId: "cat-ai", categorySlug: "ai", categoryName: "AI & Machine Learning", categoryEmoji: "🤖", clickCount: 38, rank: 2 },
  { id: "p3", slug: "dataweave-ai", name: "DataWeave AI", tagline: "Automated data pipelines with AI", url: "https://dataweave.ai", totalBid: 8500, status: "approved", categoryId: "cat-ai", categorySlug: "ai", categoryName: "AI & Machine Learning", categoryEmoji: "🤖", clickCount: 22, rank: 3 },
  { id: "p4", slug: "synthvoice", name: "SynthVoice", tagline: "Ultra-realistic text-to-speech", url: "https://synthvoice.io", totalBid: 6000, status: "approved", categoryId: "cat-ai", categorySlug: "ai", categoryName: "AI & Machine Learning", categoryEmoji: "🤖", clickCount: 15, rank: 4 },
  { id: "p5", slug: "visionstack", name: "VisionStack", tagline: "Computer vision made simple", url: "https://visionstack.dev", totalBid: 3000, status: "approved", categoryId: "cat-ai", categorySlug: "ai", categoryName: "AI & Machine Learning", categoryEmoji: "🤖", clickCount: 8, rank: 5 },

  { id: "p6", slug: "payflow", name: "PayFlow", tagline: "Global payments in one API call", url: "https://payflow.com", totalBid: 20000, status: "approved", categoryId: "cat-fintech", categorySlug: "fintech", categoryName: "Fintech", categoryEmoji: "💰", clickCount: 55, rank: 1 },
  { id: "p7", slug: "cryptoguard", name: "CryptoGuard", tagline: "Institutional-grade crypto custody", url: "https://cryptoguard.io", totalBid: 14000, status: "approved", categoryId: "cat-fintech", categorySlug: "fintech", categoryName: "Fintech", categoryEmoji: "💰", clickCount: 30, rank: 2 },
  { id: "p8", slug: "lendsmart", name: "LendSmart", tagline: "AI-powered lending decisions", url: "https://lendsmart.co", totalBid: 9000, status: "approved", categoryId: "cat-fintech", categorySlug: "fintech", categoryName: "Fintech", categoryEmoji: "💰", clickCount: 18, rank: 3 },
  { id: "p9", slug: "invoiceninja-pro", name: "InvoiceNinja Pro", tagline: "Invoicing that practically does itself", url: "https://invoiceninja.pro", totalBid: 5500, status: "approved", categoryId: "cat-fintech", categorySlug: "fintech", categoryName: "Fintech", categoryEmoji: "💰", clickCount: 12, rank: 4 },

  { id: "p10", slug: "codeship", name: "CodeShip", tagline: "Deploy anything in 30 seconds", url: "https://codeship.dev", totalBid: 18000, status: "approved", categoryId: "cat-devtools", categorySlug: "devtools", categoryName: "Developer Tools", categoryEmoji: "🛠️", clickCount: 47, rank: 1 },
  { id: "p11", slug: "bughunter", name: "BugHunter", tagline: "AI finds your bugs before users do", url: "https://bughunter.io", totalBid: 11000, status: "approved", categoryId: "cat-devtools", categorySlug: "devtools", categoryName: "Developer Tools", categoryEmoji: "🛠️", clickCount: 28, rank: 2 },
  { id: "p12", slug: "termforge", name: "TermForge", tagline: "The terminal, reimagined", url: "https://termforge.dev", totalBid: 7500, status: "approved", categoryId: "cat-devtools", categorySlug: "devtools", categoryName: "Developer Tools", categoryEmoji: "🛠️", clickCount: 19, rank: 3 },
  { id: "p13", slug: "apivault", name: "APIVault", tagline: "API monitoring and testing suite", url: "https://apivault.io", totalBid: 4000, status: "approved", categoryId: "cat-devtools", categorySlug: "devtools", categoryName: "Developer Tools", categoryEmoji: "🛠️", clickCount: 9, rank: 4 },
  { id: "p14", slug: "gitflow-pro", name: "GitFlow Pro", tagline: "Git workflows on autopilot", url: "https://gitflow.pro", totalBid: 2500, status: "approved", categoryId: "cat-devtools", categorySlug: "devtools", categoryName: "Developer Tools", categoryEmoji: "🛠️", clickCount: 5, rank: 5 },

  { id: "p15", slug: "pixelcraft", name: "PixelCraft", tagline: "Design-to-code in one click", url: "https://pixelcraft.design", totalBid: 16000, status: "approved", categoryId: "cat-design", categorySlug: "design", categoryName: "Design", categoryEmoji: "🎨", clickCount: 40, rank: 1 },
  { id: "p16", slug: "colormind", name: "ColorMind", tagline: "AI-generated color palettes", url: "https://colormind.io", totalBid: 10000, status: "approved", categoryId: "cat-design", categorySlug: "design", categoryName: "Design", categoryEmoji: "🎨", clickCount: 25, rank: 2 },
  { id: "p17", slug: "mockupmagic", name: "MockupMagic", tagline: "3D product mockups in seconds", url: "https://mockupmagic.com", totalBid: 5000, status: "approved", categoryId: "cat-design", categorySlug: "design", categoryName: "Design", categoryEmoji: "🎨", clickCount: 14, rank: 3 },
  { id: "p18", slug: "fontforge-ai", name: "FontForge AI", tagline: "Custom fonts generated by AI", url: "https://fontforge.ai", totalBid: 2000, status: "approved", categoryId: "cat-design", categorySlug: "design", categoryName: "Design", categoryEmoji: "🎨", clickCount: 6, rank: 4 },

  { id: "p19", slug: "metricstream", name: "MetricStream", tagline: "Real-time business analytics", url: "https://metricstream.io", totalBid: 13000, status: "approved", categoryId: "cat-saas", categorySlug: "saas", categoryName: "SaaS", categoryEmoji: "☁️", clickCount: 32, rank: 1 },
  { id: "p20", slug: "taskforge", name: "TaskForge", tagline: "Project management that actually works", url: "https://taskforge.app", totalBid: 8000, status: "approved", categoryId: "cat-saas", categorySlug: "saas", categoryName: "SaaS", categoryEmoji: "☁️", clickCount: 20, rank: 2 },
  { id: "p21", slug: "formwizard", name: "FormWizard", tagline: "Beautiful forms with zero code", url: "https://formwizard.io", totalBid: 4500, status: "approved", categoryId: "cat-saas", categorySlug: "saas", categoryName: "SaaS", categoryEmoji: "☁️", clickCount: 11, rank: 3 },
  { id: "p22", slug: "chatdesk", name: "ChatDesk", tagline: "Customer support on autopilot", url: "https://chatdesk.ai", totalBid: 1500, status: "approved", categoryId: "cat-saas", categorySlug: "saas", categoryName: "SaaS", categoryEmoji: "☁️", clickCount: 3, rank: 4 },

  { id: "p23", slug: "mindspace", name: "MindSpace", tagline: "AI-guided meditation and therapy", url: "https://mindspace.health", totalBid: 11000, status: "approved", categoryId: "cat-health", categorySlug: "health", categoryName: "Health & Wellness", categoryEmoji: "🏥", clickCount: 27, rank: 1 },
  { id: "p24", slug: "nutriscan", name: "NutriScan", tagline: "Scan food, know nutrition instantly", url: "https://nutriscan.app", totalBid: 7000, status: "approved", categoryId: "cat-health", categorySlug: "health", categoryName: "Health & Wellness", categoryEmoji: "🏥", clickCount: 16, rank: 2 },
  { id: "p25", slug: "fitcoach-ai", name: "FitCoach AI", tagline: "Your personal AI fitness trainer", url: "https://fitcoach.ai", totalBid: 3500, status: "approved", categoryId: "cat-health", categorySlug: "health", categoryName: "Health & Wellness", categoryEmoji: "🏥", clickCount: 7, rank: 3 },
];

const ALL_PRODUCTS: RankedProduct[] = ALL_PRODUCTS_RAW.map((p) => ({
  ...p,
  iconUrl: null,
  ogImageUrl: null,
  normalizedDomain: new URL(p.url).hostname.replace(/^www\./, ""),
  createdAt: new Date(Date.now() - 86400000 * (p.rank + 1)).toISOString(),
}));

export function demoTopProducts(limit = 3): RankedProduct[] {
  return [...ALL_PRODUCTS]
    .sort((a, b) => b.totalBid - a.totalBid)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export function demoCategoryKings() {
  return DEMO_CATEGORIES.map((cat) => {
    const king = ALL_PRODUCTS.filter((p) => p.categorySlug === cat.slug).sort(
      (a, b) => b.totalBid - a.totalBid,
    )[0];
    return {
      categorySlug: cat.slug,
      categoryName: cat.name,
      categoryEmoji: cat.emoji,
      king: king ? { ...king, rank: 1 } : null,
    };
  }).filter((c) => c.king !== null) as {
    categorySlug: string;
    categoryName: string;
    categoryEmoji: string;
    king: RankedProduct;
  }[];
}

export function demoMostClicked(limit = 10): RankedProduct[] {
  return [...ALL_PRODUCTS]
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export function demoRandom3(): RankedProduct[] {
  const shuffled = [...ALL_PRODUCTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((p) => ({ ...p, rank: 0 }));
}

export function demoHiddenGems(): RankedProduct[] {
  return [...ALL_PRODUCTS]
    .sort((a, b) => a.clickCount - b.clickCount)
    .slice(0, 3)
    .map((p) => ({ ...p, rank: 0 }));
}

export function demoCategoryProducts(categorySlug: string): RankedProduct[] {
  return ALL_PRODUCTS.filter((p) => p.categorySlug === categorySlug)
    .sort((a, b) => b.totalBid - a.totalBid)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

export function demoProductBySlug(slug: string): RankedProduct | null {
  const p = ALL_PRODUCTS.find((p) => p.slug === slug);
  if (!p) return null;
  const category = ALL_PRODUCTS.filter((x) => x.categorySlug === p.categorySlug).sort(
    (a, b) => b.totalBid - a.totalBid,
  );
  const rank = category.findIndex((x) => x.id === p.id) + 1;
  return { ...p, rank };
}

export function demoAllCategories() {
  return DEMO_CATEGORIES;
}

export type RisingProduct = RankedProduct & { positionsUp: number };

export function demoRising(limit = 5): RisingProduct[] {
  const risers: { slug: string; up: number }[] = [
    { slug: "neuralforge", up: 21 },
    { slug: "promptpilot", up: 14 },
    { slug: "chatdesk", up: 9 },
    { slug: "fitcoach-ai", up: 7 },
    { slug: "fontforge-ai", up: 5 },
    { slug: "formwizard", up: 4 },
    { slug: "apivault", up: 3 },
  ];

  return risers.slice(0, limit).map((r, i) => {
    const p = ALL_PRODUCTS.find((x) => x.slug === r.slug)!;
    return { ...p, rank: i + 1, positionsUp: r.up };
  });
}

export type CountryLeaderboard = {
  code: string;
  flag: string;
  name: string;
  top3: { name: string; slug: string; clicks: number }[];
};

export function demoCountryLeaderboards(): CountryLeaderboard[] {
  return [
    {
      code: "us", flag: "🇺🇸", name: "United States",
      top3: [
        { name: "PayFlow", slug: "payflow", clicks: 412 },
        { name: "CodeShip", slug: "codeship", clicks: 387 },
        { name: "NeuralForge", slug: "neuralforge", clicks: 341 },
      ],
    },
    {
      code: "gb", flag: "🇬🇧", name: "United Kingdom",
      top3: [
        { name: "CodeShip", slug: "codeship", clicks: 289 },
        { name: "PayFlow", slug: "payflow", clicks: 256 },
        { name: "PixelCraft", slug: "pixelcraft", clicks: 198 },
      ],
    },
    {
      code: "jp", flag: "🇯🇵", name: "Japan",
      top3: [
        { name: "NeuralForge", slug: "neuralforge", clicks: 267 },
        { name: "PixelCraft", slug: "pixelcraft", clicks: 201 },
        { name: "PayFlow", slug: "payflow", clicks: 178 },
      ],
    },
    {
      code: "de", flag: "🇩🇪", name: "Germany",
      top3: [
        { name: "CodeShip", slug: "codeship", clicks: 234 },
        { name: "MetricStream", slug: "metricstream", clicks: 198 },
        { name: "BugHunter", slug: "bughunter", clicks: 156 },
      ],
    },
    {
      code: "br", flag: "🇧🇷", name: "Brazil",
      top3: [
        { name: "PayFlow", slug: "payflow", clicks: 189 },
        { name: "MindSpace", slug: "mindspace", clicks: 145 },
        { name: "TaskForge", slug: "taskforge", clicks: 132 },
      ],
    },
    {
      code: "in", flag: "🇮🇳", name: "India",
      top3: [
        { name: "NeuralForge", slug: "neuralforge", clicks: 312 },
        { name: "PromptPilot", slug: "promptpilot", clicks: 278 },
        { name: "CodeShip", slug: "codeship", clicks: 201 },
      ],
    },
  ];
}

export const DEMO_ALL_PRODUCTS = ALL_PRODUCTS;

export function demoTrendingNow(limit = 5): TrendingItem[] {
  return [...ALL_PRODUCTS]
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, limit)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      iconUrl: p.iconUrl,
      ogImageUrl: p.ogImageUrl,
      normalizedDomain: p.normalizedDomain,
      clicksPerHour: Math.max(12, Math.round(p.clickCount * 2.4 + 40)),
    }));
}

export function demoRecentActivity(limit = 5): ActivityItem[] {
  const minutesAgo = [7, 11, 19, 34, 52];
  const globalRanked = [...ALL_PRODUCTS].sort((a, b) => b.totalBid - a.totalBid);

  return globalRanked.slice(0, limit).map((p, i) => {
    const at = new Date(Date.now() - minutesAgo[i]! * 60_000);
    return {
      type: i % 2 === 0 ? "bid" : "joined",
      slug: p.slug,
      name: p.name,
      iconUrl: p.iconUrl,
      ogImageUrl: p.ogImageUrl,
      normalizedDomain: p.normalizedDomain,
      totalBid: p.totalBid,
      rank: i + 1,
      categoryName: p.categoryName,
      occurredAt: at.toISOString(),
    } satisfies ActivityItem;
  });
}

export function demoHappeningNow(
  trendingLimit = 5,
  activityLimit = 5,
): { trending: TrendingItem[]; activity: ActivityItem[] } {
  return {
    trending: demoTrendingNow(trendingLimit),
    activity: demoRecentActivity(activityLimit),
  };
}
