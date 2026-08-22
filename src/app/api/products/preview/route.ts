import { eq, desc, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { ProductPreview } from "@/lib/metadata";
import { detectCategory, extractNameFromDomain, resolveRelativeUrl } from "@/lib/metadata";
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

    // DB lookup is optional — preview works without a database
    const db = tryGetDb();

    if (db) {
      try {
        const [existing] = await db
          .select({
            id: products.id,
            slug: products.slug,
            name: products.name,
            tagline: products.tagline,
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
            description: existing.tagline,
            icon: null,
            ogImage: null,
            suggestedCategory: existing.categorySlug,
            categoryConfidence: "high",
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
        // DB query failed — continue with metadata extraction
      }
    }

    // Fetch page metadata
    let html = "";
    let fetchSuccess = false;

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

      const finalHost = new URL(res.url).hostname.toLowerCase();
      const { isPrivateOrBlocked } = await import("@/lib/url");
      if (isPrivateOrBlocked(finalHost)) {
        return NextResponse.json({ error: "This URL cannot be accessed" }, { status: 400 });
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        html = "";
      } else {
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

    let name = extractNameFromDomain(norm.domain);
    let description = "";
    let icon: string | null = null;
    let ogImage: string | null = null;

    if (fetchSuccess && html) {
      const ogSiteName = extractMeta(html, "og:site_name");
      const ogTitle = extractMeta(html, "og:title");
      const titleTag = extractTitle(html);
      const ogDesc = extractMeta(html, "og:description");
      const metaDesc = extractMetaName(html, "description") ?? extractMetaName(html, "Description");
      const ogImg = extractMeta(html, "og:image");

      name = ogSiteName || ogTitle || titleTag || name;
      if (name.includes(" - ")) name = name.split(" - ")[0].trim();
      if (name.includes(" | ")) name = name.split(" | ")[0].trim();
      if (name.includes(" — ")) name = name.split(" — ")[0].trim();

      description = ogDesc || metaDesc || "";
      if (description.length > 120) description = description.slice(0, 117) + "...";

      const appleTouchIcon = extractLinkHref(html, "apple-touch-icon");
      const favicon = extractLinkHref(html, "icon") || extractLinkHref(html, "shortcut icon");

      if (appleTouchIcon) {
        icon = resolveRelativeUrl(validation.url.href, appleTouchIcon);
      } else if (favicon) {
        icon = resolveRelativeUrl(validation.url.href, favicon);
      } else {
        icon = `https://${norm.domain}/favicon.ico`;
      }

      if (ogImg) {
        ogImage = resolveRelativeUrl(validation.url.href, ogImg);
      }
    }

    const combinedText = `${name} ${description} ${norm.domain}`;
    const { slug: catSlug, confidence } = detectCategory(combinedText);

    const preview: ProductPreview = {
      url: rawUrl,
      normalizedUrl: norm.normalized,
      domain: norm.domain,
      name,
      description,
      icon,
      ogImage,
      suggestedCategory: catSlug,
      categoryConfidence: confidence,
      existing: null,
    };

    return NextResponse.json(preview);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/products/preview", failure: "metadata_preview_failed" },
    });
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
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

function extractLinkHref(html: string, rel: string): string {
  const regex = new RegExp(
    `<link[^>]+rel=["'][^"']*${rel}[^"']*["'][^>]+href=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(regex);
  if (match) return match[1];

  const alt = new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${rel}[^"']*["']`, "i");
  const altMatch = html.match(alt);
  return altMatch ? altMatch[1] : "";
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
