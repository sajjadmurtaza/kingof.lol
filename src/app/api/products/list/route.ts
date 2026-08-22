import { NextResponse } from "next/server";
import { getProductsPaginated, type ProductListSort } from "@/domains/leaderboard/queries";
import {
  NEW_LISTINGS_WITHIN_MINUTES,
  PRODUCT_PAGE_SIZE,
  PRODUCT_PAGE_SIZE_MAX,
} from "@/lib/product-pagination";

function parseSort(value: string | null): ProductListSort {
  return value === "new" ? "new" : "bid";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = parseSort(searchParams.get("sort"));
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(
      PRODUCT_PAGE_SIZE_MAX,
      Math.max(
        1,
        Number(searchParams.get("limit") ?? String(PRODUCT_PAGE_SIZE)) || PRODUCT_PAGE_SIZE,
      ),
    );
    const minutes = Math.min(
      60,
      Math.max(
        1,
        Number(searchParams.get("minutes") ?? String(NEW_LISTINGS_WITHIN_MINUTES)) ||
          NEW_LISTINGS_WITHIN_MINUTES,
      ),
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
      { products: [], total: 0, page: 1, pageSize: PRODUCT_PAGE_SIZE, hasMore: false },
      { status: 500 },
    );
  }
}
