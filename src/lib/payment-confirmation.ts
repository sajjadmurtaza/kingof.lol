export type PaymentConfirmation = {
  confirmed: true;
  slug: string;
  productName: string;
  bidAmountCents: number;
  totalBidCents: number;
};

export async function confirmPaymentSession(
  sessionId: string,
): Promise<PaymentConfirmation | { error: string }> {
  const res = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    reason?: string;
    confirmed?: boolean;
    slug?: string;
    productName?: string;
    bidAmountCents?: number;
    totalBidCents?: number;
  };

  if (!res.ok || !data.confirmed || !data.slug) {
    return { error: data.reason ?? data.error ?? "Confirmation failed" };
  }

  return {
    confirmed: true,
    slug: data.slug,
    productName: data.productName ?? data.slug,
    bidAmountCents: data.bidAmountCents ?? 0,
    totalBidCents: data.totalBidCents ?? data.bidAmountCents ?? 0,
  };
}
