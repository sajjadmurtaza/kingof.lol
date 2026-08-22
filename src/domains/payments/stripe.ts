import Stripe from "stripe";
import { SITE_URL } from "@/lib/site-url";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    if (!key.startsWith("sk_")) {
      throw new Error("STRIPE_SECRET_KEY is invalid");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export async function createBidCheckoutSession({
  productName,
  bidAmountCents,
  productSlug,
  productId,
  bidId,
  manageToken,
  email,
  locale = "en",
}: {
  productName: string;
  bidAmountCents: number;
  productSlug: string;
  productId: string;
  bidId: string;
  manageToken: string;
  email: string;
  locale?: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: bidAmountCents,
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
      bidAmount: bidAmountCents.toString(),
    },
    success_url: `${SITE_URL}/manage/${manageToken}?bid=success`,
    cancel_url: `${SITE_URL}/${locale}/product/${productSlug}`,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing redirect URL");
  }

  return session.url;
}
