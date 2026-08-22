import { randomBytes, createHash } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getDb } from "@/db";
import { products, categories } from "@/db/schema";
import { normalizeUrl } from "@/lib/url";
import { createPaidBidCheckout } from "@/domains/payments/create-paid-bid-checkout";
import { sendManagementLinkEmail } from "@/domains/email/resend";
import { getProductRanks } from "@/domains/leaderboard/queries";
import { notifySlack } from "@/lib/slack";
import { getSiteUrl } from "@/lib/site-url";

function paymentCentsForExisting({
  bidCents,
  totalBid,
  bidIsIncrement,
}: {
  bidCents: number;
  totalBid: number;
  bidIsIncrement: boolean;
}): number {
  if (bidIsIncrement) return bidCents;
  return Math.max(0, bidCents - totalBid);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      url,
      tagline,
      category,
      email,
      bid,
      iconUrl,
      ogImageUrl,
      locale,
      bidIsIncrement,
    } = body;

    if (!name || !url || !category || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bidCents = typeof bid === "number" ? Math.max(0, bid) : 0;
    const isFree = bidCents === 0;
    const treatBidAsIncrement = bidIsIncrement === true;
    const resolvedLocale = typeof locale === "string" ? locale : "en";
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isFree && bidCents < 500 && treatBidAsIncrement) {
      return NextResponse.json({ error: "Minimum bid is $5" }, { status: 400 });
    }

    const norm = normalizeUrl(url);
    if (!norm) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const db = getDb();

    const [existing] = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        email: products.email,
        totalBid: products.totalBid,
      })
      .from(products)
      .where(eq(products.normalizedDomain, norm.domain))
      .orderBy(desc(products.totalBid))
      .limit(1);

    if (existing) {
      if (isFree) {
        const ranks = await getProductRanks(existing.id);
        return NextResponse.json({
          success: true,
          slug: existing.slug,
          alreadyListed: true,
          ...(ranks ?? {}),
        });
      }

      if (existing.email.toLowerCase() !== normalizedEmail) {
        return NextResponse.json(
          { error: "Use the same email address you used when you first listed this product." },
          { status: 403 },
        );
      }

      const paymentCents = paymentCentsForExisting({
        bidCents,
        totalBid: existing.totalBid,
        bidIsIncrement: treatBidAsIncrement,
      });

      if (paymentCents < 500) {
        return NextResponse.json({ error: "Minimum bid increase is $5" }, { status: 400 });
      }

      const checkout = await createPaidBidCheckout({
        db,
        product: existing,
        paymentCents,
        email: existing.email,
        locale: resolvedLocale,
      });

      if ("error" in checkout) {
        Sentry.captureMessage("Stripe checkout failed for existing product", {
          level: "error",
          extra: { productId: existing.id, slug: existing.slug, reason: checkout.reason },
        });
        notifySlack(
          `🔴 Stripe checkout failed for existing "${existing.name}" (${existing.slug}): ${checkout.reason ?? checkout.error}`,
        );
        return NextResponse.json(
          { error: checkout.error, reason: checkout.reason },
          { status: 500 },
        );
      }

      const ranks = await getProductRanks(existing.id);

      return NextResponse.json({
        success: true,
        slug: existing.slug,
        checkoutUrl: checkout.checkoutUrl,
        alreadyListed: true,
        ...(ranks ?? {}),
      });
    }

    if (!isFree && bidCents < 500) {
      return NextResponse.json({ error: "Minimum bid is $5" }, { status: 400 });
    }

    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);

    if (!cat) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [slugExists] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (slugExists) {
      slug = `${slug}-${randomBytes(3).toString("hex")}`;
    }

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
        email: normalizedEmail,
        manageTokenHash: tokenHash,
        totalBid: 0,
        status: isFree ? "approved" : "pending",
        iconUrl: iconUrl || null,
        ogImageUrl: ogImageUrl || null,
        description: tagline || name,
      })
      .returning({ id: products.id, slug: products.slug });

    if (!isFree) {
      const checkout = await createPaidBidCheckout({
        db,
        product: { id: product.id, slug: product.slug, name },
        paymentCents: bidCents,
        email: normalizedEmail,
        locale: resolvedLocale,
        manageToken: rawToken,
      });

      if ("error" in checkout) {
        try {
          await db.delete(products).where(eq(products.id, product.id));
        } catch (cleanupErr) {
          Sentry.captureException(cleanupErr, {
            tags: { route: "api/submit", failure: "stripe_checkout_cleanup_failed" },
            extra: { productId: product.id, slug },
          });
        }

        notifySlack(`🔴 Stripe checkout failed for "${name}" (${slug}): ${checkout.reason ?? checkout.error}`);
        return NextResponse.json(
          { error: checkout.error, reason: checkout.reason },
          { status: 500 },
        );
      }

      sendManagementLinkEmail({
        to: normalizedEmail,
        productName: name,
        manageUrl: `${getSiteUrl()}/manage/${rawToken}`,
      }).catch((err) => {
        Sentry.captureException(err, {
          tags: { route: "api/submit", failure: "email_send_failed" },
        });
      });

      const ranks = await getProductRanks(product.id);

      return NextResponse.json({
        success: true,
        slug,
        checkoutUrl: checkout.checkoutUrl,
        ...(ranks ?? {}),
      });
    }

    sendManagementLinkEmail({
      to: normalizedEmail,
      productName: name,
      manageUrl: `${getSiteUrl()}/manage/${rawToken}`,
    }).catch((err) => {
      Sentry.captureException(err, { tags: { route: "api/submit", failure: "email_send_failed" } });
    });

    const ranks = await getProductRanks(product.id);

    return NextResponse.json({
      success: true,
      slug,
      manageUrl: `${getSiteUrl()}/manage/${rawToken}`,
      ...(ranks ?? {}),
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/submit", failure: "database_transaction_failed" },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
