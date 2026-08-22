import { randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { products, categories, bids } from "@/db/schema";
import { normalizeUrl } from "@/lib/url";
import { createBidCheckoutSession } from "@/domains/payments/stripe";
import { sendManagementLinkEmail } from "@/domains/email/resend";
import { getProductRanks } from "@/domains/leaderboard/queries";
import { notifySlack } from "@/lib/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, tagline, category, email, bid, iconUrl, ogImageUrl, locale } = body;

    if (!name || !url || !category || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bidCents = typeof bid === "number" ? Math.max(0, bid) : 0;
    const isFree = bidCents === 0;

    if (!isFree && bidCents < 500) {
      return NextResponse.json({ error: "Minimum bid is $5" }, { status: 400 });
    }

    const norm = normalizeUrl(url);
    if (!norm) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const db = getDb();

    // Check for duplicate normalized URL
    const [existing] = await db
      .select({ id: products.id, slug: products.slug })
      .from(products)
      .where(eq(products.normalizedUrl, norm.normalized))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "This product is already listed", existingSlug: existing.slug },
        { status: 409 },
      );
    }

    // Resolve category
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);

    if (!cat) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Generate management token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    // Generate slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure slug uniqueness
    const [slugExists] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (slugExists) {
      slug = `${slug}-${randomBytes(3).toString("hex")}`;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // Insert product
    const [product] = await db
      .insert(products)
      .values({
        slug,
        name,
        tagline: tagline || name,
        url,
        normalizedUrl: norm.normalized,
        normalizedDomain: norm.domain,
        categoryId: cat.id,
        email,
        manageTokenHash: tokenHash,
        totalBid: 0,
        status: isFree ? "approved" : "pending",
        iconUrl: iconUrl || null,
        ogImageUrl: ogImageUrl || null,
        description: tagline || name,
      })
      .returning({ id: products.id, slug: products.slug });

    if (!isFree) {
      // Create pending bid
      const [pendingBid] = await db
        .insert(bids)
        .values({
          productId: product.id,
          amount: bidCents,
          status: "pending",
        })
        .returning({ id: bids.id });

      // Create Stripe checkout
      try {
        const checkoutUrl = await createBidCheckoutSession({
          productName: name,
          bidAmountCents: bidCents,
          productSlug: slug,
          productId: product.id,
          bidId: pendingBid.id,
          manageToken: rawToken,
          email,
          locale: typeof locale === "string" ? locale : "en",
        });

        // Send management email (don't block on failure)
        sendManagementLinkEmail({
          to: email,
          productName: name,
          manageUrl: `${siteUrl}/manage/${rawToken}`,
        }).catch((err) => {
          Sentry.captureException(err, {
            tags: { route: "api/submit", failure: "email_send_failed" },
          });
        });

        const ranks = await getProductRanks(product.id);

        return NextResponse.json({
          success: true,
          slug,
          checkoutUrl,
          ...(ranks ?? {}),
        });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { route: "api/submit", failure: "stripe_checkout_failed" },
          extra: { productId: product.id, slug },
        });
        notifySlack(`🔴 Stripe checkout creation failed for "${name}" (${slug})`);
        return NextResponse.json({ error: "Payment setup failed" }, { status: 500 });
      }
    }

    // Free listing — send management email
    sendManagementLinkEmail({
      to: email,
      productName: name,
      manageUrl: `${siteUrl}/manage/${rawToken}`,
    }).catch((err) => {
      Sentry.captureException(err, { tags: { route: "api/submit", failure: "email_send_failed" } });
    });

    const ranks = await getProductRanks(product.id);

    return NextResponse.json({
      success: true,
      slug,
      manageUrl: `${siteUrl}/manage/${rawToken}`,
      ...(ranks ?? {}),
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/submit", failure: "database_transaction_failed" },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
