import { eq, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { ProductPreview } from "@/lib/metadata";
import { extractNameFromDomain } from "@/lib/metadata";
import { parseHtmlMetadata } from "@/lib/metadata-parser";
import { getCachedMetadata, setCachedMetadata } from "@/lib/metadata-cache";
import { normalizeUrl, validateFetchUrl } from "@/lib/url";
import { tryGetDb } from "@/db";
import { products, categories } from "@/db/schema";

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 512_000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUrl: string = body.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const validation = validateFetchUrl(rawUrl);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const norm = normalizeUrl(rawUrl);
    if (!norm) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const db = tryGetDb();

    if (db) {
      try {
        const [existing] = await db
          .select({
            id: products.id,
            slug: products.slug,
            name: products.name,
            tagline: products.tagline,
            iconUrl: products.iconUrl,
            ogImageUrl: products.ogImageUrl,
            totalBid: products.totalBid,
            categoryId: products.categoryId,
            categorySlug: categories.slug,
            categoryName: categories.name,
            categoryEmoji: categories.emoji,
          })
          .from(products)
          .innerJoin(categories, eq(products.categoryId, categories.id))
          .where(eq(products.normalizedDomain, norm.domain))
          .orderBy(desc(products.totalBid))
          .limit(1);

        if (existing) {
          const ranked = await db
            .select({ id: products.id })
            .from(products)
            .where(
              and(eq(products.categoryId, existing.categoryId), eq(products.status, "approved")),
            )
            .orderBy(desc(products.totalBid));

          const rank = ranked.findIndex((r) => r.id === existing.id) + 1;

          const preview: ProductPreview = {
            url: rawUrl,
            normalizedUrl: norm.normalized,
            domain: norm.domain,
            name: existing.name,
            title: existing.name,
            description: existing.tagline,
            siteName: existing.name,
            icon: existing.iconUrl,
            faviconUrl: existing.iconUrl,
            appleTouchIconUrl: existing.iconUrl,
            logoUrl: existing.iconUrl,
            ogImage: existing.ogImageUrl,
            suggestedCategory: existing.categorySlug,
            categoryConfidence: "high",
            metadataSource: { name: "database", description: "database", logo: "database" },
            existing: {
              slug: existing.slug,
              name: existing.name,
              totalBid: existing.totalBid,
              rank,
              categorySlug: existing.categorySlug,
              categoryName: existing.categoryName,
              categoryEmoji: existing.categoryEmoji,
            },
          };

          return NextResponse.json(preview);
        }
      } catch {
        // Continue with metadata extraction
      }
    }

    const cached = await getCachedMetadata(norm.domain);
    if (cached) {
      return NextResponse.json({ ...cached, url: rawUrl, normalizedUrl: norm.normalized });
    }

    let html = "";
    let fetchSuccess = false;
    let finalPageUrl = validation.url.href;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(validation.url.href, {
        signal: controller.signal,
        headers: {
          "User-Agent": "KINGOFBot/1.0 (+https://kingof.lol/bot)",
          Accept: "text/html",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);
      finalPageUrl = res.url;

      const finalHost = new URL(res.url).hostname.toLowerCase();
      const { isPrivateOrBlocked } = await import("@/lib/url");
      if (isPrivateOrBlocked(finalHost)) {
        return NextResponse.json({ error: "This URL cannot be accessed" }, { status: 400 });
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/html") || contentType.includes("text/plain")) {
        const reader = res.body?.getReader();
        if (reader) {
          const chunks: Uint8Array[] = [];
          let totalBytes = 0;
          while (totalBytes < MAX_BODY_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalBytes += value.length;
          }
          reader.cancel();
          html = new TextDecoder().decode(
            new Uint8Array(chunks.reduce((acc, c) => [...acc, ...c], [] as number[])),
          );
          fetchSuccess = true;
        }
      }
    } catch {
      fetchSuccess = false;
    }

    let parsed;
    if (fetchSuccess && html) {
      parsed = parseHtmlMetadata(html, finalPageUrl, norm.domain);
    } else {
      const fallbackName = extractNameFromDomain(norm.domain);
      parsed = {
        name: fallbackName,
        title: fallbackName,
        description: null,
        siteName: null,
        faviconUrl: `https://${norm.domain}/favicon.ico`,
        appleTouchIconUrl: null,
        logoUrl: `https://${norm.domain}/favicon.ico`,
        ogImageUrl: null,
        suggestedCategory: "saas",
        categoryConfidence: "low" as const,
        metadataSource: { name: "domain", description: "none", logo: "domain-favicon" },
      };
    }

    const preview: ProductPreview = {
      url: rawUrl,
      normalizedUrl: norm.normalized,
      domain: norm.domain,
      name: parsed.name,
      title: parsed.title,
      description: parsed.description ?? "",
      siteName: parsed.siteName,
      icon: parsed.logoUrl,
      faviconUrl: parsed.faviconUrl,
      appleTouchIconUrl: parsed.appleTouchIconUrl,
      logoUrl: parsed.logoUrl,
      ogImage: parsed.ogImageUrl,
      suggestedCategory: parsed.suggestedCategory,
      categoryConfidence: parsed.categoryConfidence,
      metadataSource: parsed.metadataSource,
      existing: null,
    };

    await setCachedMetadata(norm.domain, preview);

    return NextResponse.json(preview);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/products/preview", failure: "metadata_preview_failed" },
    });
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
