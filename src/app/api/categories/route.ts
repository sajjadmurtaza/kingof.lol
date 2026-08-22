import { NextResponse } from "next/server";
import { getAllCategories } from "@/domains/leaderboard/queries";

const FALLBACK_CATEGORIES = [
  { slug: "ai", name: "AI & Machine Learning", emoji: "🤖", sortOrder: 1 },
  { slug: "fintech", name: "Fintech", emoji: "💳", sortOrder: 2 },
  { slug: "devtools", name: "Developer Tools", emoji: "🛠️", sortOrder: 3 },
  { slug: "design", name: "Design", emoji: "🎨", sortOrder: 4 },
  { slug: "saas", name: "SaaS", emoji: "☁️", sortOrder: 5 },
  { slug: "health", name: "Health & Wellness", emoji: "💚", sortOrder: 6 },
  { slug: "education", name: "Education", emoji: "📚", sortOrder: 7 },
  { slug: "ecommerce", name: "E-Commerce", emoji: "🛒", sortOrder: 8 },
  { slug: "social", name: "Social", emoji: "💬", sortOrder: 9 },
  { slug: "productivity", name: "Productivity", emoji: "⚡", sortOrder: 10 },
];

export async function GET() {
  try {
    const cats = await getAllCategories();
    return NextResponse.json(cats);
  } catch {
    return NextResponse.json(FALLBACK_CATEGORIES);
  }
}
