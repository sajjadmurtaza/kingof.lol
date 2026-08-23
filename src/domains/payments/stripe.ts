import Stripe from "stripe";
import { getSiteUrl } from "@/lib/site-url";

let _stripe: Stripe | null = null;

function readStripeSecretKey(): string {
  const raw = process.env.STRIPE_SECRET_KEY?.trim();
  if (!raw) throw new Error("STRIPE_SECRET_KEY not set");
  const key = raw.replace(/^['"]|['"]$/g, "");
  if (!key.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY must start with sk_ (secret key, not pk_)");
  }
  return key;
}

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(readStripeSecretKey());
  }
  return _stripe;
}

export function formatStripeError(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unknown Stripe error";
}

export async function createBidCheckoutSession({
  productName,
  paymentCents,
  bidCreditCents,
  productSlug,
  productId,
  bidId,
  email,
  locale = "en",
  promoCodeId,
}: {
  productName: string;
  paymentCents: number;
  bidCreditCents: number;
  productSlug: string;
  productId: string;
  bidId: string;
  manageToken?: string;
  successUrl?: string;
  email: string;
  locale?: string;
  promoCodeId?: string;
}): Promise<string> {
  const stripe = getStripe();
  const siteUrl = getSiteUrl();
  const checkoutSuccessUrl = `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: paymentCents,
          product_data: {
            name: `KINGOF Bid: ${productName}`,
            description: `Bid for "${productName}" on KINGOF leaderboard`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      productId,
      productSlug,
      bidId,
      bidAmount: bidCreditCents.toString(),
      amountPaid: paymentCents.toString(),
      ...(promoCodeId ? { promoCodeId } : {}),
    },
    success_url: checkoutSuccessUrl,
    cancel_url: `${siteUrl}/${locale}/product/${productSlug}`,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing redirect URL");
  }

  return session.url;
}
