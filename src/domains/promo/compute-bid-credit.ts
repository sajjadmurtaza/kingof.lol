/** Compute rank credit from payment and multiplier (basis points, 200 = 2×). */
export function computeBidCreditCents(paymentCents: number, multiplierBasisPoints: number): number {
  return Math.round((paymentCents * multiplierBasisPoints) / 100);
}
