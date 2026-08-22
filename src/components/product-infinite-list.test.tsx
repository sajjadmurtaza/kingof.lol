import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { PaginatedProductsResult } from "@/domains/leaderboard/queries";
import en from "@/i18n/locales/en/app.json";

vi.mock("@/components/product-leaderboard-row", () => ({
  ProductLeaderboardRow: ({ product }: { product: { name: string } }) => <div>{product.name}</div>,
}));

import { ProductInfiniteList } from "./product-infinite-list";

function makeProduct(id: string, rank: number) {
  return {
    id,
    slug: id,
    name: `Product ${id}`,
    tagline: "Tagline",
    url: `https://${id}.com`,
    iconUrl: null,
    ogImageUrl: null,
    normalizedDomain: `${id}.com`,
    totalBid: rank * 1000,
    status: "approved",
    categoryId: "cat-1",
    categorySlug: "saas",
    categoryName: "SaaS",
    categoryEmoji: "☁️",
    clickCount: 0,
    rank,
    createdAt: new Date().toISOString(),
  };
}

function makeInitial(productCount: number, total: number): PaginatedProductsResult {
  return {
    products: Array.from({ length: productCount }, (_, i) => makeProduct(`p${i + 1}`, i + 1)),
    total,
    page: 1,
    pageSize: 10,
    hasMore: productCount < total,
  };
}

function renderList(initial: PaginatedProductsResult) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ app: en }}>
      <ProductInfiniteList initial={initial} sort="bid" locale="en" pageSize={10} />
    </NextIntlClientProvider>,
  );
}

describe("ProductInfiniteList", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          products: [makeProduct("p11", 11), makeProduct("p12", 12)],
          total: 15,
          page: 2,
          pageSize: 10,
          hasMore: false,
        }),
      })),
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
        constructor() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows only the first page on mount even if the server sent more", () => {
    renderList(makeInitial(15, 15));

    expect(screen.getByText("Product p1")).toBeInTheDocument();
    expect(screen.getByText("Product p10")).toBeInTheDocument();
    expect(screen.queryByText("Product p11")).not.toBeInTheDocument();
    expect(screen.getByText("1 – 10 of 15")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });

  it("loads the next page when Load more is clicked", async () => {
    renderList(makeInitial(10, 15));

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => {
      expect(screen.getByText("Product p11")).toBeInTheDocument();
    });
    expect(screen.getByText("1 – 12 of 15")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/products/list?sort=bid&page=2&limit=10");
  });
});
