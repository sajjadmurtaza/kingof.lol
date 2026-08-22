import { NextResponse } from "next/server";
import {
  getProductsPaginated,
  type ProductListSort,
} from "@/domains/leaderboard/queries";

function parseSort(value: string | null): ProductListSort {
  return value === "new" ? "new" : "bid";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = parseSort(searchParams.get("sort"));
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10") || 10));
    const minutes = Math.min(
      60,
      Math.max(1, Number(searchParams.get("minutes") ?? "5") || 5),
    );

    const data = await getProductsPaginated({
      sort,
      page,
      pageSize: limit,
      newWithinMinutes: minutes,
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { products: [], total: 0, page: 1, pageSize: 10, hasMore: false },
      { status: 500 },
    );
  }
}
