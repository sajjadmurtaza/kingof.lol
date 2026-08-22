import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
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
    success_url: `${siteUrl}/manage/${manageToken}?bid=success`,
    cancel_url: `${siteUrl}/${locale}/product/${productSlug}`,
  });

  return session.url!;
}
