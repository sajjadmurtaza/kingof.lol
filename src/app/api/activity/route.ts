import { NextResponse } from "next/server";
import { getHappeningNow } from "@/domains/leaderboard/queries";
import { demoHappeningNow } from "@/lib/demo-data";

export async function GET() {
  try {
    const data = await getHappeningNow(5, 5);
    if (data.trending.length === 0 && data.activity.length === 0) {
      return NextResponse.json(demoHappeningNow(5, 5));
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(demoHappeningNow(5, 5));
  }
}
