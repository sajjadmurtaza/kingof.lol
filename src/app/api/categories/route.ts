import { NextResponse } from "next/server";
import { getAllCategories } from "@/domains/leaderboard/queries";

export async function GET() {
  try {
    const cats = await getAllCategories();
    return NextResponse.json(cats);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
